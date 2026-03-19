'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { ImageGallery } from '@/components/shared/ImageGallery';
import { Image as ImageIcon, Star } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface StepImagesProps {
  featuredImage: string | undefined;
  setFeaturedImage: (image: string | undefined) => void;
  images: string[];
  setImages: (images: string[]) => void;
}

export function StepImages({
  featuredImage,
  setFeaturedImage,
  images,
  setImages,
}: StepImagesProps) {
  const t = useTranslations('routeForm');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {t('step6Title')}
          </CardTitle>
          <CardDescription>
            {t('step6Desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Imagen destacada */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              {t('featuredImageLabel')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('featuredImageHint')}
            </p>
            <ImageUpload
              bucket="route-images"
              folder="featured"
              currentImageUrl={featuredImage}
              onUploadComplete={setFeaturedImage}
            />
          </div>

          {/* Galería de imágenes */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4" />
              {t('galleryLabel')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('galleryHint')}
            </p>
            <ImageGallery
              images={images}
              onImagesChange={setImages}
              bucket="route-images"
              folder="gallery"
              maxImages={10}
              editable={true}
            />
            <p className="text-xs text-muted-foreground">
              {t('galleryMax')}
            </p>
          </div>

          {/* Info box */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm font-medium mb-2">{t('photoTips')}</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>{t('photoTip1')}</li>
              <li>{t('photoTip2')}</li>
              <li>{t('photoTip3')}</li>
              <li>{t('photoTip4')}</li>
              <li>{t('photoTip5')}</li>
            </ul>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground mb-1">{t('featuredImageLabel')}</p>
              <p className="text-sm font-medium">
                {featuredImage ? (
                  <span className="text-green-600 dark:text-green-400">✓ {t('addedStatus')}</span>
                ) : (
                  <span className="text-muted-foreground">{t('notAddedStatus')}</span>
                )}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground mb-1">{t('galleryLabel')}</p>
              <p className="text-sm font-medium">
                {images.length > 0 ? (
                  <span className="text-green-600 dark:text-green-400">
                    {images.length} {images.length === 1 ? t('imageSingular') : t('imagePlural')}
                  </span>
                ) : (
                  <span className="text-muted-foreground">{t('noImages')}</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
