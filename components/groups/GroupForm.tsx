'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Building2, Loader2, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/shared/ImageUpload';

interface GroupFormProps {
  locale: string;
}

type GroupType = 'community' | 'company';

function buildSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
}

export function GroupForm({ locale }: GroupFormProps) {
  const t = useTranslations('groups');
  const router = useRouter();
  const supabase = createClient();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slogan, setSlogan] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [type, setType] = useState<GroupType>('community');
  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');

  function handleNameChange(value: string) {
    setName(value);
    if (!slug) setSlug(buildSlug(value));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cleanSlug = buildSlug(slug || name);
    if (!name.trim() || cleanSlug.length < 3) {
      setError(t('errors.required'));
      return;
    }

    if (type === 'company' && (!legalName.trim() || !taxId.trim() || !businessEmail.trim())) {
      setError(t('errors.companyRequired'));
      return;
    }

    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('errors.mustLogin'));

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          owner_id: user.id,
          name: name.trim(),
          slug: cleanSlug,
          slogan: slogan.trim() || null,
          description: description.trim() || null,
          logo_url: logoUrl,
          type,
          visibility: 'public',
          legal_name: type === 'company' ? legalName.trim() : null,
          tax_id: type === 'company' ? taxId.trim() : null,
          business_email: type === 'company' ? businessEmail.trim() : null,
          business_phone: type === 'company' ? businessPhone.trim() || null : null,
          website: type === 'company' ? website.trim() || null : null,
          address: type === 'company' ? address.trim() || null : null,
          verification_status: type === 'company' ? 'pending' : 'none',
        })
        .select('id, slug')
        .single();

      if (groupError) throw groupError;

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      router.push(`/${locale}/groups/${group.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('form.identityTitle')}</CardTitle>
          <CardDescription>{t('form.identityDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="group-name">{t('form.name')} *</Label>
              <Input id="group-name" value={name} onChange={(event) => handleNameChange(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-slug">{t('form.slug')} *</Label>
              <Input id="group-slug" value={slug} onChange={(event) => setSlug(buildSlug(event.target.value))} />
              <p className="text-xs text-muted-foreground">{t('form.slugHint')}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-slogan">{t('form.slogan')}</Label>
            <Input id="group-slogan" value={slogan} onChange={(event) => setSlogan(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-description">{t('form.description')}</Label>
            <Textarea
              id="group-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('form.logo')}</Label>
            <ImageUpload
              bucket="route-images"
              folder="group-logos"
              currentImageUrl={logoUrl || undefined}
              onUploadComplete={setLogoUrl}
              onRemove={() => setLogoUrl(null)}
              aspectRatio="aspect-square max-w-40"
              maxSizeMB={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('form.typeTitle')}</CardTitle>
          <CardDescription>{t('form.typeDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Select value={type} onValueChange={(value) => setType(value as GroupType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="community">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  {t('types.community')}
                </div>
              </SelectItem>
              <SelectItem value="company">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  {t('types.company')}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {type === 'company' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="legal-name">{t('form.legalName')} *</Label>
                <Input id="legal-name" value={legalName} onChange={(event) => setLegalName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-id">{t('form.taxId')} *</Label>
                <Input id="tax-id" value={taxId} onChange={(event) => setTaxId(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-email">{t('form.businessEmail')} *</Label>
                <Input id="business-email" type="email" value={businessEmail} onChange={(event) => setBusinessEmail(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-phone">{t('form.businessPhone')}</Label>
                <Input id="business-phone" value={businessPhone} onChange={(event) => setBusinessPhone(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">{t('form.website')}</Label>
                <Input id="website" value={website} onChange={(event) => setWebsite(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t('form.address')}</Label>
                <Input id="address" value={address} onChange={(event) => setAddress(event.target.value)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push(`/${locale}/groups`)}>
          {t('cancel')}
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('saving')}
            </>
          ) : t('create')}
        </Button>
      </div>
    </form>
  );
}
