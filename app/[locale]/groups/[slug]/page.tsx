import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Building2, MapPin, ShieldCheck, Users, Route as RouteIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RouteCard } from '@/components/routes/RouteCard';
import { FollowGroupButton } from '@/components/groups/FollowGroupButton';

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations('groups');
  const supabase = await createClient();

  const { data: group, error } = await supabase
    .from('groups')
    .select('*, owner:profiles(*)')
    .eq('slug', slug)
    .single();

  if (error || !group) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  const [
    { count: membersCount },
    { count: followersCount },
    { data: routes },
    { data: member },
    { data: following },
  ] = await Promise.all([
    supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', group.id),
    supabase.from('group_followers').select('*', { count: 'exact', head: true }).eq('group_id', group.id),
    supabase
      .from('routes')
      .select('*, creator:profiles(*)')
      .eq('group_id', group.id)
      .eq('visibility', 'public')
      .in('status', ['published', 'completed'])
      .order('created_at', { ascending: false }),
    user
      ? supabase.from('group_members').select('role').eq('group_id', group.id).eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase.from('group_followers').select('id').eq('group_id', group.id).eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const canManage = member?.role === 'owner' || member?.role === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header locale={locale} />
      <main className="flex-1 pt-20">
        <section className="relative border-b bg-muted/30">
          <div className="relative h-56 overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-amber-900">
            {group.cover_image_url ? (
              <Image src={group.cover_image_url} alt={group.name} fill className="object-cover opacity-80" sizes="100vw" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <div className="absolute left-1/2 top-1/2 h-44 w-[min(720px,85vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/15 blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(245,158,11,0.22),transparent_26%)]" />
                <p className="relative max-w-4xl text-center text-4xl font-black tracking-normal text-white/90 drop-shadow-2xl sm:text-5xl md:text-6xl">
                  {group.name}
                </p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>

          <div className="container mx-auto px-4 pb-8">
            <div className="-mt-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <Avatar className="h-28 w-28 rounded-2xl border-4 border-background bg-background">
                  <AvatarImage src={group.logo_url || undefined} alt={group.name} />
                  <AvatarFallback className="rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
                    {initials(group.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-bold md:text-4xl">{group.name}</h1>
                    {group.type === 'company' && (
                      <Badge variant="outline" className="gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {t('company')}
                      </Badge>
                    )}
                    {group.verification_status === 'verified' && (
                      <Badge className="gap-1 bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {t('verified')}
                      </Badge>
                    )}
                  </div>
                  {group.slogan && <p className="max-w-2xl text-muted-foreground">{group.slogan}</p>}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{t('detail.membersCount', { count: membersCount ?? 0 })}</span>
                    <span className="flex items-center gap-1.5"><RouteIcon className="h-4 w-4" />{t('detail.routesCount', { count: routes?.length ?? 0 })}</span>
                    <span>{t('detail.followersCount', { count: followersCount ?? 0 })}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {user && <FollowGroupButton groupId={group.id} initialFollowing={Boolean(following)} />}
                {canManage && (
                  <Button asChild variant="outline">
                    <Link href={`/${locale}/groups/${group.slug}/settings`}>{t('detail.manage')}</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto grid gap-8 px-4 py-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            {group.description && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('detail.about')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-muted-foreground">{group.description}</p>
                </CardContent>
              </Card>
            )}

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold">{t('detail.routesTitle')}</h2>
              </div>
              {routes && routes.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {routes.map((route: any) => (
                    <RouteCard key={route.id} route={{ ...route, group }} locale={locale} />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-10 text-center text-muted-foreground">
                    {t('detail.emptyRoutes')}
                  </CardContent>
                </Card>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('detail.data')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {group.owner && (
                  <div>
                    <p className="text-muted-foreground">{t('detail.creator')}</p>
                    <p className="font-medium">{group.owner.full_name || group.owner.username}</p>
                  </div>
                )}
                {group.address && (
                  <div className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{group.address}</span>
                  </div>
                )}
                {group.website && (
                  <Button asChild variant="outline" className="w-full">
                    <a href={group.website} target="_blank" rel="noopener noreferrer">{t('detail.website')}</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
