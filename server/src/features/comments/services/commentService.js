const Comment = require("../models/Comment");
const { asyncHandler, buildPaginationResponse } = require("../../../shared/utils");
const { logger } = require("../../../shared/utils/logger");

const commentService = {
  async getComments(documentId, { page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;

    const [total, comments] = await Promise.all([
      Comment.countDocuments({ document: documentId, parentComment: null }),
      Comment.find({ document: documentId, parentComment: null })
        .populate("author", "name email profilePicture")
        .populate("resolvedBy", "name email profilePicture")
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Get replies for each comment
    const commentIds = comments.map((c) => c._id);
    const replies = await Comment.find({ parentComment: { $in: commentIds } })
      .populate("author", "name email profilePicture")
      .populate("resolvedBy", "name email profilePicture")
      .sort({ createdAt: 1 })
      .lean();

    const replyMap = new Map();
    replies.forEach((reply) => {
      const parentId = reply.parentComment.toString();
      if (!replyMap.has(parentId)) {
        replyMap.set(parentId, []);
      }
      replyMap.get(parentId).push(reply);
    });

    comments.forEach((comment) => {
      comment.replies = replyMap.get(comment._id.toString()) || [];
    });

    return {
      comments,
      pagination: buildPaginationResponse(total, page, limit),
    };
  },

  async addComment(documentId, authorId, content, parentCommentId = null) {
    const commentData = {
      document: documentId,
      author: authorId,
      content: content.trim(),
    };

    if (parentCommentId) {
      commentData.parentComment = parentCommentId;
    }

    const comment = await Comment.create(commentData);

    return Comment.findById(comment._id)
      .populate("author", "name email profilePicture")
      .populate("resolvedBy", "name email profilePicture")
      .lean();
  },

  async updateComment(commentId, authorId, content) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error("Comment not found");

    if (comment.author.toString() !== authorId.toString()) {
      throw new Error("Unauthorized: You can only edit your own comments");
    }

    comment.content = content.trim();
    await comment.save();

    return Comment.findById(comment._id)
      .populate("author", "name email profilePicture")
      .populate("resolvedBy", "name email profilePicture")
      .lean();
  },

  async deleteComment(commentId, authorId, userRole) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error("Comment not found");

    const isAuthor = comment.author.toString() === authorId.toString();
    const isOwnerOrEditor = ["Owner", "Editor"].includes(userRole);

    if (!isAuthor && !isOwnerOrEditor) {
      throw new Error("Unauthorized: You can only delete your own comments");
    }

    await Comment.deleteMany({ _id: commentId });
    await Comment.deleteMany({ parentComment: commentId });

    return { success: true };
  },

  async resolveComment(commentId, userId, userRole) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error("Comment not found");

    const isAuthor = comment.author.toString() === userId.toString();
    const isOwnerOrEditor = ["Owner", "Editor"].includes(userRole);

    if (!isAuthor && !isOwnerOrEditor) {
      throw new Error("Unauthorized: You can only resolve your own comments or need Editor permissions");
    }

    comment.isResolved = true;
    comment.resolvedBy = userId;
    comment.resolvedAt = new Date();
    await comment.save();

    return Comment.findById(comment._id)
      .populate("author", "name email profilePicture")
      .populate("resolvedBy", "name email profilePicture")
      .lean();
  },

  async unresolveComment(commentId, userId, userRole) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error("Comment not found");

    const isAuthor = comment.author.toString() === userId.toString();
    const isOwnerOrEditor = ["Owner", "Editor"].includes(userRole);

    if (!isAuthor && !isOwnerOrEditor) {
      throw new Error("Unauthorized: You can only unresolve your own comments or need Editor permissions");
    }

    comment.isResolved = false;
    comment.resolvedBy = null;
    comment.resolvedAt = null;
    await comment.save();

    return Comment.findById(comment._id)
      .populate("author", "name email profilePicture")
      .populate("resolvedBy", "name email profilePicture")
      .lean();
  },
};

module.exports = commentService;