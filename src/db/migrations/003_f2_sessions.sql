-- src/db/migrations/003_f2_sessions.sql
-- Extends sessions table with F2 state machine fields
-- Seeds El Mesón product catalog into restaurant_001.products
-- Run once in Supabase SQL editor

DO $$
DECLARE schema_name TEXT := 'restaurant_001';
BEGIN

  -- Extend sessions with conversation state machine
  EXECUTE format('ALTER TABLE %I.sessions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT ''greeting''', schema_name);
  EXECUTE format('ALTER TABLE %I.sessions ADD COLUMN IF NOT EXISTS phone_number TEXT', schema_name);
  EXECUTE format('ALTER TABLE %I.sessions ADD COLUMN IF NOT EXISTS stripe_payment_link TEXT', schema_name);
  EXECUTE format('ALTER TABLE %I.sessions ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT', schema_name);
  EXECUTE format('ALTER TABLE %I.sessions ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES %I.orders(id)', schema_name, schema_name);

  -- Seed El Mesón menu — Smash Burgers €10
  EXECUTE format('
    INSERT INTO %I.products (name, price, category, description, is_available, allowed_modifications) VALUES
      (''Super Smash Bros'',   10.00, ''burger'', ''Pan brioche, 2x90g carne smasheada, 2x queso Cheddar, bacon caramelizado, cebolla caramelizada, pepinillos, salsa secreta'', true, ''["sin pepinillos","sin cebolla","extra queso","sin bacon"]''),
      (''Oklahoma'',           10.00, ''burger'', ''Pan brioche, 2x90g carne estilo Oklahoma, queso Cheddar, queso Gouda, salsa misteriosa, patatas paja'', true, ''["sin patatas paja","extra queso"]''),
      (''Porky Pig'',          10.00, ''burger'', ''Pan brioche, 2x90g carne, queso Cheddar, queso Gouda, mermelada de bacon, salsa casa, crema cacahuete'', true, ''["sin crema cacahuete","sin mermelada bacon"]''),
      (''Say Cheeese'',        10.00, ''burger'', ''Pan brioche, 2x90g carne, 2x queso Cheddar, 2x queso Gouda, mermelada bacon, salsa Big Mac'', true, ''["sin mermelada bacon"]''),
      (''Lacy Lotus'',         10.00, ''burger'', ''Pan brioche, 2x90g carne estilo Lacy, 2x queso Cheddar, mermelada bacon, crema Lotus'', true, ''["sin crema Lotus","sin mermelada bacon"]''),
      (''Chupacabras'',        10.00, ''burger'', ''Pan brioche, 2x90g carne, queso Cheddar, queso Gouda, queso cabra, bacon caramelizado, mermelada pimiento piquillo'', true, ''["sin queso cabra","sin piquillo","sin bacon"]''),
      (''MC Royale'',          10.00, ''burger'', ''Pan brioche, 2x90g carne, 2x queso Cheddar, lechuga, pepinillos, cebolla dulce, salsa MC Royale'', true, ''["sin lechuga","sin pepinillos","sin cebolla"]'')
    ON CONFLICT DO NOTHING
  ', schema_name);

  -- Smash Burgers premium €13
  EXECUTE format('
    INSERT INTO %I.products (name, price, category, description, is_available, allowed_modifications) VALUES
      (''The Pulled Beast'',   13.00, ''burger'', ''Pan brioche, 2x90g carne, 2x queso Cheddar, salsa especial, mermelada bacon, pulled pork, Dorito bites'', true, ''["sin Dorito bites","sin pulled pork"]''),
      (''Third Strike'',       13.00, ''burger'', ''Pan brioche, 3x90g carne, 2x queso Cheddar, queso Gouda, cebolla caramelizada, salsa Ballantines miel'', true, ''["sin cebolla","extra queso"]''),
      (''Pitrufina'',          13.00, ''burger'', ''Pan brioche, 2x90g carne, 2x queso Gouda, mermelada bacon, huevo frito, mayo trufada casera'', true, ''["sin huevo","sin mayo trufada"]''),
      (''King Korn'',          13.00, ''burger'', ''Pan brioche, 2x90g carne, queso Gouda, queso Cheddar ahumado, costilla 24h BBQ, salsa King, Kikos Mistercorn'', true, ''["sin Kikos","sin costilla"]''),
      (''Rocky'',              13.00, ''burger'', ''Pan brioche, 2x90g carne, 3x queso Cheddar, papada crujiente, salsa Raising Cane''''s, salsa secreta, polvo baconeras'', true, ''["sin papada","extra queso"]''),
      (''Crazy Nuts'',         13.00, ''burger'', ''Burger del mes: pan brioche, 2x90g carne, queso Cheddar, queso Gouda, queso Cheddar ahumado, cebolla dulce, mermelada bacon, salsa Cane''''s, crema cacahuete'', true, ''["sin crema cacahuete","sin cebolla"]'')
    ON CONFLICT DO NOTHING
  ', schema_name);

  -- Raciones
  EXECUTE format('
    INSERT INTO %I.products (name, price, category, description, is_available, allowed_modifications) VALUES
      (''Alitas de Pollo (10uds)'',    7.00, ''racion'', ''Alitas marinadas en mezcla de especias secretas, fritas a la perfección'', true, ''[]''),
      (''Patatas Fritas Onduladas'',   6.00, ''racion'', ''Crujientes trozos de patata típicos de la cocina española'', true, ''[]''),
      (''Calamares'',                  7.00, ''racion'', ''Jugosos calamares rebozados en capa dorada y crujiente'', true, ''[]''),
      (''Fingers de Pollo (10uds)'',   7.00, ''racion'', ''Tiras de pechuga de pollo, interior tierno y jugoso'', true, ''[]''),
      (''Rabas'',                      7.00, ''racion'', ''Tiras de calamar rebozadas y fritas hasta textura crocante'', true, ''[]''),
      (''Nuggets de Pollo (10uds)'',   7.00, ''racion'', ''Tiernos bocados de pechuga de pollo empanizados'', true, ''[]'')
    ON CONFLICT DO NOTHING
  ', schema_name);

  -- Postres
  EXECUTE format('
    INSERT INTO %I.products (name, price, category, description, is_available, allowed_modifications) VALUES
      (''Cheesecake Tradicional'',     5.00, ''postre'', ''Cremosa y suave tarta de queso tradicional (para 2)'', true, ''[]''),
      (''Coulant Valrhona'',           2.50, ''postre'', ''Coulant de chocolate relleno de chocolate Valrhona fundido con nata'', true, ''[]''),
      (''Tequeños de Nocilla (4uds)'', 5.00, ''postre'', ''Tequeños de masa rellenos de Nocilla (para 2)'', true, ''[]'')
    ON CONFLICT DO NOTHING
  ', schema_name);

  RAISE NOTICE 'Migration 003 applied to schema %', schema_name;
END $$;
