const DocumentVersion = require("../models/DocumentVersion");
const Document = require("../models/Document");
const crypto = require("crypto");
const { logger } = require("../../../shared/utils/logger");

/**
 * VersionService - Handles intelligent document versioning
 * Separates auto-save from version history completely
 */
class VersionService {
  constructor() {
    // Configuration for version creation thresholds
    this.config = {
      // Only create version on manual save, document close, or significant changes
      // NOT on auto-save interval
      significantChangePercent: 0.1,      // 10% content change
      minCharChanges: 150,                // 150 characters minimum
      idleTimeoutMs: 60000,               // 60 seconds of inactivity after significant edits
      maxVersions: null,                  // No limit for now
    };

    // In-memory tracking for active editing sessions
    // In production, this could be moved to Redis for multi-instance deployments
    this.activeSessions = new Map();
    
    // Track pending version creation timers
    this.pendingTimers = new Map();
  }

  /**
   * Generate content hash for quick comparison
   */
  generateContentHash(content) {
    return crypto.createHash("sha256").update(content || "").digest("hex");
  }

  /**
   * Calculate meaningful character changes between two contents
   * Ignores whitespace-only changes
   */
  countMeaningfulChanges(oldContent, newContent) {
    if (!oldContent && !newContent) return 0;
    if (!oldContent) return newContent.length;
    if (!newContent) return oldContent.length;

    // Normalize whitespace for comparison
    const normalize = (str) => str.replace(/\s+/g, " ").trim();
    const oldNorm = normalize(oldContent);
    const newNorm = normalize(newContent);

    if (oldNorm === newNorm) return 0;

    let changes = 0;
    const minLen = Math.min(oldNorm.length, newNorm.length);

    for (let i = 0; i < minLen; i++) {
      if (oldNorm[i] !== newNorm[i]) changes++;
    }

    changes += Math.abs(oldNorm.length - newNorm.length);
    return changes;
  }

  /**
   * Calculate change percentage
   */
  calculateChangePercentage(oldContent, newContent) {
    if (!oldContent && !newContent) return 0;
    if (!oldContent) return 1;
    if (!newContent) return 1;

    const oldNorm = (oldContent || "").replace(/\s+/g, " ").trim();
    const newNorm = (newContent || "").replace(/\s+/g, " ").trim();
    
    const maxLen = Math.max(oldNorm.length, newNorm.length);
    if (maxLen === 0) return 0;

    const changes = this.countMeaningfulChanges(oldContent, newContent);
    return changes / maxLen;
  }

  /**
   * Check if content is meaningfully different from previous version
   */
  hasSignificantChanges(oldContent, newContent) {
    if (!oldContent && !newContent) return false;
    if (!oldContent || !newContent) return true;

    const hash1 = this.generateContentHash(oldContent);
    const hash2 = this.generateContentHash(newContent);
    
    if (hash1 === hash2) return false; // Identical content

    const changePercent = this.calculateChangePercentage(oldContent, newContent);
    const charChanges = this.countMeaningfulChanges(oldContent, newContent);

    return changePercent >= this.config.significantChangePercent && 
           charChanges >= this.config.minCharChanges;
  }

  /**
   * Get or create an active editing session for a document
   */
  getSession(documentId) {
    if (!this.activeSessions.has(documentId)) {
      this.activeSessions.set(documentId, {
        lastSavedContent: null,      // Content of last saved version
        lastSavedHash: null,         // Hash of last saved version
        pendingChanges: false,       // Whether there are unsaved significant changes
        lastActivityTime: Date.now(), // Last keystroke time
        isEditing: false,
      });
    }
    return this.activeSessions.get(documentId);
  }

