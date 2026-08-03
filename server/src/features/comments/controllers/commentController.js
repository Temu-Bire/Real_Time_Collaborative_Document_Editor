const commentService = require("../services/commentService");
const { asyncHandler } = require("../../../shared/utils");
const { logger } = require("../../../shared/utils/logger");

const commentController = {
  getComments: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;

    const result = await commentService.getComments(req.params.id, { page, limit });

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  addComment: asyncHandler(async (req, res) => {
    const { content, parentCommentId } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Comment content cannot be empty",
        },
      });
    }

    const comment = await commentService.addComment(
      req.params.id,
      req.user.userId,
      content,
      parentCommentId
    );

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: { comment },
    });
  }),

  updateComment: asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Comment content cannot be empty",
        },
      });
    }

    const comment = await commentService.updateComment(
      commentId,
      req.user.userId,
      content
    );

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: { comment },
    });
  }),

  deleteComment: asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    await commentService.deleteComment(
      commentId,
      req.user.userId,
      req.userRole
    );

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  }),

  resolveComment: asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await commentService.resolveComment(
      commentId,
      req.user.userId,
      req.userRole
    );

    res.status(200).json({
      success: true,
      message: "Comment resolved successfully",
      data: { comment },
    });
  }),

  unresolveComment: asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await commentService.unresolveComment(
      commentId,
      req.user.userId,
      req.userRole
    );

    res.status(200).json({
      success: true,
      message: "Comment unresolved successfully",
      data: { comment },
    });
  }),
};

module.exports = commentController;