'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

interface FollowGroupButtonProps {
  groupId: string;
  initialFollowing: boolean;
}

export function FollowGroupButton({ groupId, initialFollowing }: FollowGroupButtonProps) {
  const t = useTranslations('groups');
  const supabase = createClient();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);

  async function toggleFollow() {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isFollowing) {
        await supabase
          .from('group_followers')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', user.id);
        setIsFollowing(false);
      } else {
        await supabase
          .from('group_followers')
          .insert({ group_id: groupId, user_id: user.id });
        setIsFollowing(true);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button variant={isFollowing ? 'outline' : 'default'} onClick={toggleFollow} disabled={isLoading} className="gap-2">
      <Heart className={isFollowing ? 'h-4 w-4 fill-current text-red-500' : 'h-4 w-4'} />
      {isFollowing ? t('following') : t('follow')}
    </Button>
  );
}
