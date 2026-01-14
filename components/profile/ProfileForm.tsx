'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, ProfileInput } from '@/lib/validations/user.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Upload, User } from 'lucide-react';
import { Profile } from '@/types/user.types';

interface ProfileFormProps {
  profile: Profile;
  onSuccess?: () => void;
}

// Componente de formulario para editar perfil de usuario
export function ProfileForm({ profile, onSuccess }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name || '',
      username: profile.username || '',
      bio: profile.bio || '',
      experience_level: profile.experience_level || undefined,
      location: profile.location || '',
      phone: profile.phone || '',
      birth_date: profile.birth_date || '',
    },
  });

  const experienceLevel = watch('experience_level');

  // Manejar selección de avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona un archivo de imagen',
        variant: 'destructive',
      });
      return;
    }

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'La imagen no debe superar los 2MB',
        variant: 'destructive',
      });
      return;
    }

    setAvatarFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Subir avatar a Supabase Storage
  async function uploadAvatar(): Promise<string | null> {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Subir archivo (requiere bucket 'avatars' configurado en Supabase)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        // Si el bucket no existe, mostrar mensaje informativo
        if (uploadError.message.includes('not found')) {
          toast({
            title: 'Configuración pendiente',
            description: 'El almacenamiento de imágenes aún no está configurado. Continúa con los otros cambios.',
          });
          return null;
        }
        throw uploadError;
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  }

  // Enviar formulario
  async function onSubmit(data: ProfileInput) {
    try {
      setIsLoading(true);

      // Subir avatar si hay uno nuevo
      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        const newAvatarUrl = await uploadAvatar();
        if (newAvatarUrl) {
          avatarUrl = newAvatarUrl;
        }
      }

      // Actualizar perfil en Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          username: data.username,
          bio: data.bio || null,
          experience_level: data.experience_level || null,
          location: data.location || null,
          phone: data.phone || null,
          birth_date: data.birth_date || null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) {
        // Manejar error de username duplicado
        if (error.code === '23505') {
          toast({
            title: 'Error',
            description: 'Este nombre de usuario ya está en uso',
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      toast({
        title: 'Perfil actualizado',
        description: 'Tus cambios han sido guardados exitosamente',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo actualizar el perfil',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Obtener iniciales para avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Avatar */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-6 border-b border-border">
        <Avatar className="h-32 w-32 shrink-0">
          <AvatarImage src={avatarPreview || undefined} alt={profile.full_name || ''} />
          <AvatarFallback className="bg-primary/10 text-primary text-3xl font-semibold">
            {profile.full_name ? getInitials(profile.full_name) : <User className="h-16 w-16" />}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-3 text-center md:text-left">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Foto de perfil</h3>
            <p className="text-sm text-muted-foreground">Actualiza tu foto de perfil</p>
          </div>
          <div className="flex flex-col items-center md:items-start gap-2">
            <Label
              htmlFor="avatar"
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors"
            >
              <Upload className="h-4 w-4" />
              Cambiar foto
            </Label>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <p className="text-xs text-muted-foreground">JPG, PNG o GIF (máx. 2MB)</p>
          </div>
        </div>
      </div>

      {/* Información personal */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Información Personal</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre completo */}
          <div className="space-y-2">
            <Label htmlFor="full_name">
              Nombre completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              {...register('full_name')}
              placeholder="Juan Pérez"
              disabled={isLoading}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          {/* Nombre de usuario */}
          <div className="space-y-2">
            <Label htmlFor="username">
              Nombre de usuario <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">@</span>
              <Input
                id="username"
                {...register('username')}
                placeholder="juanperez"
                disabled={isLoading}
                className="flex-1"
              />
            </div>
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
          </div>
        </div>

        {/* Biografía */}
        <div className="space-y-2">
          <Label htmlFor="bio">Biografía</Label>
          <Textarea
            id="bio"
            {...register('bio')}
            placeholder="Cuéntanos sobre ti, tu experiencia en trekking..."
            rows={4}
            disabled={isLoading}
          />
          {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
          <p className="text-xs text-muted-foreground">Máximo 500 caracteres</p>
        </div>

        {/* Nivel de experiencia */}
        <div className="space-y-2">
          <Label htmlFor="experience_level">Nivel de experiencia en trekking</Label>
          <Select
            value={experienceLevel || 'beginner'}
            onValueChange={(value) => setValue('experience_level', value as any)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tu nivel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Principiante</SelectItem>
              <SelectItem value="intermediate">Intermedio</SelectItem>
              <SelectItem value="advanced">Avanzado</SelectItem>
              <SelectItem value="expert">Experto</SelectItem>
            </SelectContent>
          </Select>
          {errors.experience_level && (
            <p className="text-sm text-destructive">{errors.experience_level.message}</p>
          )}
        </div>
      </div>

      {/* Información de contacto */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Información de Contacto</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ubicación */}
          <div className="space-y-2">
            <Label htmlFor="location">Ubicación</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="Lima, Perú"
              disabled={isLoading}
            />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location.message}</p>
            )}
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="+51 999 999 999"
              disabled={isLoading}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>

          {/* Fecha de nacimiento */}
          <div className="space-y-2">
            <Label htmlFor="birth_date">Fecha de nacimiento</Label>
            <Input
              id="birth_date"
              type="date"
              {...register('birth_date')}
              disabled={isLoading}
            />
            {errors.birth_date && (
              <p className="text-sm text-destructive">{errors.birth_date.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-4 pt-6 border-t border-border">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando cambios...
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </div>
    </form>
  );
}
