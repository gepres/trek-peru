'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CommentWithUser } from '@/types/route.types';
import { CommentForm } from './CommentForm';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  MoreHorizontal, Reply, Edit2, Trash2, Check, X, MessageCircle
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';

interface CommentItemProps {
  comment: CommentWithUser;
  onReply: (content: string, parentId: string, imageUrl?: string) => Promise<boolean>;
  onEdit: (commentId: string, content: string) => Promise<boolean>;
  onDelete: (commentId: string) => Promise<boolean>;
  isAuthenticated: boolean;
  allowImages?: boolean;
  depth?: number;
}

export function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  isAuthenticated,
  allowImages = true,
  depth = 0
}: CommentItemProps) {
  const t = useTranslations('comments');
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
  };

  const handleReply = async (content: string, imageUrl?: string) => {
    const success = await onReply(content, comment.id, imageUrl);
    if (success) {
      setIsReplying(false);
    }
    return success;
  };

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      return;
    }

    const success = await onEdit(comment.id, editContent);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(comment.id);
    setIsDeleting(false);
  };

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: es
  });

  const maxDepth = 2; // Máximo nivel de anidación visual

  return (
    <div className={cn(
      "group",
      depth > 0 && "ml-6 pl-4 border-l-2 border-muted"
    )}>
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={comment.user?.avatar_url} />
          <AvatarFallback className="text-xs">
            {getInitials(comment.user?.full_name || '')}
          </AvatarFallback>
        </Avatar>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">
              {comment.user?.full_name || 'Usuario'}
            </span>
            <span className="text-xs text-muted-foreground">
              @{comment.user?.username}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            {comment.is_edited && (
              <span className="text-xs text-muted-foreground italic">
                ({t('edited')})
              </span>
            )}
          </div>

          {/* Contenido del comentario */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px] resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit}>
                  <Check className="h-3 w-3 mr-1" />
                  {t('save')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                >
                  <X className="h-3 w-3 mr-1" />
                  {t('cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-1 text-sm whitespace-pre-wrap break-words">
                {comment.content}
              </p>

              {/* Imagen del comentario */}
              {comment.image_url && (
                <div className="mt-2">
                  <img
                    src={comment.image_url}
                    alt="Imagen del comentario"
                    className="max-h-48 rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(comment.image_url, '_blank')}
                  />
                </div>
              )}
            </>
          )}

          {/* Acciones */}
          {!isEditing && (
            <div className="flex items-center gap-1 mt-2">
              {isAuthenticated && depth < maxDepth && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setIsReplying(!isReplying)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  {t('reply')}
                </Button>
              )}

              {/* Menú de opciones */}
              {(comment.can_edit || comment.can_delete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {comment.can_edit && (
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        {t('edit')}
                      </DropdownMenuItem>
                    )}
                    {comment.can_delete && (
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-destructive focus:text-destructive"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('delete')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          {/* Formulario de respuesta */}
          {isReplying && (
            <div className="mt-3">
              <CommentForm
                onSubmit={handleReply}
                isReply
                allowImages={allowImages}
                onCancel={() => setIsReplying(false)}
                autoFocus
              />
            </div>
          )}

          {/* Respuestas */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {/* Toggle de respuestas */}
              {comment.replies.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground"
                  onClick={() => setShowReplies(!showReplies)}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  {showReplies
                    ? t('hideReplies', { count: comment.replies.length })
                    : t('showReplies', { count: comment.replies.length })
                  }
                </Button>
              )}

              {showReplies && comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isAuthenticated={isAuthenticated}
                  allowImages={allowImages}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
