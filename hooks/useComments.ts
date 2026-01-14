'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CommentWithUser } from '@/types/route.types';

interface UseCommentsReturn {
  comments: CommentWithUser[];
  isLoading: boolean;
  error: string | null;
  addComment: (content: string, parentId?: string, imageUrl?: string) => Promise<boolean>;
  editComment: (commentId: string, content: string) => Promise<boolean>;
  deleteComment: (commentId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useComments(routeId: string, routeCreatorId: string): UseCommentsReturn {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const supabase = createClient();

  // Obtener usuario actual
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, [supabase]);

  // Organizar comentarios en árbol (padres con replies)
  const organizeComments = useCallback((flatComments: CommentWithUser[]): CommentWithUser[] => {
    const commentMap = new Map<string, CommentWithUser>();
    const rootComments: CommentWithUser[] = [];

    // Primero, crear el mapa y agregar permisos
    flatComments.forEach(comment => {
      const canEdit = currentUserId === comment.user_id;
      const canDelete = currentUserId === comment.user_id || currentUserId === routeCreatorId;

      commentMap.set(comment.id, {
        ...comment,
        replies: [],
        can_edit: canEdit,
        can_delete: canDelete
      });
    });

    // Luego, organizar en árbol
    commentMap.forEach(comment => {
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        const parent = commentMap.get(comment.parent_id)!;
        parent.replies = parent.replies || [];
        parent.replies.push(comment);
      } else {
        rootComments.push(comment);
      }
    });

    // Ordenar por fecha (más recientes primero para root, más antiguos primero para replies)
    rootComments.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    rootComments.forEach(comment => {
      if (comment.replies) {
        comment.replies.sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
    });

    return rootComments;
  }, [currentUserId, routeCreatorId]);

  // Cargar comentarios
  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles(id, username, full_name, avatar_url)
        `)
        .eq('route_id', routeId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const organized = organizeComments(data || []);
      setComments(organized);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      setError(err.message || 'Error al cargar comentarios');
    } finally {
      setIsLoading(false);
    }
  }, [routeId, supabase, organizeComments]);

  // Agregar comentario
  const addComment = useCallback(async (
    content: string,
    parentId?: string,
    imageUrl?: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Debes iniciar sesión para comentar');
        return false;
      }

      const { error: insertError } = await supabase
        .from('comments')
        .insert({
          route_id: routeId,
          user_id: user.id,
          content: content.trim(),
          parent_id: parentId || null,
          image_url: imageUrl || null
        });

      if (insertError) throw insertError;

      await fetchComments();
      return true;
    } catch (err: any) {
      console.error('Error adding comment:', err);
      setError(err.message || 'Error al agregar comentario');
      return false;
    }
  }, [routeId, supabase, fetchComments]);

  // Editar comentario
  const editComment = useCallback(async (
    commentId: string,
    content: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Debes iniciar sesión');
        return false;
      }

      // Verificar que el usuario es el dueño del comentario
      const { data: comment } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (!comment || comment.user_id !== user.id) {
        setError('No tienes permiso para editar este comentario');
        return false;
      }

      const { error: updateError } = await supabase
        .from('comments')
        .update({
          content: content.trim(),
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (updateError) throw updateError;

      await fetchComments();
      return true;
    } catch (err: any) {
      console.error('Error editing comment:', err);
      setError(err.message || 'Error al editar comentario');
      return false;
    }
  }, [supabase, fetchComments]);

  // Eliminar comentario
  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Debes iniciar sesión');
        return false;
      }

      // Verificar permisos (dueño del comentario o creador de la ruta)
      const { data: comment } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (!comment) {
        setError('Comentario no encontrado');
        return false;
      }

      const isCommentOwner = comment.user_id === user.id;
      const isRouteCreator = user.id === routeCreatorId;

      if (!isCommentOwner && !isRouteCreator) {
        setError('No tienes permiso para eliminar este comentario');
        return false;
      }

      // Eliminar respuestas primero (si las hay)
      await supabase
        .from('comments')
        .delete()
        .eq('parent_id', commentId);

      // Eliminar el comentario
      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (deleteError) throw deleteError;

      await fetchComments();
      return true;
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      setError(err.message || 'Error al eliminar comentario');
      return false;
    }
  }, [supabase, routeCreatorId, fetchComments]);

  // Cargar al montar
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    isLoading,
    error,
    addComment,
    editComment,
    deleteComment,
    refetch: fetchComments
  };
}
