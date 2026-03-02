'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  bucket: 'avatars' | 'route-images';
  folder?: string;
  currentImageUrl?: string;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
  onRemove?: () => void;
  maxSizeMB?: number;
  allowedTypes?: string[];
  aspectRatio?: string;
  showPreview?: boolean;
  className?: string;
}

export function ImageUpload({
  bucket,
  folder = '',
  currentImageUrl,
  onUploadComplete,
  onUploadError,
  onRemove,
  maxSizeMB = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  aspectRatio = 'aspect-video',
  showPreview = true,
  className = '',
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = `Tipo de archivo no permitido. Usa: ${allowedTypes.join(', ')}`;
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    // Validar tamaño
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const errorMsg = `El archivo es muy grande. Máximo ${maxSizeMB}MB`;
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Subir a Supabase Storage — se envía contentType explícito para que
      // Supabase sirva el archivo con el Content-Type correcto (especialmente importante para WebP)
      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setPreviewUrl(publicUrl);
      onUploadComplete?.(publicUrl);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al subir la imagen';
      setError(errorMsg);
      onUploadError?.(errorMsg);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Resetear el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!previewUrl) return;

    try {
      // Intentar extraer el path del archivo de la URL
      const urlParts = previewUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Eliminar de Supabase Storage
      await supabase.storage.from(bucket).remove([filePath]);

      setPreviewUrl(null);
      onRemove?.();
      setError(null);
    } catch (err) {
      console.error('Error al eliminar imagen:', err);
      // Incluso si falla la eliminación del storage, limpiar el preview
      setPreviewUrl(null);
      onRemove?.();
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      <div className="space-y-3">
        {/* Preview de la imagen */}
        {showPreview && previewUrl && (
          <div className={`relative ${aspectRatio} w-full overflow-hidden rounded-lg border border-border bg-muted`}>
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              quality={90}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Botón de upload */}
        {!previewUrl && (
          <Button
            type="button"
            variant="outline"
            onClick={handleButtonClick}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Subir imagen
              </>
            )}
          </Button>
        )}

        {/* Mensaje cuando hay imagen pero no preview */}
        {!showPreview && previewUrl && (
          <div className="flex items-center justify-between p-3 bg-muted border border-border rounded-lg">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Imagen cargada</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Ayuda */}
        <p className="text-xs text-muted-foreground">
          Formatos: JPEG, PNG, WEBP. Tamaño máximo: {maxSizeMB}MB
        </p>
      </div>
    </div>
  );
}
