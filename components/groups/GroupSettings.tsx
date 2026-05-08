'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Building2, CheckCircle2, Loader2, Save, Trash2, UserPlus, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { ImageUpload } from '@/components/shared/ImageUpload';
import type { GroupMemberRole, GroupType, GroupVerificationStatus } from '@/types/database.types';

interface GroupSettingsProps {
  locale: string;
  group: {
    id: string;
    name: string;
    slug: string;
    slogan?: string | null;
    description?: string | null;
    logo_url?: string | null;
    type: GroupType;
    legal_name?: string | null;
    tax_id?: string | null;
    business_email?: string | null;
    business_phone?: string | null;
    website?: string | null;
    address?: string | null;
    verification_status: GroupVerificationStatus;
  };
}

interface MemberItem {
  id: string;
  role: GroupMemberRole;
  user: {
    id: string;
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
  };
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);
}

export function GroupSettings({ locale, group }: GroupSettingsProps) {
  const t = useTranslations('groups');
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState(group.name);
  const [slogan, setSlogan] = useState(group.slogan || '');
  const [description, setDescription] = useState(group.description || '');
  const [logoUrl, setLogoUrl] = useState<string | null>(group.logo_url || null);
  const [type, setType] = useState<GroupType>(group.type);
  const [legalName, setLegalName] = useState(group.legal_name || '');
  const [taxId, setTaxId] = useState(group.tax_id || '');
  const [businessEmail, setBusinessEmail] = useState(group.business_email || '');
  const [businessPhone, setBusinessPhone] = useState(group.business_phone || '');
  const [website, setWebsite] = useState(group.website || '');
  const [address, setAddress] = useState(group.address || '');
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [identifier, setIdentifier] = useState('');
  const [newRole, setNewRole] = useState<Exclude<GroupMemberRole, 'owner'>>('member');
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const savedMessage = t('settings.savedInline');

  const fetchMembers = useCallback(async () => {
    const { data, error: membersError } = await supabase
      .from('group_members')
      .select('id, role, user:profiles(id, full_name, username, avatar_url)')
      .eq('group_id', group.id)
      .order('joined_at', { ascending: true });

    if (!membersError) {
      setMembers((data || []) as unknown as MemberItem[]);
    }
  }, [group.id, supabase]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function saveGroup() {
    setError(null);
    setMessage(null);

    if (type === 'company' && (!legalName.trim() || !taxId.trim() || !businessEmail.trim())) {
      setError(t('errors.companyRequired'));
      return;
    }

    try {
      setIsSaving(true);
      const { error: updateError } = await supabase
        .from('groups')
        .update({
          name: name.trim(),
          slogan: slogan.trim() || null,
          description: description.trim() || null,
          logo_url: logoUrl,
          type,
          legal_name: type === 'company' ? legalName.trim() : null,
          tax_id: type === 'company' ? taxId.trim() : null,
          business_email: type === 'company' ? businessEmail.trim() : null,
          business_phone: type === 'company' ? businessPhone.trim() || null : null,
          website: type === 'company' ? website.trim() || null : null,
          address: type === 'company' ? address.trim() || null : null,
          verification_status: type === 'company' && group.verification_status === 'none'
            ? 'pending'
            : group.verification_status,
        })
        .eq('id', group.id);

      if (updateError) throw updateError;
      setMessage(savedMessage);
      toast({
        title: t('settings.savedToastTitle'),
        description: t('settings.savedToastDesc'),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.updateError'));
    } finally {
      setIsSaving(false);
    }
  }

  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      setIsAdding(true);
      const { error: addError } = await supabase.rpc('add_group_member_by_identifier', {
        p_group_id: group.id,
        p_identifier: identifier,
        p_role: newRole,
      });

      if (addError) throw addError;
      setIdentifier('');
      setNewRole('member');
      setMessage(t('settings.memberSaved'));
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.memberAddError'));
    } finally {
      setIsAdding(false);
    }
  }

  async function updateRole(memberId: string, role: Exclude<GroupMemberRole, 'owner'>) {
    setError(null);
    const { error: roleError } = await supabase.rpc('update_group_member_role', {
      p_member_id: memberId,
      p_role: role,
    });

    if (roleError) {
      setError(roleError.message);
      return;
    }

    await fetchMembers();
  }

  async function removeMember(memberId: string) {
    setError(null);
    const { error: removeError } = await supabase.rpc('remove_group_member', {
      p_member_id: memberId,
    });

    if (removeError) {
      setError(removeError.message);
      return;
    }

    await fetchMembers();
  }

  return (
    <div className="space-y-6">
      {(error || message) && (
        <div className={`rounded-lg border p-4 text-sm ${
          error
            ? 'border-destructive/20 bg-destructive/10 text-destructive'
            : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700'
        }`}>
          {error || message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.groupDataTitle')}</CardTitle>
          <CardDescription>{t('settings.groupDataDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="group-name">{t('form.name')}</Label>
              <Input id="group-name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.type')}</Label>
              <Select value={type} onValueChange={(value) => setType(value as GroupType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="community">{t('types.community')}</SelectItem>
                  <SelectItem value="company">{t('types.company')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-slogan">{t('form.slogan')}</Label>
            <Input id="group-slogan" value={slogan} onChange={(event) => setSlogan(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-description">{t('form.description')}</Label>
            <Textarea id="group-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={5} />
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

          {type === 'company' && (
            <div className="grid gap-4 rounded-xl border bg-muted/20 p-4 md:grid-cols-2">
              <div className="md:col-span-2 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">{t('settings.companyData')}</p>
                <Badge variant="outline">{t(`verification.${group.verification_status}`)}</Badge>
              </div>
              <div className="space-y-2">
                <Label>{t('form.legalName')}</Label>
                <Input value={legalName} onChange={(event) => setLegalName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('form.taxId')}</Label>
                <Input value={taxId} onChange={(event) => setTaxId(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('form.businessEmail')}</Label>
                <Input type="email" value={businessEmail} onChange={(event) => setBusinessEmail(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('form.businessPhone')}</Label>
                <Input value={businessPhone} onChange={(event) => setBusinessPhone(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('form.website')}</Label>
                <Input value={website} onChange={(event) => setWebsite(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('form.address')}</Label>
                <Input value={address} onChange={(event) => setAddress(event.target.value)} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {message === savedMessage ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                <span>{message}</span>
              </div>
            ) : (
              <span />
            )}
            <Button onClick={saveGroup} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t('settings.saveChanges')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {t('settings.membersTitle')}
          </CardTitle>
          <CardDescription>{t('settings.membersDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={addMember} className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <Input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={t('settings.memberPlaceholder')}
            />
            <Select value={newRole} onValueChange={(value) => setNewRole(value as Exclude<GroupMemberRole, 'owner'>)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">{t('roles.member')}</SelectItem>
                <SelectItem value="organizer">{t('roles.organizer')}</SelectItem>
                <SelectItem value="admin">{t('roles.admin')}</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={isAdding} className="gap-2">
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {t('settings.addMember')}
            </Button>
          </form>

          <div className="divide-y rounded-xl border">
            {members.map((member) => {
              const displayName = member.user.full_name || member.user.username || t('fallbackUser');
              const isOwner = member.role === 'owner';

              return (
                <div key={member.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.user.avatar_url || undefined} alt={displayName} />
                      <AvatarFallback>{initials(displayName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{displayName}</p>
                      {member.user.username && <p className="text-sm text-muted-foreground">@{member.user.username}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOwner ? (
                      <Badge>{t('roles.owner')}</Badge>
                    ) : (
                      <Select value={member.role} onValueChange={(value) => updateRole(member.id, value as Exclude<GroupMemberRole, 'owner'>)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">{t('roles.member')}</SelectItem>
                          <SelectItem value="organizer">{t('roles.organizer')}</SelectItem>
                          <SelectItem value="admin">{t('roles.admin')}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isOwner}
                      onClick={() => removeMember(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button asChild variant="outline">
          <Link href={`/${locale}/groups/${group.slug}`}>{t('settings.viewPublicPage')}</Link>
        </Button>
      </div>
    </div>
  );
}
