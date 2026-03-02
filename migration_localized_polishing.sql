-- Execute este comando no SQL Editor do seu Supabase para adicionar o suporte a fotos no polimento localizado
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS localized_polishing_photos TEXT[];
