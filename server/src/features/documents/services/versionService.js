const DocumentVersion = require("../models/DocumentVersion");
const Document = require("../models/Document");
const { logger } = require("../../../shared/utils/logger");

/**
 * VersionService - Handles intelligent document versioning
 * Only creates versions when meaningful changes occur
 */
class VersionService {
  constructor() {
    // Configuration for version creation thresholds
    this.config = {
      // Time-based: create version after 5 minutes of continuous editing
      intervalMinutes: 5,
      // Change-based: create version if 10% of content changed
      changePercentageThreshold: 0.1,
      // Minimum character changes to consider significant
      minCharChangeThreshold: 50,
      // Maximum versions to keep (for future use)
      maxVersions: null,
    };

    // In-memory tracking for active editing sessions
    // In production, this could be moved to Redis for multi-instance deployments
    this.activeSessions = new Map();
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   * Returns percentage of change (0-1)
   */
  calculateChangePercentage(oldContent, newContent) {
    if (!oldContent && !newContent) return 0;
    if (!oldContent) return 1;
    if (!newContent) return 1;

    const oldLen = oldContent.length;
    const newLen = newContent.length;
    const maxLen = Math.max(oldLen, newLen);

    if (maxLen === 0) return 0;

    // Simple character-based diff for performance
    // For more accuracy, could use a proper diff library
    let changes = 0;
    const minLen = Math.min(oldLen, newLen);

    for (let i = 0; i < minLen; i++) {
      if (oldContent[i] !== newContent[i]) changes++;
    }

    // Add length difference as changes
    changes += Math.abs(oldLen - newLen);

    return changes / maxLen;
  }

  /**
   * Count meaningful character changes (added, removed, modified)
   */
  countCharChanges(oldContent, newContent) {
    if (!oldContent && !newContent) return 0;
    if (!oldContent) return newContent.length;
    if (!newContent) return oldContent.length;

    let changes = 0;
    const minLen = Math.min(oldContent.length, newContent.length);

    for (let i = 0; i < minLen; i++) {
      if (oldContent[i] !== newContent[i]) changes++;
    }

    changes += Math.abs(oldContent.length - newContent.length);
    return changes;
  }

  /**
   * Check if content is identical to previous version
   */
  isContentIdentical(oldContent, newContent) {
    return oldContent === newContent;
  }

  /**
   * Get or create an active editing session for a document
   */
  getSession(documentId) {
    if (!this.activeSessions.has(documentId)) {
      this.activeSessions.set(documentId, {
        lastVersionContent: null,
        lastVersionTime: null,
        changeAccumulator: 0,
        isEditing: false,
      });
    }
    return this.activeSessions.get(documentId);
  }

  /**
   * Update session with new content
   */
  updateSession(documentId, content) {
    const session = this.getSession(documentId);
    const now = Date.now();

    if (session.lastVersionContent !== null) {
      const charChanges = this.countCharChanges(session.lastVersionContent, content);
      const changePercent = this.calculateChangePercentage(session.lastVersionContent, content);

      session.changeAccumulator += charChanges;

      // Check if we should create a version based on accumulated changes
      const shouldCreateByChange = 
        changePercent >= this.config.changePercentageThreshold &&
        session.changeAccumulator >= this.config.minCharChangeThreshold;

      // Check if 5 minutes have passed since last version
      const timeSinceLastVersion = session.lastVersionTime 
        ? now - session.lastVersionTime 
        : Infinity;
      const shouldCreateByTime = timeSinceLastVersion >= this.config.intervalMinutes * 60 * 1000;

      session.isEditing = true;

      return {
        shouldCreate: shouldCreateByChange || shouldCreateByTime,
        reason: shouldCreateByChange ? "significant_change" : "interval",
        changePercent,
        charChanges: session.changeAccumulator,
        timeSinceLastVersion,
      };
    }

    // First update after version creation
    session.lastVersionContent = content;
    session.lastVersionTime = now;
    session.changeAccumulator = 0;
    session.isEditing = true;

    return { shouldCreate: false };
  }

  /**
   * Mark that a version was created, reset session tracking
   */
  markVersionCreated(documentId, content) {
    const session = this.getSession(documentId);
    session.lastVersionContent = content;
    session.lastVersionTime = Date.now();
    session.changeAccumulator = 0;
  }

  /**
   * Mark document as closed - create final version if there are unsaved changes
   */
  async handleDocumentClose(documentId, userId, currentContent) {
    const session = this.getSession(documentId);
    
    if (!session.isEditing || session.lastVersionContent === null) {
      return { created: false, reason: "no_changes" };
    }

    // Check if there are any changes since last version
    if (this.isContentIdentical(session.lastVersionContent, currentContent)) {
      this.activeSessions.delete(documentId);
      return { created: false, reason: "identical" };
    }

    // Create a version for document close
    const version = await this.createVersion({
      documentId,
      authorId: userId,
      title: (await Document.findById(documentId).select("title").lean())?.title || "Untitled",
      content: currentContent,
      reason: "close_document",
    });

    this.activeSessions.delete(documentId);
    return { created: true, version, reason: "close_document" };
  }

  /**
   * Create a new document version
   */
  async createVersion({ documentId, authorId, title, content, reason, changeDescription }) {
    const latestVersion = await DocumentVersion.findOne({ document: documentId })
      .sort({ versionNumber: -1 })
      .select("versionNumber")
      .lean();

    const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    const version = await DocumentVersion.create({
      document: documentId,
      title,
      content: content || "",
      author: authorId,
      versionNumber,
      changeDescription: changeDescription || this.getDefaultDescription(reason),
      reason,
      isAutosave: reason !== "manual",
    });

    // Update session tracking
    this.markVersionCreated(documentId, content);

    logger.info(
      { documentId, versionNumber, reason, authorId },
      "Document version created"
    );

    return version;
  }

  /**
   * Get default description based on reason
   */
  getDefaultDescription(reason) {
    const descriptions = {
      manual: "Manual save",
      interval: "Auto-save interval (5 minutes)",
      significant_change: "Significant content change detected",
      close_document: "Document closed",
      restore: "Restored from previous version",
    };
    return descriptions[reason] || "Version created";
  }

  /**
   * Get document versions with pagination
   */
  async getVersions(documentId, userId, { page = 1, limit = 20 } = {}) {
    const doc = await Document.findById(documentId);
    if (!doc) throw new Error("Document not found");

    const { getDocumentUserRole } = require("../../../shared/middleware/permissionMiddleware");
    const userRole = getDocumentUserRole(doc, userId);
    if (!userRole) throw new Error("Unauthorized: Access denied");

    const skip = (page - 1) * limit;

    const [total, versions] = await Promise.all([
      DocumentVersion.countDocuments({ document: documentId }),
      DocumentVersion.find({ document: documentId })
        .populate("author", "name email profilePicture")
        .sort({ versionNumber: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return {
      versions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Restore document to a specific version
   */
  async restoreVersion(documentId, versionNumber, userId) {
    const doc = await Document.findById(documentId);
    if (!doc) throw new Error("Document not found");

    const { getDocumentUserRole } = require("../../../shared/middleware/permissionMiddleware");
    const userRole = getDocumentUserRole(doc, userId);
    if (!userRole || userRole === "Viewer" || userRole === "Commenter") {
      throw new Error("Unauthorized: Editor or Owner permissions required");
    }

    const version = await DocumentVersion.findOne({ document: documentId, versionNumber });
    if (!version) throw new Error("Version not found");

    const updatedDoc = await Document.findByIdAndUpdate(
      documentId,
      { title: version.title, content: version.content },
      { new: true, runValidators: true }
    )
      .populate("owner", "name email profilePicture")
      .populate("collaborators.user", "name email profilePicture")
      .lean();

    // Create a new version for the restore action
    const latestVersion = await DocumentVersion.findOne({ document: documentId })
      .sort({ versionNumber: -1 })
      .select("versionNumber")
      .lean();

    const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    await DocumentVersion.create({
      document: documentId,
      title: version.title,
      content: version.content,
      author: userId,
      versionNumber: newVersionNumber,
      changeDescription: `Restored from version ${versionNumber}`,
      reason: "restore",
      isAutosave: false,
    });

    return updatedDoc;
  }
}

// Export singleton instance
module.exports = new VersionService();