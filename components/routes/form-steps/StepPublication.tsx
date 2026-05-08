'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Eye, EyeOff, Link as LinkIcon, FileText, User, Users } from 'lucide-react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { RouteFormInput } from '@/lib/validations/route.schema';
import { useTranslations } from 'next-intl';

interface StepPublicationProps {
  register: UseFormRegister<RouteFormInput>;
  errors: FieldErrors<RouteFormInput>;
  watch: UseFormWatch<RouteFormInput>;
  setValue: UseFormSetValue<RouteFormInput>;
  groups: Array<{
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
    type: 'community' | 'company';
    role: 'owner' | 'admin' | 'organizer' | 'member';
  }>;
  locale: string;
}

export function StepPublication({ register, errors, watch, setValue, groups, locale }: StepPublicationProps) {
  const t = useTranslations('routeForm');
  const status = watch('status');
  const visibility = watch('visibility');
  const groupId = watch('group_id');
  const showCreator = watch('show_creator_on_group_routes');
  const hasSelectedGroup = Boolean(groupId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('step3Title')}</CardTitle>
          <CardDescription>
            {t('step3Desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado */}
          <div className="space-y-2">
            <Label htmlFor="status" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('routeStatus')} <span className="text-destructive">*</span>
            </Label>
            <Select
              defaultValue={status}
              onValueChange={(value: any) => setValue('status', value)}
            >
              <SelectTrigger className={errors.status ? 'border-destructive' : ''}>
                <SelectValue placeholder={t('selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                    <div>
                      <div className="font-medium">{t('draft')}</div>
                      <div className="text-xs text-muted-foreground">
                        {t('draftDesc')}
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="published">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <div>
                      <div className="font-medium">{t('published')}</div>
                      <div className="text-xs text-muted-foreground">
                        {t('publishedDesc')}
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="cancelled">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <div>
                      <div className="font-medium">{t('cancelledLabel')}</div>
                      <div className="text-xs text-muted-foreground">
                        {t('cancelledDesc')}
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <div>
                      <div className="font-medium">{t('completedLabel')}</div>
                      <div className="text-xs text-muted-foreground">
                        {t('completedDesc')}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>

          {/* Visibilidad */}
          <div className="space-y-2">
            <Label htmlFor="visibility" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t('visibility')} <span className="text-destructive">*</span>
            </Label>
            <Select
              defaultValue={visibility}
              onValueChange={(value: any) => setValue('visibility', value)}
            >
              <SelectTrigger className={errors.visibility ? 'border-destructive' : ''}>
                <SelectValue placeholder={t('selectVisibility')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="font-medium">{t('visibilityPublic')}</div>
                      <div className="text-xs text-muted-foreground">
                        {t('visibilityPublicDesc')}
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="link">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium">{t('visibilityLink')}</div>
                      <div className="text-xs text-muted-foreground">
                        {t('visibilityLinkDesc')}
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{t('visibilityPrivate')}</div>
                      <div className="text-xs text-muted-foreground">
                        {t('visibilityPrivateDesc')}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          {errors.visibility && (
              <p className="text-sm text-destructive">{errors.visibility.message}</p>
            )}
          </div>

          <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
            <div>
              <Label htmlFor="route-organizer" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t('organizerTitle')}
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">{t('organizerDesc')}</p>
            </div>

            <Select
              value={groupId || 'personal'}
              onValueChange={(value) => {
                setValue('group_id', value === 'personal' ? null : value, { shouldDirty: true, shouldValidate: true });
                if (value === 'personal') {
                  setValue('show_creator_on_group_routes', false, { shouldDirty: true });
                }
              }}
            >
              <SelectTrigger id="route-organizer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">{t('organizerPersonal')}</div>
                      <div className="text-xs text-muted-foreground">{t('organizerPersonalDesc')}</div>
                    </div>
                  </div>
                </SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center gap-2">
                      {group.type === 'company' ? (
                        <Building2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Users className="h-4 w-4 text-primary" />
                      )}
                      <div>
                        <div className="font-medium">{group.name}</div>
                        <div className="text-xs text-muted-foreground">@{group.slug}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {groups.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t('noGroupsHint')}{' '}
                <a href={`/${locale}/groups/new`} className="font-medium text-primary hover:underline">
                  {t('createGroupLink')}
                </a>
              </p>
            )}

            {hasSelectedGroup && (
              <div className="flex items-center justify-between gap-4 rounded-lg border bg-background p-3">
                <div>
                  <Label htmlFor="show-creator" className="text-sm font-medium">
                    {t('showCreatorLabel')}
                  </Label>
                  <p className="text-xs text-muted-foreground">{t('showCreatorHint')}</p>
                </div>
                <Switch
                  id="show-creator"
                  checked={Boolean(showCreator)}
                  onCheckedChange={(checked) => setValue('show_creator_on_group_routes', checked, { shouldDirty: true })}
                />
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground">
              <strong>{t('recommendation')}</strong>{' '}
              {t('recommendationFull_1')}{' '}
              <span className='text-foreground font-medium'>{t('draft')}</span>{' '}
              {t('recommendationFull_2')}{' '}
              <span className='text-foreground font-medium'>{t('published')}</span>{' '}
              {t('recommendationFull_3')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
