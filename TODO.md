# TODO: Fix Render DB Connection & Login Issue

✅ 1. Plan & gather info
✅ 2. Create TODO.md  
✅ 3. src/config/env.js - Detalle logs
✅ 4. src/db/index.js - Manejo errores Pool
✅ 5. index.js - Graceful fail & shutdown
✅ 6. src/app.js - Session segura + /health
✅ 7. render-env.example

⏳ 8. Test local: npm start (edita .env con tu PG local)
   → Debe mostrar '✅ Conexión DB OK'
   → http://localhost:3000/health → OK

🔄 9. Render:
   1. Copia DATABASE_URL interna de tu Postgres Render
   2. SESSION_SECRET fuerte
   3. Deploy → logs: 'DATABASE_URL detectada' + 'Conexión OK'
   4. /health OK → login admin/admin123

🏁 10. attempt_completion
