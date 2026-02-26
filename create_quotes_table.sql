-- Migration to create quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    vehicle_color TEXT,
    vehicle_model_year TEXT,
    vehicle_photos TEXT[], -- Array of base64 strings or URLs
    polishing_type TEXT, -- 'COMERCIAL' | 'TECNICO' | 'MAQUIAGEM'
    upholstery_options TEXT[], -- ['BANCOS', 'CARPETE', 'TETO']
    upholstery_photos TEXT[],
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS Policies
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own quotes" ON quotes
    FOR SELECT USING (client_id IN (SELECT id FROM clients WHERE phone = current_setting('request.jwt.claims', true)::json->>'phone'));

CREATE POLICY "Clients can insert their own quotes" ON quotes
    FOR INSERT WITH CHECK (true); -- Simplified for now, or match client_id

CREATE POLICY "Admins can do everything on quotes" ON quotes
    FOR ALL USING (true);
