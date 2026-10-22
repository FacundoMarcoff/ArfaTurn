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
  MoreVertical,
  Sliders,
  ChevronDown,
  ShieldAlert,
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
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCost, setNewProdCost] = useState(5000);
  const [newProdPrice, setNewProdPrice] = useState(10000);
  const [newProdStock, setNewProdStock] = useState(10);
  const [newProdMinStock, setNewProdMinStock] = useState(3);
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
    return p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#24352C] tracking-tight">
          Productos y stock
        </h1>

        <button
          type="button"
          onClick={() => setShowNewProductModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#28634C] hover:bg-[#1E4E3B] text-white text-xs font-bold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#E8CDA8]" />
          <span>+ Nuevo producto</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#EAF2EC] text-[#28634C] shadow-2xs'
                : 'bg-white text-[#5E7166] border border-[#CCD6D0] hover:bg-[#FAF8F2]'
            }`}
          >
            Productos ({orgProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'movements'
                ? 'bg-[#EAF2EC] text-[#28634C] shadow-2xs'
                : 'bg-white text-[#5E7166] border border-[#CCD6D0] hover:bg-[#FAF8F2]'
            }`}
          >
            Movimientos
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#5E7166] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, SKU o código"
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#CCD6D0] rounded-xl text-xs text-[#24352C] placeholder-[#5E7166]/70 focus:outline-[#28634C] shadow-2xs"
            />
          </div>

          <div className="relative">
            <select
              className="bg-white border border-[#CCD6D0] text-xs font-semibold rounded-xl pl-3 pr-8 py-2 text-[#24352C] appearance-none focus:outline-[#28634C] shadow-2xs cursor-pointer"
            >
              <option value="all">Todos</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#5E7166] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer shadow-2xs ${
              filterLowStock
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                : 'bg-white border-[#CCD6D0] text-[#24352C] hover:bg-[#FAF8F2]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Stock bajo</span>
          </button>
        </div>
      </div>

      {alertMsg && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
            alertMsg.type === 'success'
              ? 'bg-[#EAF2EC] text-[#28634C] border-[#28634C]/25'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="font-bold underline cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      {/* Main Table */}
      {activeTab === 'products' ? (
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F2]/60 text-[#5E7166] font-semibold border-b border-[#E8E2D8]">
                <tr>
                  <th className="px-5 py-3">Producto</th>
                  <th className="px-4 py-3">SKU / Código</th>
                  <th className="px-4 py-3">Costo</th>
                  <th className="px-4 py-3">Venta</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3 text-center">Ajustar stock</th>
                  <th className="px-4 py-3 w-8 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8]/60">
                {orgProducts
                  .filter((p) => {
                    if (filterLowStock && p.current_stock > p.min_stock_alert) return false;
                    return true;
                  })
                  .map((p) => {
                    const isLowStock = p.current_stock <= p.min_stock_alert;

                    return (
                      <tr key={p.id} className="hover:bg-[#FAF8F2]/50 transition">
                        <td className="px-5 py-3.5 font-bold text-xs text-[#24352C]">
                          {p.name}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[#5E7166] text-xs">
                          {p.sku || p.barcode || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-[#5E7166] tabular-nums">
                          ${(p.cost_price || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#24352C] tabular-nums">
                          ${(p.sale_price || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`font-bold tabular-nums ${
                              isLowStock ? 'text-amber-700' : 'text-[#24352C]'
                            }`}
                          >
                            {p.current_stock} un.
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(p);
                              setShowMovementModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#CCD6D0] hover:bg-[#FAF8F2] text-xs font-semibold text-[#24352C] transition shadow-2xs cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5 text-[#28634C]" />
                            <span>Ajustar stock</span>
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-right text-[#5E7166]">
                          <button
                            type="button"
                            className="p-1 rounded-lg hover:bg-[#FAF8F2] text-[#5E7166] transition cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
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
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F2]/60 text-[#5E7166] font-semibold border-b border-[#E8E2D8]">
                <tr>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Stock Resultante</th>
                  <th className="px-4 py-3">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8]/60">
                {orgMovements.map((mov) => {
                  const prod = products.find((p) => p.id === mov.product_id);
                  const isPositive = mov.quantity > 0;

                  return (
                    <tr key={mov.id} className="hover:bg-[#FAF8F2]/50 transition">
                      <td className="px-4 py-3 font-mono text-[#5E7166]">
                        {new Date(mov.created_at).toLocaleString('es-AR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#24352C]">
                        {prod?.name || 'Producto'}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] capitalize text-[#5E7166]">
                        {mov.movement_type.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 font-bold tabular-nums">
                        <span className={isPositive ? 'text-[#28634C]' : 'text-red-600'}>
                          {isPositive ? `+${mov.quantity}` : mov.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-[#24352C] tabular-nums">
                        {mov.new_stock} un.
                      </td>
                      <td className="px-4 py-3 text-[#5E7166]">
                        <div>{mov.reason || 'Sin motivo'}</div>
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
