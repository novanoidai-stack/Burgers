-- ============================================================================
-- RESTAURANT UPDATE SCRIPT FOR NOVO BURGER (Burger Rocket)
-- Execute this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- 1. CREATE restaurant_info TABLE
CREATE TABLE IF NOT EXISTS restaurant_info (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. INSERT restaurant data
INSERT INTO restaurant_info (key, value) VALUES
  ('name', 'Burger Rocket 🚀'),
  ('address', 'Calle Mayor 12, junto al Mercado Central, Valencia'),
  ('schedule', 'Lunes a Domingo: 13:00–16:00 y 20:00–23:30'),
  ('phone', '+34 612 345 678'),
  ('instagram', '@burgerrocket_vlc'),
  ('parking', 'Aparcamiento gratuito en Plaza del Mercado'),
  ('capacity', '35 personas (terraza exterior incluida)'),
  ('delivery', 'No disponemos de delivery. Solo recogida en local o consumo aquí.'),
  ('payment', 'Efectivo, tarjeta y Bizum disponibles'),
  ('reservations', 'Aceptamos reservas para grupos de +6 personas vía WhatsApp')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. ADD COLUMNS TO orders TABLE
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) CHECK (order_type IN ('takeaway', 'dine_in')),
ADD COLUMN IF NOT EXISTS pickup_time VARCHAR(50),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. EXPAND MENU — Clear old items (optional, comment out if you want to keep them)
-- DELETE FROM menu_items;

-- 5. INSERT COMPLETE MENU
INSERT INTO menu_items (id, name, description, price, category, available) VALUES
  -- HAMBURGUESAS
  (gen_random_uuid(), 'Clásica', 'Ternera 200g, lechuga, tomate, cebolla, pepino, ketchup y mostaza', 9.50, 'hamburguesas', true),
  (gen_random_uuid(), 'BBQ Bacon', 'Doble ternera, bacon crujiente, queso cheddar, cebolla caramelizada, salsa BBQ', 11.50, 'hamburguesas', true),
  (gen_random_uuid(), 'La Picante', 'Ternera 200g, jalapeños, queso pepper jack, sriracha, mayonesa de limón', 10.50, 'hamburguesas', true),
  (gen_random_uuid(), 'Crispy Chicken', 'Pollo empanado crujiente, ensalada coleslaw, pepinillos, mayo de miel', 10.00, 'hamburguesas', true),
  (gen_random_uuid(), 'Veggie Deluxe', 'Hamburguesa de legumbres, aguacate, rúcula, tomate seco, hummus', 9.50, 'hamburguesas', true),
  (gen_random_uuid(), 'La Doble', 'Doble ternera 2x150g, doble queso, bacon, salsa secreta, cebolla', 14.00, 'hamburguesas', true),

  -- ENTRANTES
  (gen_random_uuid(), 'Patatas Fritas', 'Patatas cortadas a mano con sal y especias', 3.50, 'entrantes', true),
  (gen_random_uuid(), 'Aros de Cebolla', 'Aros crujientes con salsa ranch', 4.00, 'entrantes', true),
  (gen_random_uuid(), 'Nuggets x8', 'Nuggets de pollo caseros con salsa de tu elección', 5.50, 'entrantes', true),
  (gen_random_uuid(), 'Mac & Cheese Bites', 'Bolitas de macarrones con queso rebozadas y fritas', 5.00, 'entrantes', true),

  -- BEBIDAS
  (gen_random_uuid(), 'Coca-Cola', 'Coca-Cola fría (33cl)', 2.50, 'bebidas', true),
  (gen_random_uuid(), 'Fanta Naranja', 'Fanta Naranja fría (33cl)', 2.50, 'bebidas', true),
  (gen_random_uuid(), 'Agua', 'Agua mineral (50cl)', 1.50, 'bebidas', true),
  (gen_random_uuid(), 'Limonada Casera', 'Limonada natural con menta y jengibre', 3.00, 'bebidas', true),
  (gen_random_uuid(), 'Batido del Día', 'Pregunta cuál es el sabor de hoy (platano, fresa, chocolate)', 4.50, 'bebidas', true),

  -- POSTRES
  (gen_random_uuid(), 'Brownie con Helado', 'Brownie caliente de chocolate con bola de vainilla', 5.00, 'postres', true),
  (gen_random_uuid(), 'Cheesecake', 'Porción de cheesecake de frutos rojos', 4.50, 'postres', true),
  (gen_random_uuid(), 'Helado x2 bolas', 'Elige 2 sabores del día (chocolate, vainilla, fresa, pistacho)', 3.00, 'postres', true),

  -- EXTRAS
  (gen_random_uuid(), 'Queso Extra', 'Queso extra (cualquier hamburguesa)', 1.00, 'extras', true),
  (gen_random_uuid(), 'Bacon Extra', 'Bacon extra crujiente', 1.50, 'extras', true),

  -- SALSAS
  (gen_random_uuid(), 'Salsa Extra', 'Salsa extra (ketchup, mostaza, mayo, ranch, BBQ, sriracha)', 0.50, 'salsas', true),
  (gen_random_uuid(), 'Crema de Queso', 'Crema de queso para aros, patatas o lo que pidas', 1.00, 'salsas', true)
ON CONFLICT DO NOTHING;

-- 6. VERIFY DATA
SELECT 'Restaurant info:' as section;
SELECT COUNT(*) as total_info FROM restaurant_info;

SELECT 'Menu items:' as section;
SELECT COUNT(*) as total_items, category FROM menu_items GROUP BY category;

SELECT 'Orders schema updated:' as section;
SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position;
