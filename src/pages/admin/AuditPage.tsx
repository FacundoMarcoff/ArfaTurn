import React from 'react';
import { Shield, Clock, FileCode, CheckCircle2, UserCheck, Package, ShoppingCart } from 'lucide-react';
import { useTenant } from '../../lib/store/tenant-context';

export const AuditPage: React.FC = () => {
  const { currentOrg, auditEvents } = useTenant();

  const orgEvents = auditEvents.filter((e) => e.organization_id === currentOrg.id);

  const getActionIcon = (action: string) => {
    if (action.includes('appointment')) return <Clock className="w-4 h-4 text-[#5E836F]" />;
    if (action.includes('stock')) return <Package className="w-4 h-4 text-[#C4894D]" />;
    if (action.includes('sale') || action.includes('cash')) return <ShoppingCart className="w-4 h-4 text-[#4A7C59]" />;
    if (action.includes('role') || action.includes('customer')) return <UserCheck className="w-4 h-4 text-[#8C76A6]" />;
    return <Shield className="w-4 h-4 text-stone-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#201D1B] p-5 rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-black text-stone-900 dark:text-[#F3EFEA]">
            Registro de Auditoría & Trazabilidad
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Log inmutable de eventos críticos para cumplimiento, seguridad multi-tenant y prevención de fraude.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] dark:bg-[#252220] text-stone-500 uppercase tracking-wider font-bold border-b border-[#E8E2D8] dark:border-[#2D2825]">
              <tr>
                <th className="px-4 py-3">Timestamp (UTC)</th>
                <th className="px-4 py-3">Acción</th>
                <th className="px-4 py-3">Usuario / Rol</th>
                <th className="px-4 py-3">Recurso</th>
                <th className="px-4 py-3">Detalle / Metadatos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]/60 dark:divide-[#2D2825] font-mono text-[11px]">
              {orgEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-[#FAF7F2]/80 dark:hover:bg-[#252220]/40">
                  <td className="px-4 py-3 text-stone-500 font-sans">
                    {new Date(evt.created_at).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 font-semibold text-stone-800 dark:text-stone-200">
                    <div className="flex items-center gap-2 font-sans font-bold">
                      {getActionIcon(evt.action)}
                      <span>{evt.action}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#5E836F] dark:text-[#A7C8B5] font-bold font-sans">
                    {evt.user_name}
                  </td>
                  <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                    {evt.resource_type}:{evt.resource_id.slice(-6)}
                  </td>
                  <td className="px-4 py-3 text-stone-600 dark:text-stone-300 max-w-xs truncate">
                    {evt.metadata ? JSON.stringify(evt.metadata) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
