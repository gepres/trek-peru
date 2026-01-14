-- Create storage bucket for route images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('route-images', 'route-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow public viewing of route images
CREATE POLICY "Public Route Images Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'route-images' );

-- Policy to allow authenticated users to upload route images
CREATE POLICY "Authenticated Users Upload Route Images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'route-images'
  AND auth.role() = 'authenticated'
);

-- Policy to allow users to update their own route images
CREATE POLICY "Users Update Own Route Images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'route-images'
  AND auth.uid() = owner
);

-- Policy to allow users to delete their own route images
CREATE POLICY "Users Delete Own Route Images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'route-images'
  AND auth.uid() = owner
);
