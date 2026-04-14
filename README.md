# InventarioX - Sistema de Inventario

App Node.js/Express/Postgres para gestión de inventario, productos, ofertas, clientes.

## 🚀 Desarrollo Local

1. Instala dependencias:
   ```
   npm install
   ```

2. Configura DB (Postgres):
   - Copia `.env.example` → `.env`
   - Llena vars: PGHOST=localhost PGPORT=5432 PGDATABASE=inventariox PGUSER=postgres PGPASSWORD=tu_pass
   - O usa Docker: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=pass postgres`

3. Inicia:
   ```
   npm start
   ```
   Abre http://localhost:3000

**Logs mostrarán conexión DB paso a paso.**

## ☁️ Deploy Render.com

1. Push repo a GitHub (`.env` gitignore, OK).

2. Render.com > New > Web Service > Connect GitHub repo.

3. Config:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Environment Variables** (crítico para DB):
   - `DATABASE_URL` = `postgresql://user:pass@host:port/db?sslmode=require` (crea gratis Postgres en Render)
   - Otras: `NODE_ENV=production` (opcional)

5. Deploy! Auto en push.

**Logs en Render Dashboard mostrarán:**
- Config DB (DATABASE_URL detectada)
- Test conexión
- Tablas creadas/seeds
- O error específico (creds, SSL, host).

## Usuarios Default

- admin / admin123 (admin)
- seller / seller123 (seller)
- client / client123 (client)

## Estructura

- `src/db/index.js`: Postgres Pool, init tablas.
- `src/config/env.js`: Config DB con fallback.
- `src/app.js`: Express routes EJS views.

## Troubleshooting

- Local sin DB: Copia `.env`, instala Postgres.
- Render falla: Ver logs (ahora detallados), verifica DATABASE_URL en Env Vars.
- Puerto Render: Auto PORT env.

¡Listo para producción!

