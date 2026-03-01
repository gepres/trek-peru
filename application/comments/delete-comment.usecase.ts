import { ICommentRepository } from '@/domain/comment/comment.repository.interface';

// Caso de uso: eliminar un comentario
// Permitido al dueño del comentario o al creador de la ruta
export async function deleteComment(
  commentRepo: ICommentRepository,
  commentId: string,
  userId: string,
  routeCreatorId: string,
): Promise<void> {
  const ownerId = await commentRepo.findOwnerById(commentId);

  if (!ownerId) {
    throw new Error('Comentario no encontrado');
  }

  const isCommentOwner = ownerId === userId;
  const isRouteCreator = userId === routeCreatorId;

  if (!isCommentOwner && !isRouteCreator) {
    throw new Error('No tienes permiso para eliminar este comentario');
  }

  return commentRepo.deleteById(commentId);
}
