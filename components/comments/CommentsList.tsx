'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { useComments } from '@/presentation/hooks/useComments';
import { createClient } from '@/lib/supabase/client';
import { MessageCircle, MessageCircleOff, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';

interface CommentsListProps {
  routeId: string;
  routeCreatorId: string;
  commentsEnabled?: boolean;
  isCreator?: boolean;
  allowImages?: boolean;
  onToggleComments?: (enabled: boolean) => Promise<void>;
}

export function CommentsList({
  routeId,
  routeCreatorId,
  commentsEnabled = true,
  isCreator = false,
  allowImages = true,
  onToggleComments
}: CommentsListProps) {
  const t = useTranslations('comments');
  const { toast } = useToast();
  const {
    comments,
    isLoading,
    error,
    addComment,
    editComment,
    deleteComment
  } = useComments(routeId, routeCreatorId);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isTogglingComments, setIsTogglingComments] = useState(false);

  const supabase = createClient();

  // Verificar autenticación
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser(profile);
      }
    };
    checkAuth();
  }, [supabase]);

  const handleAddComment = async (content: string, imageUrl?: string) => {
    const success = await addComment(content, undefined, imageUrl);
    if (success) {
      toast({
        title: t('commentAdded'),
        description: t('commentAddedDescription')
      });
    }
    return success;
  };

  const handleReply = async (content: string, parentId: string, imageUrl?: string) => {
    const success = await addComment(content, parentId, imageUrl);
    if (success) {
      toast({
        title: t('replyAdded'),
        description: t('replyAddedDescription')
      });
    }
    return success;
  };

  const handleEdit = async (commentId: string, content: string) => {
    const success = await editComment(commentId, content);
    if (success) {
      toast({
        title: t('commentEdited'),
        description: t('commentEditedDescription')
      });
    }
    return success;
  };

  const handleDelete = async (commentId: string) => {
    const success = await deleteComment(commentId);
    if (success) {
      toast({
        title: t('commentDeleted'),
        description: t('commentDeletedDescription')
      });
    }
    return success;
  };

  const handleToggleComments = async (enabled: boolean) => {
    if (!onToggleComments) return;

    setIsTogglingComments(true);
    try {
      await onToggleComments(enabled);
      toast({
        title: enabled ? t('commentsEnabled') : t('commentsDisabled'),
        description: enabled ? t('commentsEnabledDescription') : t('commentsDisabledDescription')
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('toggleError'),
        variant: 'destructive'
      });
    } finally {
      setIsTogglingComments(false);
    }
  };

  // Si los comentarios están deshabilitados
  if (!commentsEnabled && !isCreator) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageCircleOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">{t('commentsDisabledMessage')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          {t('title')}
          <span className="text-sm font-normal text-muted-foreground">
            ({comments.length})
          </span>
        </CardTitle>

        {/* Toggle de comentarios (solo para el creador) */}
        {isCreator && onToggleComments && (
          <div className="flex items-center gap-2">
            <Label htmlFor="comments-toggle" className="text-sm text-muted-foreground">
              {commentsEnabled ? t('enabled') : t('disabled')}
            </Label>
            <Switch
              id="comments-toggle"
              checked={commentsEnabled}
              onCheckedChange={handleToggleComments}
              disabled={isTogglingComments}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Mensaje si está deshabilitado (solo visible para creador) */}
        {!commentsEnabled && isCreator && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm">
            {t('commentsDisabledCreatorMessage')}
          </div>
        )}

        {/* Formulario para nuevo comentario */}
        {isAuthenticated && commentsEnabled && (
          <CommentForm
            onSubmit={handleAddComment}
            userAvatar={currentUser?.avatar_url}
            userName={currentUser?.full_name}
            allowImages={allowImages}
          />
        )}

        {/* Mensaje para usuarios no autenticados */}
        {!isAuthenticated && commentsEnabled && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Button variant="link" asChild>
              <Link href="/es/login">{t('loginToComment')}</Link>
            </Button>
          </div>
        )}

        {/* Separador */}
        {commentsEnabled && (isAuthenticated || comments.length > 0) && (
          <hr className="border-border" />
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-4 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Lista de comentarios */}
        {!isLoading && commentsEnabled && (
          <div className="space-y-6">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isAuthenticated={isAuthenticated}
                  allowImages={allowImages}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">{t('noComments')}</p>
                {isAuthenticated && (
                  <p className="text-muted-foreground text-xs mt-1">{t('beFirst')}</p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
