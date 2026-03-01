import { ICommentRepository } from '@/domain/comment/comment.repository.interface';
import { Comment } from '@/types/route.types';

// Caso de uso: agregar un comentario a una ruta
export async function addComment(
  commentRepo: ICommentRepository,
  routeId: string,
  userId: string,
  content: string,
  parentId?: string,
  imageUrl?: string,
): Promise<Comment> {
  return commentRepo.create({ route_id: routeId, user_id: userId, content, parent_id: parentId, image_url: imageUrl });
}
