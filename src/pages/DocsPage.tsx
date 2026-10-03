import React from 'react';
import {
  FileText,
  Shield,
  Smartphone,
  Server,
  Database,
  Lock,
  CheckCircle2,
  Terminal,
  Layers,
  Code2,
  ExternalLink,
} from 'lucide-react';

export const DocsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-2">
      {/* Top Banner */}
      <div className="bg-[#2D332D] text-[#F9F7F2] p-8 rounded-3xl border border-[#444D44] space-y-3 shadow-xl">
        <div className="flex items-center gap-2 text-[#A7C8B5] font-bold text-xs uppercase tracking-wider">
          <Code2 className="w-4 h-4" />
          <span>Arquitectura & Documentación de Producción</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-black">
          TurnoPro SaaS Multi-Tenant Platform
        </h1>
        <p className="text-sm text-[#DDD8CF] leading-relaxed">
          Diseño técnico de alta concurrencia con aislamiento de datos por organización, motor de disponibilidad atómico en PostgreSQL, integración con Capacitor para Android y despliegue en Vercel + Supabase.
        </p>
      </div>

      {/* 1. MODELO MULTI-TENANT Y SEGURIDAD RLS */}
      <section className="bg-white dark:bg-[#201D1B] rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-[#E8E2D8] dark:border-[#2D2825]">
          <Database className="w-6 h-6 text-[#5E836F] dark:text-[#A7C8B5]" />
          <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-[#F3EFEA]">
            1. Aislamiento Multi-Tenant y Seguridad en Base de Datos
          </h2>
        </div>

        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
          Cada comercio (organización) cuenta con una partición lógica aislada. Las tablas cuentan con clave foránea obligatoria <code className="bg-[#FAF7F2] dark:bg-[#2D2825] px-1.5 py-0.5 rounded text-[#5E836F] dark:text-[#A7C8B5] font-semibold border border-[#E8E2D8] dark:border-[#3D3734]">organization_id</code>. La seguridad no depende del frontend: todas las tablas tienen <strong>Row Level Security (RLS)</strong> activo con políticas basadas en roles de membresía.
        </p>

        <div className="p-4 bg-[#1E1B19] rounded-2xl font-mono text-[11px] text-[#E8E2D8] overflow-x-auto space-y-2 border border-[#332E2B]">
          <div className="text-[#A7C8B5]">-- Política de aislamiento de citas por membresía activa:</div>
          <div>CREATE POLICY "Staff can view appointments" ON appointments</div>
          <div>FOR SELECT USING (</div>
          <div className="pl-4">has_org_role(organization_id, ARRAY['owner','admin','branch_manager','receptionist','professional','cashier'])</div>
          <div>);</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 pt-2 text-xs">
          <div className="p-3 bg-[#FAF7F2] dark:bg-[#252220] rounded-xl border border-[#E8E2D8] dark:border-[#2D2825]">
            <span className="font-bold text-stone-900 dark:text-[#F3EFEA] block mb-1">Aislamiento de Clientes</span>
            <p className="text-stone-500 dark:text-stone-400">
              Las fichas de clientes no se comparten entre comercios. Aunque un cliente reserve en dos negocios distintos con el mismo teléfono, sus notas e historiales son independientes.
            </p>
          </div>
          <div className="p-3 bg-[#FAF7F2] dark:bg-[#252220] rounded-xl border border-[#E8E2D8] dark:border-[#2D2825]">
            <span className="font-bold text-stone-900 dark:text-[#F3EFEA] block mb-1">Privacidad de Salud</span>
            <p className="text-stone-500 dark:text-stone-400">
              Las notas confidenciales o clínicas están restringidas al profesional y propietarios; recepción y caja solo tienen acceso a datos operativos.
            </p>
          </div>
        </div>
      </section>

      {/* 2. MOTOR DE DISPONIBILIDAD Y EXCLUSIÓN ATÓMICA */}
      <section className="bg-white dark:bg-[#201D1B] rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-[#E8E2D8] dark:border-[#2D2825]">
          <Lock className="w-6 h-6 text-[#5E836F] dark:text-[#A7C8B5]" />
          <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-[#F3EFEA]">
            2. Motor de Disponibilidad y Restricción de Exclusión PostgreSQL
          </h2>
        </div>

        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
          Para garantizar matemáticamente que <strong>nunca ocurran dos reservas simultáneas para el mismo profesional o recurso</strong>, el esquema utiliza la extensión <code className="bg-[#FAF7F2] dark:bg-[#2D2825] px-1.5 py-0.5 rounded text-[#5E836F] dark:text-[#A7C8B5] font-semibold border border-[#E8E2D8] dark:border-[#3D3734]">btree_gist</code> con rangos temporales <code className="bg-[#FAF7F2] dark:bg-[#2D2825] px-1.5 py-0.5 rounded text-[#5E836F] dark:text-[#A7C8B5] font-semibold border border-[#E8E2D8] dark:border-[#3D3734]">tstzrange</code> con límite semiabierto <code className="bg-[#FAF7F2] dark:bg-[#2D2825] px-1.5 py-0.5 rounded text-[#5E836F] dark:text-[#A7C8B5] font-semibold border border-[#E8E2D8] dark:border-[#3D3734]">[)</code>:
        </p>

        <div className="p-4 bg-[#1E1B19] rounded-2xl font-mono text-[11px] text-[#E8E2D8] overflow-x-auto space-y-2 border border-[#332E2B]">
          <div className="text-[#A7C8B5]">-- Restricción de exclusión en appointments:</div>
          <div>ALTER TABLE appointments ADD CONSTRAINT no_professional_overlapping_appointments</div>
          <div>EXCLUDE USING gist (</div>
          <div className="pl-4">professional_id WITH =,</div>
          <div className="pl-4">tstzrange(starts_at, ends_at, '[)') WITH &&</div>
          <div>) WHERE (status NOT IN ('cancelled', 'expired', 'no_show'));</div>
        </div>

        <ul className="text-xs text-stone-600 dark:text-stone-300 space-y-1.5 list-disc pl-5">
          <li><strong>Idempotencia:</strong> Cada intento de reserva lleva una clave de idempotencia única para evitar cobros dobles por clics repetidos.</li>
          <li><strong>Buffers:</strong> Cada servicio suma su duración + tiempo de preparación + tiempo de limpieza antes de liberar el intervalo.</li>
          <li><strong>Zona Horaria:</strong> Todos los instantes se persisten en UTC con almacenamiento de la zona horaria IANA correspondiente.</li>
        </ul>
      </section>

      {/* 3. CAPACITOR ANDROID GUÍA */}
      <section className="bg-white dark:bg-[#201D1B] rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-[#E8E2D8] dark:border-[#2D2825]">
          <Smartphone className="w-6 h-6 text-[#8C76A6] dark:text-[#B6A6CB]" />
          <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-[#F3EFEA]">
            3. Aplicación Android con Capacitor y Android Studio
          </h2>
        </div>

        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
          El proyecto web se empaqueta en una aplicación nativa Android utilizando el archivo <code className="bg-[#FAF7F2] dark:bg-[#2D2825] px-1.5 py-0.5 rounded text-[#8C76A6] dark:text-[#B6A6CB] font-semibold border border-[#E8E2D8] dark:border-[#3D3734]">capacitor.config.ts</code>. El APK/AAB resultante incorpora el bundle compilado en <code className="bg-[#FAF7F2] dark:bg-[#2D2825] px-1.5 py-0.5 rounded border border-[#E8E2D8] dark:border-[#3D3734]">dist/</code> y consume los mismos servicios seguros.
        </p>

        <div className="p-4 bg-[#1E1B19] rounded-2xl font-mono text-[11px] text-[#E8E2D8] space-y-2 border border-[#332E2B]">
          <div className="text-stone-500"># 1. Compilar los assets web optimizados:</div>
          <div className="text-[#A7C8B5]">npm run build</div>
          <div className="text-stone-500 pt-2"># 2. Sincronizar los archivos compilados con la carpeta nativa Android:</div>
          <div className="text-[#A7C8B5]">npx cap sync android</div>
          <div className="text-stone-500 pt-2"># 3. Abrir en Android Studio para depurar o generar APK/AAB firmado:</div>
          <div className="text-[#A7C8B5]">npx cap open android</div>
        </div>

        <div className="text-xs text-stone-500 dark:text-stone-400 space-y-1">
          <p><strong>Firma de Producción:</strong> Nunca subas el archivo <code className="bg-[#FAF7F2] dark:bg-[#2D2825] px-1 border border-[#E8E2D8] dark:border-[#3D3734]">release.keystore</code> ni sus contraseñas al repositorio Git. Configuralo en tu variable de entorno en CI o en <code className="bg-[#FAF7F2] dark:bg-[#2D2825] px-1 border border-[#E8E2D8] dark:border-[#3D3734]">~/.gradle/gradle.properties</code> local.</p>
        </div>
      </section>

      {/* 4. FUNCIONES VERCEL / SUPABASE EDGE FUNCTIONS */}
      <section className="bg-white dark:bg-[#201D1B] rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-[#E8E2D8] dark:border-[#2D2825]">
          <Server className="w-6 h-6 text-[#C4894D] dark:text-[#D9A36E]" />
          <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-[#F3EFEA]">
            4. Distribución de Backend: Vercel Functions vs Supabase Edge Functions
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div className="p-4 rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] bg-[#FAF7F2] dark:bg-[#252220] space-y-2">
            <span className="font-bold text-stone-900 dark:text-[#F3EFEA] block">Vercel Serverless Functions</span>
            <ul className="space-y-1 text-stone-600 dark:text-stone-300 list-disc pl-4">
              <li>API Proxy para integraciones de pago (Mercado Pago, Stripe).</li>
              <li>Validación criptográfica de firmas HMAC de webhooks.</li>
              <li>Generación y firma de tokens JWT para enlaces de turnos.</li>
            </ul>
          </div>
          <div className="p-4 rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] bg-[#FAF7F2] dark:bg-[#252220] space-y-2">
            <span className="font-bold text-stone-900 dark:text-[#F3EFEA] block">Supabase Edge Functions / Stored Procedures</span>
            <ul className="space-y-1 text-stone-600 dark:text-stone-300 list-disc pl-4">
              <li>Procedimiento atómico <code className="text-[#5E836F] dark:text-[#A7C8B5] font-semibold">create_atomic_booking</code>.</li>
              <li>Expiración automática de holds de reserva pendientes de pago.</li>
              <li>Despacho de recordatorios automáticos por WhatsApp y correo.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. CHECKLIST DE PUESTA EN PRODUCCIÓN */}
      <section className="bg-white dark:bg-[#201D1B] rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-[#E8E2D8] dark:border-[#2D2825]">
          <CheckCircle2 className="w-6 h-6 text-[#5E836F] dark:text-[#A7C8B5]" />
          <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-[#F3EFEA]">
            5. Checklist de Puesta en Producción
          </h2>
        </div>

        <div className="space-y-2 text-xs text-stone-600 dark:text-stone-300">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#5E836F] shrink-0 mt-0.5" />
            <span><strong>Migraciones Aplicadas:</strong> Ejecutar los archivos <code className="font-mono text-[#5E836F] dark:text-[#A7C8B5]">20250101000000_init_schema.sql</code> y <code className="font-mono text-[#5E836F] dark:text-[#A7C8B5]">20250101000001_rls_and_functions.sql</code> en el editor SQL de Supabase.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#5E836F] shrink-0 mt-0.5" />
            <span><strong>Secretos en Servidor:</strong> La clave privilegiada <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> y los tokens de Mercado Pago se alojan exclusivamente en variables de entorno del backend en Vercel/Supabase.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#5E836F] shrink-0 mt-0.5" />
            <span><strong>PWA Instalable:</strong> El manifiesto Web App y el Service Worker cumplen con los criterios de Chromium e iOS Safari con botón in-app de instalación.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#5E836F] shrink-0 mt-0.5" />
            <span><strong>Auditoría & Trazabilidad:</strong> Movimientos de stock y cambios de roles quedan registrados con usuario, IP y motivo obligatorio.</span>
          </div>
        </div>
      </section>
    </div>
  );
};