  /**
   * Called on auto-save (every 2 seconds) - ONLY updates document, NEVER creates version
   * Returns info about whether significant changes are pending
   */
  onAutoSave(documentId, content) {
    const session = this.getSession(documentId);
    const now = Date.now();
    
    // Update last activity time for idle detection
    session.lastActivityTime = now;
    
    // Check if there are significant changes since last saved version
    if (session.lastSavedContent !== null) {
      const hasSignificantChanges = this.hasSignificantChanges(
        session.lastSavedContent, 
        content
      );
      
      session.pendingChanges = hasSignificantChanges;
      
      // Clear any existing idle timer
      if (this.pendingTimers.has(documentId)) {
        clearTimeout(this.pendingTimers.get(documentId));
      }
      
      // If significant changes exist, set timer for idle detection
      if (hasSignificantChanges) {
        const timer = setTimeout(() => {
          this.onIdleTimeout(documentId);
        }, this.config.idleTimeoutMs);
        this.pendingTimers.set(documentId, timer);
      }
      
      return {
        hasSignificantChanges,
        shouldCreateVersion: false, // NEVER create version on auto-save
      };
    }
    
    // First auto-save after version creation - initialize tracking
    session.lastSavedContent = content;
    session.lastSavedHash = this.generateContentHash(content);
    session.pendingChanges = false;
    session.isEditing = true;
    
    return { hasSignificantChanges: false, shouldCreateVersion: false };
  }

  /**
   * Called when user stops typing for 60 seconds after significant edits
   */
  async onIdleTimeout(documentId) {
    const session = this.activeSessions.get(documentId);
    if (!session || !session.pendingChanges) return;
    
    // This will be handled by the controller which has access to userId
    // The controller should call createVersionIfNeeded on document close/leave
    logger.info({ documentId }, "Idle timeout reached - version creation pending");
  }

  /**
   * Called when user manually clicks "Save Version"
   */
  async createManualVersion({ documentId, authorId, title, content, changeDescription }) {
    const session = this.getSession(documentId);
    
    // Check if content actually changed
    if (session.lastSavedContent !== null) {
      if (!this.hasSignificantChanges(session.lastSavedContent, content)) {
        return { created: false, reason: "no_changes", version: null };
      }
    }

    const version = await this.createVersion({
      documentId,
      authorId,
      title,
      content,
      reason: "manual",
      changeDescription: changeDescription || "Manual save",
    });

    return { created: true, reason: "manual", version };
  }

  /**
   * Called when document is closed or user leaves
   */
  async handleDocumentClose(documentId, userId, currentContent) {
    const session = this.activeSessions.get(documentId);
    if (!session) return { created: false, reason: "no_session" };
    
    // Clear any pending timer
    if (this.pendingTimers.has(documentId)) {
      clearTimeout(this.pendingTimers.get(documentId));
      this.pendingTimers.delete(documentId);
    }
    
    // No session or no editing activity
    if (!session.isEditing || session.lastSavedContent === null) {
      this.activeSessions.delete(documentId);
      return { created: false, reason: "no_changes" };
    }
    
    // Check if content is identical to last saved version
    if (this.generateContentHash(currentContent) === session.lastSavedHash) {
      this.activeSessions.delete(documentId);
      return { created: false, reason: "identical" };
    }
    
    // Check if changes are significant enough for a version
    if (!this.hasSignificantChanges(session.lastSavedContent, currentContent)) {
      // Update document but don't create version for minor changes
      await Document.findByIdAndUpdate(documentId, { content: currentContent });
      this.activeSessions.delete(documentId);
      return { created: false, reason: "insignificant_changes" };
    }
    
    // Create a version for document close with significant changes
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

    // Update session tracking - this is now the last saved version
    const session = this.activeSessions.get(documentId);
    if (session) {
      session.lastSavedContent = content;
      session.lastSavedHash = this.generateContentHash(content);
      session.pendingChanges = false;
    }

    logger.info(
      { documentId, versionNumber, reason, authorId },
      "Document version created"
    );

    return version;
  }

  /**
   * Initialize session after a version is created (manual or close)
   */
  initializeAfterVersion(documentId, content) {
    const session = this.getSession(documentId);
    session.lastSavedContent = content;
    session.lastSavedHash = this.generateContentHash(content);
    session.pendingChanges = false;
    session.isEditing = true;
  }

  /**
   * Get default description based on reason
   */
  getDefaultDescription(reason) {
    const descriptions = {
      manual: "Manual save",
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