# 📋 PLAN SEMANA 4 — Frontend React \+ Dashboard

**Objetivo**: Un panel web donde el dueño del restaurante ve los pedidos en tiempo real, gestiona el menú, y ve estadísticas.

**Nota**: Semanas 1-3 deben estar completas. Este es el primer contacto con React.

---

## ESTADO ACTUAL

- [ ] Proyecto React creado  
- [ ] Tailwind CSS configurado  
- [ ] Página de dashboard de pedidos  
- [ ] Página de gestión de menú  
- [ ] Página de historial de pedidos  
- [ ] Actualización en tiempo real (polling)  
- [ ] Rutas API del backend creadas

---

## TAREAS

### Tarea 4.1 — Crear proyecto React

**En terminal**:

npm create vite@latest src/frontend \-- \--template react-ts

cd src/frontend

npm install

npm install \-D tailwindcss @tailwindcss/vite

### Tarea 4.2 — Configurar Tailwind

**En src/frontend**:

- Crear `tailwind.config.js`  
- Crear `src/globals.css` con Tailwind directives  
- Importar en `src/main.tsx`

### Tarea 4.3 — Estructura de carpetas

src/frontend/

├── src/

│   ├── components/

│   │   ├── DashboardCard.tsx

│   │   ├── MenuTable.tsx

│   │   ├── OrderList.tsx

│   │   └── Sidebar.tsx

│   ├── pages/

│   │   ├── Dashboard.tsx (/)

│   │   ├── Menu.tsx (/menu)

│   │   └── Orders.tsx (/orders)

│   ├── services/

│   │   └── api.ts (fetch calls to backend)

│   ├── App.tsx (router setup)

│   ├── main.tsx

│   └── globals.css

└── package.json

### Tarea 4.4 — Crear rutas del backend

**Archivo**: `src/routes/orders.ts` (actualizar si existe)

**Endpoints**:

- `GET /api/orders?page=1&limit=20` — Lista de pedidos con paginación  
- `GET /api/orders/:id` — Detalle de un pedido  
- `PATCH /api/orders/:id` — Actualizar status del pedido  
  - Body: `{ status: "preparing" | "ready" | "completed" }`

**Archivo**: `src/routes/menu.ts`

**Endpoints**:

- `GET /api/menu` — Lista todos los items  
- `POST /api/menu` — Crear nuevo item  
  - Body: `{ name, description, price, category, available }`  
- `PATCH /api/menu/:id` — Actualizar item  
  - Body: `{ name?, price?, available?, ... }`  
- `DELETE /api/menu/:id` — Eliminar item

### Tarea 4.5 — Dashboard principal

**Archivo**: `src/frontend/src/pages/Dashboard.tsx`

Mostrar:

- Pedidos activos (status: pending, confirmed, preparing, ready)  
- Cards con: ID, items, total, status, canal (WhatsApp/voz)  
- Botones para cambiar status a "preparing" → "ready" → "completed"  
- Actualizar cada 10 segundos (polling)

**Estilo**: Dark mode, moderno, responsive.

### Tarea 4.6 — Página de menú

**Archivo**: `src/frontend/src/pages/Menu.tsx`

- Tabla de items del menú  
- Botón para marcar como disponible/no disponible  
- Formulario para crear nuevo item  
- Campos: nombre, descripción, precio, categoría

### Tarea 4.7 — Página de historial

**Archivo**: `src/frontend/src/pages/Orders.tsx`

- Lista de todos los pedidos (histórico)  
- Filtros: status, canal, fecha  
- Paginación  
- Detalles al clic

### Tarea 4.8 — Servicio de API

**Archivo**: `src/frontend/src/services/api.ts`

Funciones fetch para:

const API\_URL \= 'http://localhost:3001';

export async function getOrders(page: number \= 1\) { ... }

export async function getOrder(id: string) { ... }

export async function updateOrderStatus(id: string, status: string) { ... }

export async function getMenuItems() { ... }

export async function createMenuItem(item: MenuItem) { ... }

export async function updateMenuItem(id: string, item: Partial\<MenuItem\>) { ... }

### Tarea 4.9 — Router

**Archivo**: `src/frontend/src/App.tsx`

Usar `react-router-dom`:

npm install react-router-dom

Rutas:

- `/` → Dashboard  
- `/menu` → Gestión de menú  
- `/orders` → Historial de pedidos

---

## TEST DE ÉXITO (Semana 4\)

- [ ] Frontend arranca sin errores ✅  
- [ ] Dashboard muestra pedidos en tiempo real ✅  
- [ ] Puedo cambiar status de un pedido ✅  
- [ ] Menú se carga y se puede editar ✅  
- [ ] Nuevos items se crean correctamente ✅  
- [ ] Filtros funcionan en historial ✅  
- [ ] UI es responsive en móvil ✅

---

## CÓMO EJECUTAR

**Terminal 1** — Backend:

npm run dev

**Terminal 2** — Frontend:

cd src/frontend

npm run dev

Abre [http://localhost:5173](http://localhost:5173) (Vite abre un puerto diferente)

---

## COMMIT

git add .

git commit \-m "feat: dashboard React \+ rutas API para gestión"

git push origin main

---

## ERRORES COMUNES

**CORS error** — Backend rechaza peticiones del frontend

- Añade CORS a Express:

import cors from 'cors';

app.use(cors());

**Fetches retornan 404**

- Verifica que el backend tiene las rutas (GET /api/orders, etc.)  
- Verifica que el endpoint existe

**UI rota o estilos no se aplican**

- Verifica que Tailwind está configurado correctamente  
- Limpia cache: `npm run build && npm run dev`

---

FIN PLAN SEMANA 4  
