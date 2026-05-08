'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Building2, Plus, ShieldCheck, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { GroupMemberRole, GroupVerificationStatus, GroupType } from '@/types/database.types';

interface GroupsListProps {
  locale: string;
}

interface GroupItem {
  id: string;
  name: string;
  slug: string;
  slogan?: string | null;
  logo_url?: string | null;
  type: GroupType;
  verification_status: GroupVerificationStatus;
  role: GroupMemberRole;
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);
}

export function GroupsList({ locale }: GroupsListProps) {
  const t = useTranslations('groups');
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGroups() {
      try {
        setIsLoading(true);
        const client = createClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) throw new Error(t('errors.mustLogin'));

        const { data, error: groupsError } = await client
          .from('group_members')
          .select(`
            role,
            group:groups(
              id,
              name,
              slug,
              slogan,
              logo_url,
              type,
              verification_status
            )
          `)
          .eq('user_id', user.id)
          .order('joined_at', { ascending: false });

        if (groupsError) throw groupsError;

        setGroups((data || [])
          .map((item: any) => ({ ...item.group, role: item.role }))
          .filter((group: GroupItem | null) => Boolean(group))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errors.generic'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchGroups();
  }, [t]);

  if (isLoading) {
    return <LoadingSpinner size="lg" text={t('loading')} />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="mb-4 h-12 w-12 text-muted-foreground/60" />
          <h2 className="text-xl font-semibold">{t('emptyTitle')}</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{t('emptyDesc')}</p>
          <Button asChild className="mt-6">
            <Link href={`/${locale}/groups/new`}>
              <Plus className="mr-2 h-4 w-4" />
              {t('createGroup')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <Link key={group.id} href={`/${locale}/groups/${group.slug}`}>
          <Card className="h-full transition hover:border-primary/40 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14 rounded-xl">
                  <AvatarImage src={group.logo_url || undefined} alt={group.name} />
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                    {initials(group.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold">{group.name}</h3>
                    {group.type === 'company' && (
                      <Badge variant="outline" className="gap-1">
                        <Building2 className="h-3 w-3" />
                        {t('company')}
                      </Badge>
                    )}
                    {group.verification_status === 'verified' && (
                      <ShieldCheck className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  {group.slogan && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{group.slogan}</p>
                  )}
                  <Badge className="mt-3" variant="secondary">
                    {t(`roles.${group.role}`)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
