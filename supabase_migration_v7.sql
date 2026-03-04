-- Migration v7 (v4): Vehicle Category Assignment per Service (Clean State)

-- Limpar tabela anterior se existir para garantir as restrições corretas
DROP TABLE IF EXISTS service_prices; -- Remover tabela antiga de preços se existir
DROP TABLE IF EXISTS vehicle_categories CASCADE;

-- 1. Criar tabela de categorias com restrição de nome único
CREATE TABLE vehicle_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    is_visible BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Adicionar coluna de categoria na tabela de serviços
ALTER TABLE services ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES vehicle_categories(id);

-- 3. Inserir as categorias iniciais
INSERT INTO vehicle_categories (name, display_order) VALUES 
('Carro Baixo', 1),
('SUV''s ou Pickups', 2),
('Motos', 3);

-- 4. Vincular serviços atuais à categoria 'Carro Baixo'
UPDATE services 
SET category_id = (SELECT id FROM vehicle_categories WHERE name = 'Carro Baixo')
WHERE category_id IS NULL;
