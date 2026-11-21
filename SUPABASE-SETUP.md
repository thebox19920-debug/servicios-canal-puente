# Activar Supabase y preparar Vercel

## 1. Crear el proyecto de datos

1. Crea un proyecto en Supabase y espera a que la base PostgreSQL termine de iniciarse.
2. Abre **SQL Editor → New query**.
3. Copia el contenido completo de `supabase/schema.sql` y pulsa **Run**. Esto crea las tablas, reglas RLS, roles, funciones, auditoría y el bucket privado para acreditaciones.
4. En **Authentication → URL Configuration**, añade el dominio de Vercel a **Site URL** y **Redirect URLs**, por ejemplo `https://tu-proyecto.vercel.app/**`.

## 2. Pegar las dos claves en la configuración del sitio

Abre `web/assets/scp-supabase-config.js` y sustituye:

- `SUPABASE_URL`: **Project URL** del panel Supabase → **Project Settings → API**.
- `SUPABASE_ANON_KEY`: clave pública **anon** (o **publishable**) del mismo panel.

No pegues una `service_role` ni una `secret` key en este archivo. El navegador usa estas claves públicas y RLS limita qué filas puede leer o modificar cada cuenta.

## 3. Habilitar la cuenta de administración

1. Regístrate desde `/registro.html` con el correo que usarás como administradora y confirma el correo si Supabase lo solicita.
2. En SQL Editor ejecuta, sustituyendo el correo:

```sql
update public.profiles
set role = 'ADMIN', approval_status = 'APPROVED', is_subscribed = false, is_verified = false
where lower(email) = lower('tu-correo-admin@example.com');
```

Después entra por **Acceso reservado SCP**. Las demás cuentas no pueden asignarse el rol ADMIN desde el navegador.

## 4. Desplegar el directorio web en Vercel

Importa el repositorio del proyecto en Vercel. `vercel.json` configura el proyecto como sitio estático y publica `web/`, conservando las rutas `.html`. Tras desplegar, revisa el registro, el inicio de sesión y los paneles privados.

## Qué queda conectado

- Alta e inicio de sesión con Supabase Auth (correo y contraseña).
- Perfiles, demandas, ofertas, expedientes, cambios de estado, historial y valoraciones privadas en PostgreSQL.
- Archivos profesionales en Storage privado con enlaces firmados para revisión administrativa.
- Las reglas RLS y las funciones de Postgres autorizan cada lectura y operación sensible.

La clave de Supabase no activa cargos bancarios ni custodia real. Para `HELD_IN_ESCROW`, `RELEASED` y reembolsos falta integrar y configurar un proveedor de pagos en un backend seguro/webhook. La aplicación comienza los expedientes en `UNPAID` y no permite iniciar el servicio mientras no haya una confirmación real de fondos protegidos.
