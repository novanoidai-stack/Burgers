# INVENTORY ENGINE — Novo Food
**Última actualización**: 2026-03-31

Motor de Inteligencia de Cocina: gestión de stock dinámico y carga de cocina en tiempo real.

---

## 1. TOKEN DE TIEMPO (Kitchen Load Balancing)

### Problema que resuelve
Cuando la cocina está saturada, el bot acepta pedidos que tardarán 90+ minutos sin avisar al cliente. Esto genera cancelaciones y mala experiencia.

### Algoritmo

```typescript
interface CookingItem {
  product_id: string;
  estimated_cook_time: number; // minutos
  quantity: number;
}

async function getKitchenLoad(restaurantId: string): Promise<number> {
  // Suma del tiempo de cocción de todos los pedidos en cola
  const activeOrders = await db.query(`
    SELECT items FROM restaurant_${restaurantId}.orders
    WHERE status IN ('confirmed', 'in_preparation')
  `);

  return activeOrders.reduce((total, order) => {
    return total + order.items.reduce((orderLoad, item) => {
      return orderLoad + (item.estimated_cook_time * item.quantity);
    }, 0);
  }, 0);
}
```

### Umbrales por defecto (configurables por restaurante)

| Carga (minutos) | Acción del LLM |
|-----------------|----------------|
| 0–30 min | Acepta normalmente, informa tiempo estándar |
| 31–60 min | Acepta, avisa: "Tu pedido estará listo en ~45 min" |
| 61–90 min | **Avisa antes**: "Hay algo de espera (60 min). ¿Continúas?" |
| >90 min | **Bloqueo suave**: "Cocina ocupada. ¿Prefieres que te avisemos cuando esté disponible?" |

### Configuración por restaurante
```sql
-- En restaurant_XXX.settings (JSONB)
{
  "kitchen_load": {
    "warn_threshold_min": 60,
    "block_threshold_min": 90,
    "enabled": true
  }
}
```

---

## 2. STOCK DINÁMICO

### Problema que resuelve
El bot puede ofrecer un producto que ya no hay. Esto rompe la confianza del cliente.

### Implementación

```typescript
// Al inicio de cada llamada/sesión
async function getAvailableMenu(restaurantId: string): Promise<Product[]> {
  return db.query(`
    SELECT id, name, price, category, description
    FROM restaurant_${restaurantId}.products
    WHERE is_available = true AND stock_qty > 0
    ORDER BY category, name
  `);
}
```

### System Prompt dinámico
El menú disponible se inyecta en el System Prompt al inicio de cada sesión:

```
MENÚ DISPONIBLE HOY (${new Date().toLocaleDateString()}):
${availableProducts.map(p => `- ${p.name}: €${p.price}`).join('\n')}

PRODUCTOS NO DISPONIBLES: No menciones ni ofrezcas productos fuera de esta lista.
```

### Actualización de stock
```sql
-- Trigger automático al confirmar pago
CREATE OR REPLACE FUNCTION decrease_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock_qty = stock_qty - item.quantity
  FROM jsonb_array_elements(NEW.items) AS item
  WHERE products.id = (item->>'product_id')::uuid;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_paid
AFTER UPDATE ON orders
FOR EACH ROW
WHEN (OLD.status != 'paid' AND NEW.status = 'paid')
EXECUTE FUNCTION decrease_stock();
```

---

## 3. SNAPSHOTS DE AUDITORÍA

### Propósito
Trazabilidad completa: qué estado tenía cada pedido en cada momento.

### Schema

```sql
CREATE TABLE restaurant_XXX.order_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  snapshot JSONB NOT NULL,  -- Estado completo del Order en ese momento
  event_type TEXT NOT NULL, -- 'created', 'paid', 'sent_to_tpv', 'ready', etc.
  triggered_by TEXT,        -- 'system', 'staff_id', 'customer'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_snapshots_order ON order_snapshots(order_id);
CREATE INDEX idx_snapshots_time ON order_snapshots(created_at DESC);
```

### Cuándo se crea un snapshot
1. Al crear el borrador de la orden (`event_type: 'draft_created'`)
2. Al confirmar el cliente (`event_type: 'customer_confirmed'`)
3. Al recibir pago (`event_type: 'payment_received'`)
4. Al enviar a TPV/KDS (`event_type: 'dispatched_to_kitchen'`)
5. Cuando cocina marca listo (`event_type: 'ready'`)
6. Al completar/cancelar (`event_type: 'completed'` | `'cancelled'`)

### GDPR / Eliminación
```sql
-- Eliminar TODOS los datos de un restaurante (GDPR)
DROP SCHEMA restaurant_XXX CASCADE;
-- Esto borra orders, snapshots, customers, products, sessions — todo.
```

---

## 4. ANALYTICS DIARIO

### Propósito
Dashboard del dueño sin impactar queries operacionales (no JOIN en producción).

### Schema

```sql
CREATE TABLE restaurant_XXX.analytics_daily (
  date DATE NOT NULL,
  product_id UUID REFERENCES products(id),
  product_name TEXT,          -- Denormalizado para simplicidad
  units_sold INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  avg_order_value DECIMAL(10,2),
  top_modifications JSONB,    -- ["sin_cebolla": 23, "doble_queso": 18]
  peak_hour INTEGER,          -- Hora con más pedidos (0-23)
  PRIMARY KEY (date, product_id)
);
```

### Refresh
- **Frecuencia**: Cada hora (Supabase Cron / pg_cron)
- **Estrategia**: UPSERT basado en `orders` con `status = 'completed'` del día
- **No bloquea**: La tabla analytics_daily es completamente independiente

---

## 5. MODIFICADORES DINÁMICOS

Los modificadores (sin cebolla, extra queso, etc.) se manejan como strings descriptivos generados por el LLM, no IDs fijos.

### Ventaja
El LLM puede manejar variaciones del lenguaje natural ("sin la cebolla", "quita la cebolla", "sin cebolla por favor") y normalizarlas.

### System Prompt (fragmento)
```
MODIFICADORES PERMITIDOS para cada producto están en:
product.allowed_modifications: ["sin_cebolla", "doble_queso", "sin_sal", "punto_coccion_medio"]

Si el cliente pide algo fuera de esta lista, explica que no es posible
y ofrece las alternativas disponibles.
```
