-- Novo Burger — Supabase Database Schema
-- Copy and paste all SQL below into Supabase SQL Editor

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100),
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de items del menú
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  available BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'preparing', 'ready', 'completed', 'cancelled')),
  items JSONB NOT NULL DEFAULT '[]',
  total DECIMAL(10,2) DEFAULT 0,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  payment_id VARCHAR(255),
  channel VARCHAR(10) NOT NULL CHECK (channel IN ('whatsapp', 'voice')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  stripe_payment_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de conversaciones
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  messages JSONB NOT NULL DEFAULT '[]',
  channel VARCHAR(10) NOT NULL CHECK (channel IN ('whatsapp', 'voice')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar algunos items de menú de ejemplo
INSERT INTO menu_items (name, description, price, category) VALUES
  ('Clásica', 'Hamburguesa con lechuga, tomate, cebolla y salsa especial', 8.50, 'hamburguesas'),
  ('Doble Cheese', 'Doble carne con doble queso cheddar', 11.00, 'hamburguesas'),
  ('BBQ Bacon', 'Con bacon crujiente y salsa BBQ', 12.50, 'hamburguesas'),
  ('Veggie Burger', 'Hamburguesa vegetal con aguacate', 9.50, 'hamburguesas'),
  ('Patatas Fritas', 'Porción grande de patatas crujientes', 3.50, 'complementos'),
  ('Aros de Cebolla', 'Aros empanados crujientes', 4.00, 'complementos'),
  ('Nuggets (6 uds)', 'Nuggets de pollo crujientes', 5.00, 'complementos'),
  ('Coca-Cola', 'Lata 33cl', 2.00, 'bebidas'),
  ('Agua', 'Botella 50cl', 1.50, 'bebidas'),
  ('Cerveza', 'Caña de cerveza artesana', 3.00, 'bebidas'),
  ('Batido Chocolate', 'Batido cremoso de chocolate', 4.50, 'bebidas');
