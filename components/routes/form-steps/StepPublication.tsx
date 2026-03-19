'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff, Link as LinkIcon, FileText } from 'lucide-react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { RouteFormInput } from '@/lib/validations/route.schema';
import { useTranslations } from 'next-intl';

interface StepPublicationProps {
  register: UseFormRegister<RouteFormInput>;
  errors: FieldErrors<RouteFormInput>;
  watch: UseFormWatch<RouteFormInput>;
  setValue: UseFormSetValue<RouteFormInput>;
}

export function StepPublication({ register, errors, watch, setValue }: StepPublicationProps) {
  const t = useTranslations('routeForm');
  const status = watch('status');
  const visibility = watch('visibility');

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
