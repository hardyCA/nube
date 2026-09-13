# NUBE - Deployment Guide

## Variables de entorno (Vercel > Settings > Environment Variables)

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
NEXT_PUBLIC_URL=https://tu-dominio.vercel.app
```

## Supabase Setup

1. Crear proyecto en supabase.com
2. Ir a SQL Editor y ejecutar en orden:
   - `sql/schema.sql` (tablas, triggers, RLS)
   - `sql/clientes.sql` (tabla de clientes)
   - `sql/test-laptop.sql` (productos de prueba - opcional)
3. Crear usuario admin en Authentication > Users
4. Verificar que Storage bucket `productos` existe

## Deploy Vercel

1. Conectar repositorio GitHub a Vercel
2. Framework: Next.js (detecta automaticamente)
3. Agregar variables de entorno
4. Deploy

## Notes

- Logo en `public/logo.png` (se usa como favicon + OG image)
- Open Graph configurado para compartir en WhatsApp/redes sociales
- Headers de seguridad configurados en next.config.mjs
