# TurnoPro — Plataforma SaaS Multi-Tenant de Turnos, Clientes y Ventas

TurnoPro es una plataforma SaaS multi-tenant profesional desarrollada con **React, TypeScript estricto, Tailwind CSS, TanStack Query, Capacitor, Supabase PostgreSQL y Vercel**.

Permite a barberías, peluquerías, centros de estética, spas, consultorios médicos/odontológicos y comercios gestionar de forma centralizada sus reservas, agenda en tiempo real, fichas de clientes (CRM), catálogo de servicios, control estricto de inventario auditado y caja registradora / terminal POS.

---

## 🚀 Arquitectura y Dos Experiencias Conectadas

1. **Panel Privado del Comercio (`/admin`)**:
   - **Agenda Interactiva**: Vistas diaria y lista, columnas por profesional, check-in, estados de atención (Confirmado, Presente, En atención, Completado, Ausente, Cancelado), reprogramación atómica y bloqueo rápido.
   - **CRM de Clientes**: Fichas independientes por organización. Separación estricta entre notas operativas y notas médicas/confidenciales mediante permisos RBAC. Herramienta de fusión de registros duplicados con auditoría.
   - **Servicios y Recursos**: Tiempos de preparación y limpieza (buffers), seña online configurable, asignación de profesionales y recursos físicos (sillones, cabinas, salas).
   - **Inventario y Stock Auditado**: Trazabilidad completa con movimientos obligatorios (compras, ventas, consumo en servicios, mermas). Prohibición de edición manual directa de cantidades.
   - **Ventas y Caja POS**: Apertura y cierre de caja con arqueo ciego y cálculo de diferencias, cobro unificado de turnos y productos con aplicación automática de señas previas.
   - **Equipo y Roles**: Matriz RBAC (Owner, Admin, Encargado, Recepcionista, Profesional, Cajero) y generador de invitaciones seguras con expiración.
   - **Auditoría**: Registro inmutable de eventos críticos.

2. **Portal Público de Clientes (`/reservar/:slug`)**:
   - Selección guiada en 6 pasos rápidos: Sucursal ➔ Servicio ➔ Profesional ➔ Día y Horario ➔ Datos de Contacto ➔ Confirmación.
   - Cálculo dinámico de disponibilidad considerando horarios de apertura, descansos, buffers de limpieza y solapamientos.
   - Descarga automática de evento de calendario en formato estándar RFC 5545 (`.ics`).
   - Enlace privado de autogestión (`/mi-turno/:token`) con token criptográfico para consultar estado, cancelar o reprogramar dentro de la política de cancelación permitida.

---

## 🛠️ Tecnologías y Dependencias

- **Frontend Web**: React 19, TypeScript estricto, Vite, React Router 7, TanStack Query.
- **Formularios & Validación**: React Hook Form, Zod.
- **Estilos & UI**: Tailwind CSS v4, Lucide React Icons.
- **Móvil & PWA**: Capacitor 7 (`@capacitor/core`, `@capacitor/cli`), Service Worker y Web App Manifest con soporte offline e instalación guiada en iOS y Android.
- **Base de Datos & Auth**: Supabase PostgreSQL con extensiones `uuid-ossp` y `btree_gist` para restricciones de exclusión temporal.

---

## 📦 Puesta en Marcha Local

### 1. Clonar e instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Copiá el archivo `.env.example` a `.env.local`:
```bash
cp .env.example .env.local
```
Configurá tus credenciales de Supabase:
```env
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu-anon-key"
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"
```
*(Nota: Si no se configuran variables de Supabase, la aplicación inicia automáticamente en modo Sandbox reactivo en memoria con datos de prueba realistas para probar todas las funciones de inmediato).*

### 3. Iniciar el servidor de desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

---

## 🗄️ Migraciones de Base de Datos (Supabase)

Las migraciones SQL listas para producción se encuentran en `/supabase/migrations/`:
1. `20250101000000_init_schema.sql`: Creación de todas las tablas, relaciones, índices y la **restricción de exclusión de solapamiento**:
   ```sql
   ALTER TABLE appointments ADD CONSTRAINT no_professional_overlapping_appointments
   EXCLUDE USING gist (
     professional_id WITH =,
     tstzrange(starts_at, ends_at, '[)') WITH &&
   ) WHERE (status NOT IN ('cancelled', 'expired', 'no_show'));
   ```
2. `20250101000001_rls_and_functions.sql`: Políticas de Row Level Security (RLS) para aislamiento estricto por `organization_id`, y las funciones almacenadas `create_atomic_booking` y `record_stock_movement`.

Para ejecutarlas:
- Pegá y ejecutá el contenido de ambos archivos en el **SQL Editor** del dashboard de Supabase, o utilizá el Supabase CLI:
  ```bash
  supabase db push
  ```

---

## 📱 Compilación Android con Capacitor y Android Studio

TurnoPro utiliza Capacitor para transformar la aplicación web compilada en una app nativa de Android:

1. **Compilar la web para producción:**
   ```bash
   npm run build
   ```
2. **Sincronizar los archivos compilados con la plataforma Android:**
   ```bash
   npx cap sync android
   ```
3. **Abrir el proyecto en Android Studio:**
   ```bash
   npx cap open android
   ```
4. **Generar APK / AAB de Producción en Android Studio:**
   - En Android Studio: Menú `Build` > `Generate Signed Bundle / APK`.
   - Seleccioná `Android App Bundle` (para Google Play) o `APK`.
   - Elegí tu archivo Keystore (`release.keystore`).
   - **Regla de Seguridad**: Nunca incluyas el archivo `release.keystore` ni las contraseñas en Git. Configuralas como secretos de GitHub Actions o en tu archivo local `~/.gradle/gradle.properties`.

---

## 🔒 Modelo de Seguridad y Matriz de Permisos (RBAC)

| Permiso | Propietario | Administrador | Encargado | Recepcionista | Profesional | Cajero |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Ver Agenda | ✅ | ✅ | ✅ | ✅ | ✅ (propia) | ❌ |
| Crear / Editar Turnos | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Check-in de Turnos | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Fichas de Clientes | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Notas Confidenciales / Salud | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Fusión de Clientes | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Configurar Servicios | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ajustar Stock | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Realizar Cobros en POS | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Apertura y Cierre de Caja | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Registro de Auditoría | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 🌐 Despliegue en Vercel

1. Importá el repositorio en el panel de Vercel.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Configurá las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
