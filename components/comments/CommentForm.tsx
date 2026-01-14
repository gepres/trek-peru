'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { Send, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CommentFormProps {
  onSubmit: (content: string, imageUrl?: string) => Promise<boolean>;
  userAvatar?: string;
  userName?: string;
  placeholder?: string;
  isReply?: boolean;
  allowImages?: boolean;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function CommentForm({
  onSubmit,
  userAvatar,
  userName,
  placeholder,
  isReply = false,
  allowImages = true,
  onCancel,
  autoFocus = false
}: CommentFormProps) {
  const t = useTranslations('comments');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setIsSubmitting(true);
    const success = await onSubmit(content.trim(), imageUrl || undefined);

    if (success) {
      setContent('');
      setImageUrl(null);
      setShowImageUpload(false);
    }

    setIsSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        {!isReply && (
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={userAvatar} />
            <AvatarFallback>{getInitials(userName || '')}</AvatarFallback>
          </Avatar>
        )}

        <div className="flex-1 space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || (isReply ? t('replyPlaceholder') : t('placeholder'))}
            className="min-h-[80px] resize-none"
            autoFocus={autoFocus}
          />

          {/* Preview de imagen */}
          {imageUrl && (
            <div className="relative inline-block">
              <img
                src={imageUrl}
                alt="Preview"
                className="max-h-32 rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={() => setImageUrl(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Upload de imagen */}
          {showImageUpload && !imageUrl && (
            <div className="border rounded-lg p-3 bg-muted/30">
              <ImageUpload
                bucket="route-images"
                folder="comments"
                onUploadComplete={(url) => {
                  setImageUrl(url);
                  setShowImageUpload(false);
                }}
                maxSizeMB={2}
                showPreview={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between pl-13">
        <div className="flex items-center gap-2">
          {allowImages && !showImageUpload && !imageUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowImageUpload(true)}
              className="text-muted-foreground"
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              {t('addImage')}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
            >
              {t('cancel')}
            </Button>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                {isReply ? t('reply') : t('submit')}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
