import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GroupsList } from '@/components/groups/GroupsList';

export default async function GroupsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('groups');

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('page.title')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('page.description')}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/groups/new`}>
            <Plus className="mr-2 h-4 w-4" />
            {t('createGroup')}
          </Link>
        </Button>
      </div>

      <GroupsList locale={locale} />
    </div>
  );
}
