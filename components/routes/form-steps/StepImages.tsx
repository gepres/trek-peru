'use client';

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
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            6. Imágenes
          </CardTitle>
          <CardDescription>
            Agrega fotos para mostrar la belleza de tu ruta (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Imagen destacada */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              Imagen Destacada
            </Label>
            <p className="text-sm text-muted-foreground">
              Esta imagen se mostrará como portada de tu ruta en los listados y búsquedas
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
              Galería de Imágenes
            </Label>
            <p className="text-sm text-muted-foreground">
              Agrega más fotos del paisaje, camino, campamentos, flora, fauna, etc.
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
              Máximo 10 imágenes. Formatos soportados: JPG, PNG, WebP
            </p>
          </div>

          {/* Info box */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm font-medium mb-2">Consejos para buenas fotos:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Usa fotos de alta calidad y bien iluminadas</li>
              <li>Muestra diferentes perspectivas de la ruta</li>
              <li>Incluye fotos del paisaje, camino y puntos de interés</li>
              <li>Evita fotos borrosas o de baja resolución</li>
              <li>Las fotos atractivas aumentan el interés de los participantes</li>
            </ul>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Imagen Destacada</p>
              <p className="text-sm font-medium">
                {featuredImage ? (
                  <span className="text-green-600 dark:text-green-400">✓ Agregada</span>
                ) : (
                  <span className="text-muted-foreground">No agregada</span>
                )}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Galería</p>
              <p className="text-sm font-medium">
                {images.length > 0 ? (
                  <span className="text-green-600 dark:text-green-400">
                    {images.length} {images.length === 1 ? 'imagen' : 'imágenes'}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Ninguna imagen</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
