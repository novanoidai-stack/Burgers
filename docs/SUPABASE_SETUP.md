# ⚙️ Configuración Supabase — Novo Burger

**Tiempo estimado**: 10 minutos

## Paso 1: Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta gratis
2. Haz clic en **"New Project"**
3. Nombre: `novo-burger`
4. Región: Elige la más cercana a ti (ej: Europa → **Germany**)
5. Database Password: Pon algo seguro (lo usarás en DB connection strings)
6. Haz clic en **"Create new project"** y espera (~2 min)

## Paso 2: Crear Tablas

Una vez que el proyecto esté listo:

1. En el dashboard, ve a **"SQL Editor"** (lado izquierdo)
2. Haz clic en **"New Query"**
3. Copia TODO el contenido de `docs/supabase-init.sql`
4. Pégalo en el editor
5. Haz clic en **"Run"** (esquina arriba-derecha)
6. Espera a que se ejecute (deberías ver ✅ sin errores)

**Verificación**:
- Ve a **"Table Editor"** y verifica que existen las tablas:
  - `users`
  - `menu_items` (con 11 items de ejemplo)
  - `orders`
  - `payments`
  - `conversations`

## Paso 3: Obtener Credenciales

1. En el dashboard, ve a **"Project Settings"** (abajo-izquierda)
2. Ve a pestaña **"API"**
3. Copia estos valores:

   ```
   SUPABASE_URL = Project URL
   SUPABASE_ANON_KEY = anon public key
   SUPABASE_SERVICE_KEY = service_role secret key
   ```

4. Abre `.env.local` en tu editor
5. Reemplaza:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   con tus valores reales.

## Paso 4: Test de Conexión

En terminal:

```bash
npm run dev
```

Deberías ver:

```
✅ Supabase connected (11 menu items)
🍔 Novo Burger server running on port 3001
```

## ✅ Listo

Ahora el servidor está conectado a Supabase. Próximo paso: **Webhook WhatsApp (Día 3)**

---

## 🐛 Troubleshooting

### "Missing required environment variable: SUPABASE_URL"

- Verificas que `.env.local` tiene SUPABASE_URL  
- Reinicia `npm run dev`

### "Supabase connection failed"

- ¿Los valores de SUPABASE_URL / ANON_KEY son correctos?
- ¿El proyecto está creado y activo?
- Abre la consola de Supabase y ve si hay errores en Logs

### "Table doesn't exist"

- Copia-pega el SQL completo de `docs/supabase-init.sql`
- Ejecuta en SQL Editor
- Verifica que no hay errores (rojo en consola)

---

## 📚 Documentación Oficial

- [Supabase Docs](https://supabase.com/docs)
- [Supabase SQL](https://supabase.com/docs/guides/database)
