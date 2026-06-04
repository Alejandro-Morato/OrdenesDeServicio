# Backend - Sistema de Órdenes de Servicio

API REST para el sistema de gestión de órdenes de servicio de Inter Rural.

## Stack

- **Node.js** + **Express**
- **Supabase** (PostgreSQL + Auth)
- **Cloudinary** (Storage de imágenes)
- **Vercel** (Deploy)

## Estructura

```
backend/
├── api/
│   ├── index.js      # Servidor principal
│   ├── ordenes.js    # CRUD de órdenes
│   ├── piezas.js     # Gestión de piezas
│   ├── gastos.js     # Gastos diversos
│   └── reportes.js   # Reportes para gerencia
├── middleware/
│   └── auth.js       # Autenticación JWT
├── utils/
│   ├── supabase.js   # Cliente de Supabase
│   └── cloudinary.js # Cliente de Cloudinary
├── .env              # Variables de entorno (no subir a Git)
├── .env.example      # Template de variables
├── package.json
└── vercel.json       # Configuración de deploy
```

## Instalación

```bash
# Instalar dependencias
npm install

# Copiar .env.example a .env y completar credenciales
cp .env.example .env

# Ejecutar en desarrollo
npm run dev
```

## Variables de Entorno

Ver `.env.example` para la lista completa.

## Rutas de la API

### Autenticación
Todas las rutas requieren header:
```
Authorization: Bearer {token-de-supabase}
```

### Órdenes
- `GET /api/ordenes` - Listar órdenes
- `GET /api/ordenes/:id` - Obtener orden específica
- `POST /api/ordenes` - Crear orden (taller)
- `PATCH /api/ordenes/:id` - Actualizar orden
- `DELETE /api/ordenes/:id` - Eliminar orden (gerencia)

### Piezas
- `GET /api/piezas/:ordenId` - Piezas de una orden
- `POST /api/piezas` - Agregar pieza (refacciones)
- `PATCH /api/piezas/:id` - Actualizar pieza
- `DELETE /api/piezas/:id` - Eliminar pieza

### Gastos
- `GET /api/gastos/:ordenId` - Gastos de una orden
- `POST /api/gastos` - Agregar gasto (refacciones)
- `DELETE /api/gastos/:id` - Eliminar gasto

### Reportes
- `GET /api/reportes/mano-obra?mes=5&anio=2026` - Reporte de mano de obra
- `GET /api/reportes/general` - Estadísticas generales

## Deploy en Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Configurar las variables de entorno en el dashboard de Vercel.

## Seguridad

- Todas las rutas requieren autenticación via JWT
- Los roles se verifican en middleware
- Las credenciales sensibles van en variables de entorno (nunca en código)
