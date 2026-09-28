-- Temporarily disable the safety triggers that block direct deletion
ALTER TABLE storage.buckets DISABLE TRIGGER ALL;
ALTER TABLE storage.objects DISABLE TRIGGER ALL;

-- Completely wipe out all files inside the legacy buckets
DELETE FROM storage.objects 
WHERE bucket_id IN ('profile_photos', 'medif_files');

-- Delete the buckets themselves
DELETE FROM storage.buckets 
WHERE id IN ('profile_photos', 'medif_files');

-- Re-enable the safety triggers to keep your database secure
ALTER TABLE storage.buckets ENABLE TRIGGER ALL;
ALTER TABLE storage.objects ENABLE TRIGGER ALL;
