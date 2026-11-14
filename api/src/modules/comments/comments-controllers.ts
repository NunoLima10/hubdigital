import { NotFoundError } from "@/utils/custom-errors";
import { isStaffRole } from "@hubdigital/shared";
import {
  CreateCommentReply,
  CreateCommentRequest,
  DeleteCommentReply,
  DeleteCommentRequest,
  ListCommentsReply,
  ListCommentsRequest,
  UpdateCommentReply,
  UpdateCommentRequest,
} from "./comments-schemas";
import { CommentsService } from "./comments-services";

async function listCommentsHandler(
  req: ListCommentsRequest,
  reply: ListCommentsReply
) {
  const project = await CommentsService.findPublishedProjectBySlug(
    req.db,
    req.params.slug
  );

  if (!project) {
    throw new NotFoundError();
  }

  const data = await CommentsService.listComments(
    req.db,
    project.id,
    req.user?.id
  );

  return reply.status(200).send({ data });
}

async function createCommentHandler(
  req: CreateCommentRequest,
  reply: CreateCommentReply
) {
  const project = await CommentsService.findPublishedProjectBySlug(
    req.db,
    req.params.slug
  );

  if (!project) {
    throw new NotFoundError();
  }

  const comment = await CommentsService.createComment(req.db, {
    projectId: project.id,
    userId: req.user!.id,
    body: req.body.body,
    parentId: req.body.parentId,
  });

  // Null means the parent named in the body isn't a live comment on this
  // project, so there is nothing to reply to.
  if (!comment) {
    throw new NotFoundError();
  }

  return reply.status(201).send({ data: comment });
}

async function updateCommentHandler(
  req: UpdateCommentRequest,
  reply: UpdateCommentReply
) {
  const comment = await CommentsService.updateComment(
    req.db,
    req.params.id,
    req.user!.id,
    req.body.body
  );

  if (!comment) {
    throw new NotFoundError();
  }

  return reply.status(200).send({ data: comment });
}

async function deleteCommentHandler(
  req: DeleteCommentRequest,
  reply: DeleteCommentReply
) {
  const canModerate = isStaffRole(req.user!.role);

  const deleted = await CommentsService.deleteComment(
    req.db,
    req.params.id,
    req.user!.id,
    canModerate
  );

  if (!deleted) {
    throw new NotFoundError();
  }

  return reply.status(204).send();
}

export const commentsController = {
  listCommentsHandler,
  createCommentHandler,
  updateCommentHandler,
  deleteCommentHandler,
};
