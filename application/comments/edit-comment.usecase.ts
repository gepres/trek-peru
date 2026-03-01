import { ICommentRepository } from '@/domain/comment/comment.repository.interface';
import { Comment } from '@/types/route.types';

// Caso de uso: editar un comentario
// Lanza error si el usuario no es el dueño
export async function editComment(
  commentRepo: ICommentRepository,
  commentId: string,
  userId: string,
  content: string,
): Promise<Comment> {
  const ownerId = await commentRepo.findOwnerById(commentId);

  if (!ownerId || ownerId !== userId) {
    throw new Error('No tienes permiso para editar este comentario');
  }

  return commentRepo.update(commentId, {
    content: content.trim(),
    is_edited: true,
    edited_at: new Date().toISOString(),
  });
}
