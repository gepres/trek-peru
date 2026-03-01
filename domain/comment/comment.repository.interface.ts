import { Comment, CommentWithUser } from '@/types/route.types';
import { CommentCreateData, CommentUpdateData } from '@/infrastructure/supabase/comment.repository';

// Contrato que cualquier implementación de repositorio de comentarios debe cumplir
export interface ICommentRepository {
  findByRouteId(routeId: string): Promise<CommentWithUser[]>;
  findOwnerById(commentId: string): Promise<string | null>;
  create(commentData: CommentCreateData): Promise<Comment>;
  update(commentId: string, updateData: CommentUpdateData): Promise<Comment>;
  deleteById(commentId: string): Promise<void>;
}
