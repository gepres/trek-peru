import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { GroupSettings } from '@/components/groups/GroupSettings';

export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations('groups');
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: group } = await supabase
    .from('groups')
    .select(`
      id,
      name,
      slug,
      owner_id,
      slogan,
      description,
      logo_url,
      type,
      legal_name,
      tax_id,
      business_email,
      business_phone,
      website,
      address,
      verification_status
    `)
    .eq('slug', slug)
    .single();

  if (!group) notFound();

  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (group.owner_id !== user.id && member?.role !== 'owner' && member?.role !== 'admin') {
    redirect(`/${locale}/groups/${slug}`);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('settings.pageTitle')}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {group.name}
        </p>
      </div>

      <GroupSettings locale={locale} group={group} />
    </div>
  );
}
