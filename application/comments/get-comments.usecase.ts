import { ICommentRepository } from '@/domain/comment/comment.repository.interface';
import { CommentWithUser } from '@/types/route.types';

// Caso de uso: obtener comentarios de una ruta (lista plana, el hook organiza el árbol)
export async function getComments(
  commentRepo: ICommentRepository,
  routeId: string,
): Promise<CommentWithUser[]> {
  return commentRepo.findByRouteId(routeId);
}
