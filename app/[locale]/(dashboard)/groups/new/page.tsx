import { getTranslations } from 'next-intl/server';
import { GroupForm } from '@/components/groups/GroupForm';

export default async function NewGroupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('groups');

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('new.title')}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t('new.description')}
        </p>
      </div>

      <GroupForm locale={locale} />
    </div>
  );
}
