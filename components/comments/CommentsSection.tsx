'use client';

import { useState } from 'react';
import { CommentsList } from './CommentsList';
import { createClient } from '@/lib/supabase/client';

interface CommentsSectionProps {
  routeId: string;
  routeCreatorId: string;
  commentsEnabled?: boolean;
  isCreator?: boolean;
  allowImages?: boolean;
}

export function CommentsSection({
  routeId,
  routeCreatorId,
  commentsEnabled: initialCommentsEnabled = true,
  isCreator = false,
  allowImages = true
}: CommentsSectionProps) {
  const [commentsEnabled, setCommentsEnabled] = useState(initialCommentsEnabled);
  const supabase = createClient();

  const handleToggleComments = async (enabled: boolean) => {
    const { error } = await supabase
      .from('routes')
      .update({ comments_enabled: enabled })
      .eq('id', routeId);

    if (error) {
      throw error;
    }

    setCommentsEnabled(enabled);
  };

  return (
    <CommentsList
      routeId={routeId}
      routeCreatorId={routeCreatorId}
      commentsEnabled={commentsEnabled}
      isCreator={isCreator}
      allowImages={allowImages}
      onToggleComments={isCreator ? handleToggleComments : undefined}
    />
  );
}
