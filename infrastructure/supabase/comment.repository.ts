import { SupabaseClient } from '@supabase/supabase-js';
import { Comment, CommentWithUser } from '@/types/route.types';
import { ICommentRepository } from '@/domain/comment/comment.repository.interface';

// Datos para crear un comentario
export interface CommentCreateData {
  route_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  image_url?: string;
}

// Datos para actualizar un comentario
export interface CommentUpdateData {
  content: string;
  is_edited: boolean;
  edited_at: string;
}

// Repositorio de acceso a datos para comentarios — implementa ICommentRepository
export function createCommentRepository(supabase: SupabaseClient): ICommentRepository {
  return {
    // Obtener todos los comentarios planos de una ruta (el hook organiza el árbol)
    async findByRouteId(routeId: string): Promise<CommentWithUser[]> {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles(id, username, full_name, avatar_url)
        `)
        .eq('route_id', routeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    // Obtener solo el owner_id de un comentario (para verificar permisos)
    async findOwnerById(commentId: string): Promise<string | null> {
      const { data, error } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (error) throw error;
      return data?.user_id ?? null;
    },

    // Crear un nuevo comentario
    async create(commentData: CommentCreateData): Promise<Comment> {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          route_id: commentData.route_id,
          user_id: commentData.user_id,
          content: commentData.content.trim(),
          parent_id: commentData.parent_id ?? null,
          image_url: commentData.image_url ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Actualizar un comentario existente
    async update(commentId: string, updateData: CommentUpdateData): Promise<Comment> {
      const { data, error } = await supabase
        .from('comments')
        .update(updateData)
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Eliminar un comentario y sus respuestas en cascada
    async deleteById(commentId: string): Promise<void> {
      // Eliminar respuestas primero para evitar huérfanos
      await supabase
        .from('comments')
        .delete()
        .eq('parent_id', commentId);

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
  };
}

export type CommentRepository = ReturnType<typeof createCommentRepository>;
