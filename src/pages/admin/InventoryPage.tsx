import React, { useState } from 'react';
import {
  Package,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  History,
  Barcode,
  Search,
  CheckCircle,
  X,
} from 'lucide-react';
import { useTenant } from '../../lib/store/tenant-context';
import { StockMovementType, Product } from '../../types/database.types';

export const InventoryPage: React.FC = () => {
  const {
    currentOrg,
    currentBranch,
    products,
    stockMovements,
    recordStockMovement,
  } = useTenant();

  const [activeTab, setActiveTab] = useState<'products' | 'movements'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Movement form state
  const [movementType, setMovementType] = useState<StockMovementType>('purchase_in');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const orgProducts = products.filter((p) => {
    if (p.organization_id !== currentOrg.id) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.includes(q))
    );
  });

  const orgMovements = stockMovements.filter((m) => m.organization_id === currentOrg.id);

  const handleRecordMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    // Negate quantity if it's an outgoing movement
    const finalQty =
      ['sale_out', 'service_consumption', 'adjustment_out', 'transfer_out'].includes(movementType)
        ? -Math.abs(quantity)
        : Math.abs(quantity);

    const res = recordStockMovement({
      productId: selectedProduct.id,
      branchId: currentBranch.id,
      movementType,
      quantity: finalQty,
      reason: reason.trim(),
    });

    if (res.success) {
      setAlertMsg({ type: 'success', text: 'Movimiento de stock registrado y auditado correctamente.' });
      setShowMovementModal(false);
      setSelectedProduct(null);
      setQuantity(1);
      setReason('');
    } else {
      setAlertMsg({ type: 'error', text: res.message || 'Error al actualizar stock.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#201D1B] p-5 rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight">
            Inventario & Control de Stock
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Gestión auditada de existencias por sucursal, alertas de stock mínimo y trazabilidad de movimientos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-[#FAF7F2] dark:bg-[#282421] p-1 rounded-xl text-xs font-semibold border border-[#E8E2D8] dark:border-[#352F2B]">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'products'
                  ? 'bg-white dark:bg-[#201D1B] text-[#335946] dark:text-[#A1CEB5] shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Productos ({orgProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'movements'
                  ? 'bg-white dark:bg-[#201D1B] text-[#335946] dark:text-[#A1CEB5] shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Movimientos Auditados ({orgMovements.length})
            </button>
          </div>
        </div>
      </div>

      {alertMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between ${
            alertMsg.type === 'success'
              ? 'bg-[#EBF2EE] dark:bg-[#203026] text-[#2F4F3E] dark:text-[#A1CEB5] border border-[#D5E3DB] dark:border-[#2E4738]'
              : 'bg-[#FDF2F0] dark:bg-[#341F1A] text-[#9E4B3E] dark:text-[#EAA399] border border-[#ECD3CC] dark:border-[#4E2B25]'
          }`}
        >
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="font-bold underline">
            Cerrar
          </button>
        </div>
      )}

      {activeTab === 'products' ? (
        <div className="bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E8E2D8] dark:border-[#2D2825]">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, SKU o código de barra..."
                className="w-full pl-9 pr-4 py-2 bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] dark:bg-[#282421] text-stone-500 uppercase tracking-wider font-bold border-b border-[#E8E2D8] dark:border-[#2D2825]">
                <tr>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">SKU / Código</th>
                  <th className="px-4 py-3">Precio Costo</th>
                  <th className="px-4 py-3">Precio Venta</th>
                  <th className="px-4 py-3">Stock Actual</th>
                  <th className="px-4 py-3 text-right">Movimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4] dark:divide-[#2D2825]">
                {orgProducts.map((p) => {
                  const isLowStock = p.current_stock <= p.min_stock_alert;

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF7F2]/80 dark:hover:bg-[#282421]/60 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-stone-900 dark:text-white">{p.name}</div>
                        <div className="text-[10px] text-stone-400">{p.category}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-stone-600 dark:text-stone-300">
                        {p.sku || p.barcode || '—'}
                      </td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-400 tabular-nums">
                        ${p.cost_price.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-stone-900 dark:text-white tabular-nums">
                        ${p.sale_price.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-sm tabular-nums ${
                              isLowStock ? 'text-[#B4654A]' : 'text-stone-900 dark:text-white'
                            }`}
                          >
                            {p.current_stock} un.
                          </span>
                          {isLowStock && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#8C6B32] dark:text-[#E8C78A] bg-[#FEF8ED] dark:bg-[#332A1C] px-2 py-0.5 rounded-lg border border-[#F3E5CB] dark:border-[#4D3F28]">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Mínimo ({p.min_stock_alert})</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedProduct(p);
                            setShowMovementModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#EBF2EE] dark:bg-[#203026] text-[#335946] dark:text-[#A1CEB5] font-semibold hover:bg-[#DFECE3] dark:hover:bg-[#273B2F] transition border border-[#D5E3DB] dark:border-[#2E4738]"
                        >
                          Ajustar / Mover
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Movements Audit Table */
        <div className="bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] dark:bg-[#282421] text-stone-500 uppercase tracking-wider font-bold border-b border-[#E8E2D8] dark:border-[#2D2825]">
                <tr>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Tipo Movimiento</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Stock Final</th>
                  <th className="px-4 py-3">Motivo / Auditoría</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4] dark:divide-[#2D2825]">
                {orgMovements.map((mov) => {
                  const isPositive = mov.quantity > 0;

                  return (
                    <tr key={mov.id} className="hover:bg-[#FAF7F2]/80 dark:hover:bg-[#282421]/60">
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-400 tabular-nums">
                        {new Date(mov.created_at).toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3 font-semibold text-stone-800 dark:text-stone-200">
                        {mov.product_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] capitalize">{mov.movement_type.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3 font-bold tabular-nums">
                        <span className={isPositive ? 'text-[#3B6652]' : 'text-[#9E4B3E]'}>
                          {isPositive ? `+${mov.quantity}` : mov.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-stone-900 dark:text-white tabular-nums">
                        {mov.new_stock} un.
                      </td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                        <div>{mov.reason}</div>
                        <div className="text-[10px] text-stone-400">Por {mov.performed_by_name}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD MOVEMENT MODAL */}
      {showMovementModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#201D1B] rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#2D2825]">
              <div>
                <h3 className="font-bold text-base text-stone-900 dark:text-white">Registrar Movimiento de Stock</h3>
                <p className="text-xs text-stone-400">{selectedProduct.name}</p>
              </div>
              <button onClick={() => setShowMovementModal(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordMovement} className="space-y-3">
              <div className="p-3 bg-[#FAF7F2] dark:bg-[#1A1817] rounded-xl text-xs flex justify-between border border-[#E8E2D8] dark:border-[#2D2825]">
                <span className="text-stone-500">Stock Actual en {currentBranch.name}:</span>
                <span className="font-bold text-stone-900 dark:text-white tabular-nums">{selectedProduct.current_stock} unidades</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Tipo de Operación *
                </label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as StockMovementType)}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                >
                  <option value="purchase_in">Entrada por Compra a Proveedor</option>
                  <option value="adjustment_in">Ajuste Positivo (Sobrante verificado)</option>
                  <option value="adjustment_out">Ajuste Negativo (Pérdida / Rotura / Merma)</option>
                  <option value="service_consumption">Consumo interno en Servicio</option>
                  <option value="sale_out">Salida manual por Venta</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Cantidad *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Motivo obligatorio de auditoría *
                </label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej. Factura proveedor #9923, reposición semanal, merma..."
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E2D8] dark:border-[#2D2825]">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E4DDD2] dark:border-[#352F2B] text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-[#F7F3EC] dark:hover:bg-[#282421] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white font-semibold text-xs shadow-xs transition"
                >
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
