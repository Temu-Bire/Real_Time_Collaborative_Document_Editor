const crypto = require("crypto");
const DocumentVersion = require("../models/DocumentVersion");
const Document = require("../models/Document");
const { logger } = require("../../../shared/utils/logger");

/**
 * VersionService - Handles intelligent document versioning.
 * Auto-save updates the Document only; versions are created at meaningful milestones.
 */
class VersionService {
  constructor() {
    this.config = {
      changePercentageThreshold: 0.1,
      minCharChangeThreshold: 150,
      trivialChangeThreshold: 10,
      idleSeconds: 60,
      maxVersions: null,
    };

    this.activeSessions = new Map();
  }

  contentHash(content) {
    return crypto.createHash("sha256").update(content || "").digest("hex");
  }

  /**
   * Normalize HTML content to plain text for meaningful comparison.
   * Strips tags and collapses whitespace so formatting-only edits are ignored.
   */
  normalizeTextContent(content) {
    if (!content) return "";
    return content
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/\s+/g, " ")
      .trim();
  }

  calculateChangePercentage(oldContent, newContent) {
    const oldText = this.normalizeTextContent(oldContent);
    const newText = this.normalizeTextContent(newContent);

    if (!oldText && !newText) return 0;
    if (!oldText || !newText) return 1;

    const oldLen = oldText.length;
    const newLen = newText.length;
    const maxLen = Math.max(oldLen, newLen);

    if (maxLen === 0) return 0;

    let changes = 0;
    const minLen = Math.min(oldLen, newLen);

    for (let i = 0; i < minLen; i++) {
      if (oldText[i] !== newText[i]) changes++;
    }

    changes += Math.abs(oldLen - newLen);
    return changes / maxLen;
  }

  countCharChanges(oldContent, newContent) {
    const oldText = this.normalizeTextContent(oldContent);
    const newText = this.normalizeTextContent(newContent);

    if (!oldText && !newText) return 0;
    if (!oldText) return newText.length;
    if (!newText) return oldText.length;

    let changes = 0;
    const minLen = Math.min(oldText.length, newText.length);

    for (let i = 0; i < minLen; i++) {
      if (oldText[i] !== newText[i]) changes++;
    }

    changes += Math.abs(oldText.length - newText.length);
    return changes;
  }

  isContentIdentical(oldContent, newContent) {
    return this.contentHash(oldContent) === this.contentHash(newContent);
  }

  isWhitespaceOnlyChange(oldContent, newContent) {
    const oldText = this.normalizeTextContent(oldContent);
    const newText = this.normalizeTextContent(newContent);
    return oldText === newText;
  }

  isTrivialChange(oldContent, newContent) {
    const charChanges = this.countCharChanges(oldContent, newContent);
    return charChanges > 0 && charChanges <= this.config.trivialChangeThreshold;
  }

  isSignificantChange(oldContent, newContent) {
    if (this.isWhitespaceOnlyChange(oldContent, newContent)) return false;

    const charChanges = this.countCharChanges(oldContent, newContent);
    if (charChanges <= this.config.trivialChangeThreshold) return false;

    const changePercent = this.calculateChangePercentage(oldContent, newContent);
    return (
      changePercent >= this.config.changePercentageThreshold ||
      charChanges >= this.config.minCharChangeThreshold
    );
  }

  getSession(documentId) {
    if (!this.activeSessions.has(documentId)) {
      this.activeSessions.set(documentId, {
        lastVersionContent: null,
        lastVersionHash: null,
        lastVersionTime: null,
        hasPendingSignificantChanges: false,
        idleTimer: null,
        initialized: false,
      });
    }
    return this.activeSessions.get(documentId);
  }

  clearIdleTimer(documentId) {
    const session = this.activeSessions.get(documentId);
    if (session?.idleTimer) {
      clearTimeout(session.idleTimer);
      session.idleTimer = null;
    }
  }

  async getLatestVersion(documentId) {
    return DocumentVersion.findOne({ document: documentId })
      .sort({ versionNumber: -1 })
      .lean();
  }

  async initializeSession(documentId) {
    const session = this.getSession(documentId);
    if (session.initialized) return session;

    const latestVersion = await this.getLatestVersion(documentId);
    session.lastVersionContent = latestVersion?.content ?? null;
    session.lastVersionHash = latestVersion
      ? latestVersion.contentHash || this.contentHash(latestVersion.content)
      : null;
    session.lastVersionTime = latestVersion?.createdAt
      ? new Date(latestVersion.createdAt).getTime()
      : null;
    session.initialized = true;

    return session;
  }

  /**
   * Evaluate whether a version should be created for the given content.
   */
  evaluateVersionNeed(currentContent, latestVersionContent, { requireSignificance = false } = {}) {
    if (this.isContentIdentical(latestVersionContent, currentContent)) {
      return { shouldCreate: false, reason: "identical" };
    }

    if (this.isWhitespaceOnlyChange(latestVersionContent, currentContent)) {
      return { shouldCreate: false, reason: "whitespace_or_formatting" };
    }

    if (this.isTrivialChange(latestVersionContent, currentContent)) {
      return { shouldCreate: false, reason: "trivial_change" };
    }

    if (requireSignificance) {
      const significant = this.isSignificantChange(latestVersionContent, currentContent);
      if (!significant) {
        return { shouldCreate: false, reason: "below_significance_threshold" };
      }
    }

    return { shouldCreate: true };
  }

  scheduleIdleVersion(documentId, authorId, title) {
    const session = this.getSession(documentId);
    this.clearIdleTimer(documentId);

    session.idleTimer = setTimeout(async () => {
      try {
        const doc = await Document.findById(documentId).select("content title").lean();
        if (!doc) return;

        const latestVersion = await this.getLatestVersion(documentId);
        const latestContent = latestVersion?.content ?? session.lastVersionContent ?? "";

        const evaluation = this.evaluateVersionNeed(doc.content || "", latestContent, {
          requireSignificance: true,
        });

        if (evaluation.shouldCreate) {
          await this.createVersion({
            documentId,
            authorId,
            title: doc.title || title,
            content: doc.content || "",
            reason: "interval",
            changeDescription: "Saved after editing pause",
          });
        }

        session.hasPendingSignificantChanges = false;
      } catch (err) {
        logger.error({ err, documentId }, "Failed to create idle version");
      }
    }, this.config.idleSeconds * 1000);
  }

  /**
   * Called on every auto-save. Updates the Document only — never creates a version.
   * Tracks changes and schedules an idle version when significant edits are detected.
   */
  async handleAutoSave(documentId, authorId, title, content) {
    await this.initializeSession(documentId);
    const session = this.getSession(documentId);

    const baselineContent = session.lastVersionContent ?? "";
    const significant = this.isSignificantChange(baselineContent, content);

    if (significant && !this.isContentIdentical(baselineContent, content)) {
      session.hasPendingSignificantChanges = true;
      this.scheduleIdleVersion(documentId, authorId, title);
    }

    return { versionCreated: false };
  }

  /**
   * Create a manual version (explicit "Save Version" action).
   * Skips only when content hash matches the latest version.
   */
  async createManualVersion({ documentId, authorId, title, content, changeDescription }) {
    await this.initializeSession(documentId);

    const latestVersion = await this.getLatestVersion(documentId);
    const latestContent = latestVersion?.content ?? null;

    if (latestContent !== null && this.isContentIdentical(latestContent, content)) {
      return { skipped: true, reason: "identical" };
    }

    const version = await this.createVersion({
      documentId,
      authorId,
      title,
      content,
      reason: "manual",
      changeDescription: changeDescription || "Manual save",
    });

    return { skipped: false, version };
  }

  /**
   * Create a version when the user closes or leaves the document.
   */
  async handleDocumentClose(documentId, userId, currentContent) {
    await this.initializeSession(documentId);
    this.clearIdleTimer(documentId);

    const latestVersion = await this.getLatestVersion(documentId);
    const latestContent = latestVersion?.content ?? null;

    if (latestContent === null) {
      const evaluation = this.evaluateVersionNeed(currentContent, "");
      if (!evaluation.shouldCreate && !currentContent) {
        this.activeSessions.delete(documentId);
        return { created: false, reason: "empty_document" };
      }
    } else {
      const evaluation = this.evaluateVersionNeed(currentContent, latestContent);
      if (!evaluation.shouldCreate) {
        this.activeSessions.delete(documentId);
        return { created: false, reason: evaluation.reason };
      }
    }

    const doc = await Document.findById(documentId).select("title").lean();
    const version = await this.createVersion({
      documentId,
      authorId: userId,
      title: doc?.title || "Untitled",
      content: currentContent,
      reason: "close_document",
    });

    this.activeSessions.delete(documentId);
    return { created: true, version, reason: "close_document" };
  }

  async createVersion({ documentId, authorId, title, content, reason, changeDescription }) {
    const hash = this.contentHash(content);
    const latestVersion = await this.getLatestVersion(documentId);

    if (latestVersion) {
      const latestHash =
        latestVersion.contentHash || this.contentHash(latestVersion.content);
      if (latestHash === hash) {
        logger.info({ documentId, reason }, "Skipped duplicate version (identical hash)");
        return null;
      }
    }

    const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    const version = await DocumentVersion.create({
      document: documentId,
      title,
      content: content || "",
      contentHash: hash,
      author: authorId,
      versionNumber,
      changeDescription: changeDescription || this.getDefaultDescription(reason),
      reason,
      isAutosave: reason !== "manual" && reason !== "restore",
    });

    this.markVersionCreated(documentId, content, hash);

    logger.info({ documentId, versionNumber, reason, authorId }, "Document version created");

    return version;
  }

  markVersionCreated(documentId, content, hash) {
    const session = this.getSession(documentId);
    session.lastVersionContent = content;
    session.lastVersionHash = hash || this.contentHash(content);
    session.lastVersionTime = Date.now();
    session.hasPendingSignificantChanges = false;
    this.clearIdleTimer(documentId);
  }

  getDefaultDescription(reason) {
    const descriptions = {
      manual: "Manual save",
      interval: "Saved after editing pause",
      significant_change: "Significant content change",
      close_document: "Document closed",
      restore: "Restored from previous version",
    };
    return descriptions[reason] || "Version created";
  }

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

    await this.createVersion({
      documentId,
      authorId: userId,
      title: version.title,
      content: version.content,
      reason: "restore",
      changeDescription: `Restored from version ${versionNumber}`,
    });

    return updatedDoc;
  }
}

module.exports = new VersionService();
