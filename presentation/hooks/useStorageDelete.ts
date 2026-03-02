'use client';

import { createClient } from '@/lib/supabase/client';

/** Extrae el path relativo dentro del bucket a partir de la URL pública de Supabase.
 *  Formato URL: https://xxx.supabase.co/storage/v1/object/public/[bucket]/[path]
 */
function extractStoragePath(url: string, bucketName: string): string {
  const marker = `/object/public/${bucketName}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return '';
  return decodeURIComponent(url.substring(idx + marker.length));
}

// Hook para operaciones de eliminación en Supabase Storage
export function useStorageDelete() {
  const supabase = createClient();

  /**
   * Elimina un archivo del storage dado su URL pública y el nombre del bucket.
   * Lanza un error si la operación falla.
   */
  const deleteFile = async (url: string, bucket: string): Promise<void> => {
    const filePath = extractStoragePath(url, bucket);
    if (!filePath) return;

    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) throw new Error(error.message);
  };

  return { deleteFile };
}
