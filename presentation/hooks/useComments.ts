'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createCommentRepository } from '@/infrastructure/supabase';
import {
  getComments as getCommentsUseCase,
  addComment as addCommentUseCase,
  editComment as editCommentUseCase,
  deleteComment as deleteCommentUseCase,
} from '@/application/comments';
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

  // Cargar comentarios via use-case
  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const repository = createCommentRepository(supabase);
      const data = await getCommentsUseCase(repository, routeId);
      const organized = organizeComments(data);
      setComments(organized);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      setError(err.message || 'Error al cargar comentarios');
    } finally {
      setIsLoading(false);
    }
  }, [routeId, supabase, organizeComments]);

  // Agregar comentario via use-case
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

      const repository = createCommentRepository(supabase);
      await addCommentUseCase(repository, routeId, user.id, content, parentId, imageUrl);

      await fetchComments();
      return true;
    } catch (err: any) {
      console.error('Error adding comment:', err);
      setError(err.message || 'Error al agregar comentario');
      return false;
    }
  }, [routeId, supabase, fetchComments]);

  // Editar comentario via use-case
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

      const repository = createCommentRepository(supabase);
      await editCommentUseCase(repository, commentId, user.id, content);

      await fetchComments();
      return true;
    } catch (err: any) {
      console.error('Error editing comment:', err);
      setError(err.message || 'Error al editar comentario');
      return false;
    }
  }, [supabase, fetchComments]);

  // Eliminar comentario via use-case
  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Debes iniciar sesión');
        return false;
      }

      const repository = createCommentRepository(supabase);
      await deleteCommentUseCase(repository, commentId, user.id, routeCreatorId);

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
