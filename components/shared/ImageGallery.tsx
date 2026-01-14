'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ImageUpload } from './ImageUpload';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface ImageGalleryProps {
  images: string[];
  onImagesChange?: (images: string[]) => void;
  bucket?: 'avatars' | 'route-images';
  folder?: string;
  maxImages?: number;
  editable?: boolean;
  className?: string;
}

export function ImageGallery({
  images,
  onImagesChange,
  bucket = 'route-images',
  folder = '',
  maxImages = 10,
  editable = false,
  className = '',
}: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const handleUploadComplete = (url: string) => {
    const newImages = [...images, url];
    onImagesChange?.(newImages);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange?.(newImages);
  };

  const handlePrevImage = () => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((prev) =>
      prev === 0 ? images.length - 1 : (prev ?? 0) - 1
    );
  };

  const handleNextImage = () => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((prev) =>
      prev === images.length - 1 ? 0 : (prev ?? 0) + 1
    );
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className={className}>
      {/* Grid de imágenes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {images.map((imageUrl, index) => (
          <div
            key={index}
            className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted group cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedImageIndex(index)}
          >
            <Image
              src={imageUrl}
              alt={`Imagen ${index + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />

            {/* Overlay con acciones */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-10 w-10 shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(index);
                }}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>

              {editable && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-10 w-10 shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(index);
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Número de imagen */}
            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-md">
              {index + 1}/{images.length}
            </div>
          </div>
        ))}

        {/* Botón para agregar más imágenes */}
        {editable && canAddMore && (
          <div className="aspect-video rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-center p-4">
            <ImageUpload
              bucket={bucket}
              folder={folder}
              onUploadComplete={handleUploadComplete}
            />
          </div>
        )}
      </div>

      {/* Mensaje cuando no hay imágenes */}
      {images.length === 0 && !editable && (
        <div className="text-center py-12 px-4 border-2 border-dashed border-border rounded-lg bg-muted/20">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">No hay imágenes disponibles</p>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay imágenes pero es editable */}
      {images.length === 0 && editable && (
        <div className="border-2 border-dashed border-border rounded-lg p-8 md:p-12 bg-muted/20 hover:bg-muted/30 transition-colors">
          <div className="text-center space-y-6 max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-base mb-2">
                Agrega imágenes a tu ruta
              </p>
              <p className="text-sm text-muted-foreground">
                Sube fotos que muestren los paisajes, el recorrido y los puntos destacados de la ruta
              </p>
            </div>
            <ImageUpload
              bucket={bucket}
              folder={folder}
              onUploadComplete={handleUploadComplete}
              showPreview={false}
              className="max-w-xs mx-auto"
            />
          </div>
        </div>
      )}

      {/* Info de límite */}
      {editable && images.length > 0 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {images.length} de {maxImages} imágenes subidas
          </p>
          {!canAddMore && (
            <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
              Límite alcanzado
            </p>
          )}
        </div>
      )}

      {/* Modal de imagen ampliada */}
      <Dialog
        open={selectedImageIndex !== null}
        onOpenChange={(open) => !open && setSelectedImageIndex(null)}
      >
        <DialogContent className="max-w-5xl p-0 bg-black/95">
          <DialogTitle className="sr-only">Galería de imágenes</DialogTitle>
          {selectedImageIndex !== null && (
            <div className="relative">
              {/* Imagen principal */}
              <div className="relative aspect-video w-full min-h-[60vh] bg-black">
                <Image
                  src={images[selectedImageIndex]}
                  alt={`Imagen ${selectedImageIndex + 1}`}
                  fill
                  className="object-contain"
                />
              </div>

              {/* Controles de navegación */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-xl"
                    onClick={handlePrevImage}
                  >
                    <ChevronLeft className="h-7 w-7" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-xl"
                    onClick={handleNextImage}
                  >
                    <ChevronRight className="h-7 w-7" />
                  </Button>
                </>
              )}

              {/* Contador */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full">
                {selectedImageIndex + 1} / {images.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
