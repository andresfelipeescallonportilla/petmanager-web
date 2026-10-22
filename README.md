# Pet Manager

Aplicación de gestión de mascotas con frontend HTML/CSS/JavaScript, API Flask y PostgreSQL en Supabase. El cliente permanece en `public/` y la API accede a la base de datos desde el servidor; las credenciales no se exponen al navegador.

## Despliegue en Vercel

1. Conecta este repositorio a Vercel y selecciona la raíz del proyecto.
2. Comprueba que la integración de Supabase está vinculada al proyecto. La aplicación lee la primera variable disponible en este orden: `POSTGRES_URL`, `DATABASE_URL` y `SUPABASE_DB_URL`.
3. Para conexiones desde Vercel, usa la URL del **Transaction Pooler** de Supabase (puerto `6543`) con SSL requerido. El formato general es `postgresql://postgres.<PROJECT_REF>:<PASSWORD>@<POOLER_HOST>:6543/postgres?sslmode=require`. No guardes la contraseña en el código ni en este repositorio; configura la URL como variable de entorno protegida del proyecto.
4. El esquema PostgreSQL está en `schema.postgres.sql` y ya fue aplicado a la base conectada. `vercel.json`, `.python-version` y `requirements.txt` configuran la función Python.
5. Publica desde Vercel cuando quieras desplegar la aplicación.

La base de datos gratuita de Supabase puede pausarse tras 7 días sin actividad; reanúdala desde la integración antes de volver a usar la aplicación.

## Desarrollo local

Instala las dependencias de `requirements.txt`, configura `POSTGRES_URL` (o una de las variables alternativas) y arranca `python app.py`. Flask sirve `public/index.html` y los recursos de `/static/` además de la API.

## API

- `GET /api/health` — comprueba PostgreSQL y devuelve versión/base de datos.
- `GET /api/pets?type=Dog|Cat` — lista por tipo.
- `GET /api/pets/search?type=Dog|Cat&code=001` — busca por código.
- `POST /api/pets` — crea una mascota.
- `PUT /api/pets` — actualiza una mascota buscada.
- `DELETE /api/pets` — elimina una mascota.
- `GET /api/reports?kind=pets|dogs|cats` — reportes por estado de salud.
- `GET /api/export?kind=pets|dogs|cats` — descarga el reporte Excel.
- `GET /api` — información de la API y estado de conexión.
