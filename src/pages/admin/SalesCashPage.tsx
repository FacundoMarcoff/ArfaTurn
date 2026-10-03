import React, { useState } from 'react';
import {
  ReceiptText,
  DollarSign,
  Plus,
  CreditCard,
  CheckCircle,
  AlertCircle,
  FileText,
  Search,
  Lock,
  Unlock,
  Wallet,
  ShoppingBag,
  Trash2,
  Printer,
} from 'lucide-react';
import { useTenant } from '../../lib/store/tenant-context';
import { PaymentMethod, Sale } from '../../types/database.types';
import { CustomerSearchSelect } from '../../components/common/CustomerSearchSelect';

export const SalesCashPage: React.FC = () => {
  const {
    currentOrg,
    currentBranch,
    cashSessions,
    sales,
    services,
    products,
    customers,
    appointments,
    openCashSession,
    closeCashSession,
    createSale,
  } = useTenant();

  const [activeTab, setActiveTab] = useState<'pos' | 'sales' | 'cash'>('pos');

  // Active cash session for current branch
  const activeSession = cashSessions.find(
    (s) => s.status === 'open' && s.branch_id === currentBranch.id
  );

  // Cash session forms
  const [openAmount, setOpenAmount] = useState(20000);
  const [openNotes, setOpenNotes] = useState('');
  const [closeActualAmount, setCloseActualAmount] = useState(0);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // POS State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');
  const [cartItems, setCartItems] = useState<
    Array<{
      serviceId?: string;
      productId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
    }>
  >([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [depositCredit, setDepositCredit] = useState(0);
  const [posSuccessSale, setPosSuccessSale] = useState<Sale | null>(null);

  // Add service to cart
  const handleAddService = (serviceId: string) => {
    const s = services.find((srv) => srv.id === serviceId);
    if (!s) return;
    setCartItems((prev) => [
      ...prev,
      {
        serviceId: s.id,
        description: s.name,
        quantity: 1,
        unitPrice: s.price,
      },
    ]);
  };

  // Add product to cart
  const handleAddProduct = (productId: string) => {
    const p = products.find((prod) => prod.id === productId);
    if (!p) return;
    setCartItems((prev) => [
      ...prev,
      {
        productId: p.id,
        description: p.name,
        quantity: 1,
        unitPrice: p.sale_price,
      },
    ]);
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Cart totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const finalTotal = Math.max(0, subtotal - depositCredit);

  // Auto-fill from appointment if selected
  const handleSelectAppointment = (apptId: string) => {
    setSelectedAppointmentId(apptId);
    const appt = appointments.find((a) => a.id === apptId);
    if (appt) {
      setSelectedCustomerId(appt.customer_id);
      setDepositCredit(appt.deposit_amount || 0);

      // Add appointment service to cart if empty
      const srv = services.find((s) => s.duration_minutes === appt.service_duration_minutes);
      if (cartItems.length === 0) {
        setCartItems([
          {
            description: `Turno de Servicio (#${appt.id.slice(-4)})`,
            quantity: 1,
            unitPrice: appt.total_amount,
          },
        ]);
      }
    }
  };

  // Checkout submit
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    const res = createSale({
      branchId: currentBranch.id,
      customerId: selectedCustomerId || undefined,
      appointmentId: selectedAppointmentId || undefined,
      items: cartItems,
      paymentMethod,
      depositCreditApplied: depositCredit,
      notes: `Venta mostrador ${currentBranch.name}`,
    });

    if (res.success && res.sale) {
      setPosSuccessSale(res.sale);
      setCartItems([]);
      setSelectedCustomerId('');
      setSelectedAppointmentId('');
      setDepositCredit(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#201D1B] p-5 rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight">
            Ventas, Mostrador POS y Caja
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Cobro combinado de turnos y productos, aplicación de señas sin duplicados y arqueo de caja.
          </p>
        </div>

        <div className="flex bg-[#FAF7F2] dark:bg-[#282421] p-1 rounded-xl text-xs font-semibold border border-[#E8E2D8] dark:border-[#352F2B]">
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'pos'
                ? 'bg-white dark:bg-[#201D1B] text-[#335946] dark:text-[#A1CEB5] shadow-xs font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Terminal POS
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'sales'
                ? 'bg-white dark:bg-[#201D1B] text-[#335946] dark:text-[#A1CEB5] shadow-xs font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Historial de Ventas
          </button>
          <button
            onClick={() => setActiveTab('cash')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'cash'
                ? 'bg-white dark:bg-[#201D1B] text-[#335946] dark:text-[#A1CEB5] shadow-xs font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Arqueo de Caja
          </button>
        </div>
      </div>

      {/* POS TERMINAL TAB */}
      {activeTab === 'pos' && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Catalog Selector (Left 7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Link existing appointment */}
            <div className="bg-white dark:bg-[#201D1B] p-4 rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs space-y-2">
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Cobrar Turno del Día (Opcional):
              </span>
              <select
                value={selectedAppointmentId}
                onChange={(e) => handleSelectAppointment(e.target.value)}
                className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-800 dark:text-stone-200 focus:outline-[#5E836F]"
              >
                <option value="">Seleccionar turno para cobrar...</option>
                {appointments
                  .filter(
                    (a) =>
                      a.branch_id === currentBranch.id &&
                      ['confirmed', 'checked_in', 'in_progress'].includes(a.status)
                  )
                  .map((a) => {
                    const cust = customers.find((c) => c.id === a.customer_id);
                    return (
                      <option key={a.id} value={a.id}>
                        {new Date(a.starts_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs - {cust?.full_name} (${a.total_amount.toLocaleString()})
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Quick Add Services & Products */}
            <div className="bg-white dark:bg-[#201D1B] p-5 rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-stone-900 dark:text-white">Agregar al Ticket</h3>

              {/* Services List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Servicios</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {services
                    .filter((s) => s.organization_id === currentOrg.id && s.is_active)
                    .map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleAddService(s.id)}
                        className="p-3 rounded-xl border border-[#E8E2D8] dark:border-[#2D2825] hover:border-[#6B8F7D] bg-[#FAF7F2] dark:bg-[#1A1817] text-left transition flex flex-col justify-between"
                      >
                        <span className="font-semibold text-xs text-stone-800 dark:text-stone-100 line-clamp-1">
                          {s.name}
                        </span>
                        <span className="text-xs font-bold text-[#5E836F] dark:text-[#A1CEB5] mt-2 tabular-nums">
                          ${s.price.toLocaleString()}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* Products List */}
              <div className="space-y-2 pt-2 border-t border-[#E8E2D8] dark:border-[#2D2825]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Productos en Mostrador</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {products
                    .filter((p) => p.organization_id === currentOrg.id && p.is_active)
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleAddProduct(p.id)}
                        className="p-3 rounded-xl border border-[#E8E2D8] dark:border-[#2D2825] hover:border-[#9A5B3D] bg-[#FAF7F2] dark:bg-[#1A1817] text-left transition flex flex-col justify-between"
                      >
                        <div>
                          <span className="font-semibold text-xs text-stone-800 dark:text-stone-100 line-clamp-1">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-stone-400">Stock: {p.current_stock} un.</span>
                        </div>
                        <span className="text-xs font-bold text-[#9A5B3D] dark:text-[#E2A688] mt-2 tabular-nums">
                          ${p.sale_price.toLocaleString()}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Ticket / Checkout Panel (Right 5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-[#201D1B] p-5 rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#2D2825]">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#5E836F]" />
                  <h3 className="font-bold text-base text-stone-900 dark:text-white">Ticket de Venta</h3>
                </div>
                <span className="text-xs font-semibold text-stone-400">{cartItems.length} ítems</span>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {cartItems.length === 0 ? (
                  <p className="py-8 text-center text-xs text-stone-400">El ticket está vacío.</p>
                ) : (
                  cartItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1A1817] text-xs border border-[#E8E2D8] dark:border-[#2D2825]"
                    >
                      <div className="flex-1 mr-2">
                        <div className="font-semibold text-stone-800 dark:text-stone-100 truncate">{item.description}</div>
                        <div className="text-[10px] text-stone-400">
                          {item.quantity} x ${item.unitPrice.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 dark:text-white tabular-nums">
                          ${(item.quantity * item.unitPrice).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCartItem(idx)}
                          className="text-stone-400 hover:text-[#9E4B3E] p-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Customer Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Cliente Asociado
                </label>
                <CustomerSearchSelect
                  customers={customers.filter((c) => c.organization_id === currentOrg.id)}
                  selectedCustomerId={selectedCustomerId}
                  onSelectCustomerId={(id) => setSelectedCustomerId(id)}
                  placeholder="Buscar por nombre, teléfono o email..."
                />
              </div>

              {/* Summary Calculations */}
              <div className="pt-3 border-t border-[#E8E2D8] dark:border-[#2D2825] space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>Subtotal</span>
                  <span className="tabular-nums">${subtotal.toLocaleString()}</span>
                </div>
                {depositCredit > 0 && (
                  <div className="flex justify-between text-[#335946] dark:text-[#A1CEB5] font-semibold">
                    <span>Seña previa aplicada</span>
                    <span className="tabular-nums">-${depositCredit.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-stone-900 dark:text-white pt-1 border-t border-[#E8E2D8] dark:border-[#2D2825]">
                  <span>Total a Cobrar</span>
                  <span className="tabular-nums">${finalTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">Medio de Pago</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'credit_card', label: 'Tarjeta Crédito/Débito' },
                    { id: 'cash', label: 'Efectivo' },
                    { id: 'mercadopago', label: 'Mercado Pago QR' },
                    { id: 'bank_transfer', label: 'Transferencia' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={`p-2 rounded-xl border text-xs font-semibold transition ${
                        paymentMethod === m.id
                          ? 'border-[#5E836F] bg-[#EBF2EE] dark:bg-[#203026] text-[#2F4F3E] dark:text-[#A1CEB5]'
                          : 'border-[#E4DDD2] dark:border-[#352F2B] bg-[#FAF7F2] dark:bg-[#1A1817] text-stone-600 dark:text-stone-400 hover:bg-[#F2ECE4]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={cartItems.length === 0}
                onClick={handleCheckout}
                className="w-full py-3 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] disabled:opacity-50 text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-xs"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Cobrar ${finalTotal.toLocaleString()}</span>
              </button>
            </div>

            {/* Success Sale Modal / Receipt */}
            {posSuccessSale && (
              <div className="bg-[#EBF2EE] dark:bg-[#203026] p-4 rounded-2xl border border-[#D5E3DB] dark:border-[#2E4738] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#2F4F3E] dark:text-[#A1CEB5] font-bold">
                  <span>¡Venta registrada con éxito!</span>
                  <button onClick={() => setPosSuccessSale(null)} className="underline text-[11px]">
                    Listo
                  </button>
                </div>
                <div className="font-mono text-[11px] text-stone-600 dark:text-stone-300">
                  Comprobante: {posSuccessSale.receipt_number} • Total: ${posSuccessSale.total_amount.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SALES HISTORY TAB */}
      {activeTab === 'sales' && (
        <div className="bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] dark:bg-[#282421] text-stone-500 uppercase tracking-wider font-bold border-b border-[#E8E2D8] dark:border-[#2D2825]">
                <tr>
                  <th className="px-4 py-3">Comprobante</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Medio de Pago</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4] dark:divide-[#2D2825]">
                {sales
                  .filter((s) => s.organization_id === currentOrg.id)
                  .map((s) => (
                    <tr key={s.id} className="hover:bg-[#FAF7F2]/80 dark:hover:bg-[#282421]/60">
                      <td className="px-4 py-3 font-mono font-bold text-stone-900 dark:text-white">
                        {s.receipt_number}
                      </td>
                      <td className="px-4 py-3 text-stone-500 tabular-nums">
                        {new Date(s.created_at).toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3 font-semibold text-stone-800 dark:text-stone-200">
                        {s.customer_name || 'Cliente Ocasional'}
                      </td>
                      <td className="px-4 py-3 font-mono capitalize text-[11px]">
                        {s.payment_method.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 font-bold text-stone-900 dark:text-white tabular-nums">
                        ${s.total_amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-[#EBF2EE] text-[#2F4F3E] dark:bg-[#203026] dark:text-[#A1CEB5] border border-[#D5E3DB] dark:border-[#2E4738]">
                          Cobrado
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CASH SESSIONS (ARQUEO DE CAJA) TAB */}
      {activeTab === 'cash' && (
        <div className="space-y-6">
          {activeSession ? (
            <div className="bg-white dark:bg-[#201D1B] p-6 rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#EBF2EE] dark:bg-[#203026] text-[#335946] dark:text-[#A1CEB5] flex items-center justify-center font-bold">
                    <Unlock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-stone-900 dark:text-white">
                      Caja Abierta en {currentBranch.name}
                    </h3>
                    <p className="text-xs text-stone-400">
                      Iniciada el {new Date(activeSession.opened_at).toLocaleString('es-AR')} por {activeSession.opened_by_name}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowCloseModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#9A4B3D] hover:bg-[#853E32] text-white font-semibold text-xs shadow-xs transition"
                >
                  Cierre de Caja
                </button>
              </div>

              <div className="p-4 bg-[#FAF7F2] dark:bg-[#1A1817] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] flex justify-between text-xs">
                <span className="text-stone-500">Monto Inicial de Apertura:</span>
                <span className="font-bold text-stone-900 dark:text-white tabular-nums">
                  ${activeSession.initial_amount.toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#201D1B] p-6 rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs space-y-4 max-w-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] dark:bg-[#282421] text-stone-500 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900 dark:text-white">
                    Caja Cerrada en {currentBranch.name}
                  </h3>
                  <p className="text-xs text-stone-400">Abrí una nueva sesión de caja para registrar cobros.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Fondo inicial de cambio ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={openAmount}
                    onChange={(e) => setOpenAmount(Number(e.target.value))}
                    className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                  />
                </div>

                <button
                  onClick={() => openCashSession(openAmount, openNotes)}
                  className="w-full py-2.5 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white font-semibold text-xs shadow-xs transition"
                >
                  Abrir Caja Ahora
                </button>
              </div>
            </div>
          )}

          {/* Past Sessions */}
          <div className="bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E8E2D8] dark:border-[#2D2825] font-bold text-xs text-stone-500 uppercase tracking-wider">
              Sesiones de Caja Anteriores
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] dark:bg-[#282421] text-stone-500 font-bold border-b border-[#E8E2D8] dark:border-[#2D2825]">
                  <tr>
                    <th className="px-4 py-3">Apertura</th>
                    <th className="px-4 py-3">Cierre</th>
                    <th className="px-4 py-3">Monto Inicial</th>
                    <th className="px-4 py-3">Esperado</th>
                    <th className="px-4 py-3">Diferencia</th>
                    <th className="px-4 py-3 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2ECE4] dark:divide-[#2D2825]">
                  {cashSessions
                    .filter((s) => s.organization_id === currentOrg.id)
                    .map((s) => (
                      <tr key={s.id}>
                        <td className="px-4 py-3 text-stone-600 dark:text-stone-400 tabular-nums">
                          {new Date(s.opened_at).toLocaleString('es-AR')}
                        </td>
                        <td className="px-4 py-3 text-stone-600 dark:text-stone-400 tabular-nums">
                          {s.closed_at ? new Date(s.closed_at).toLocaleString('es-AR') : '—'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-stone-800 dark:text-stone-200 tabular-nums">
                          ${s.initial_amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-stone-800 dark:text-stone-200 tabular-nums">
                          {s.expected_closed_amount ? `$${s.expected_closed_amount.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-3 font-bold tabular-nums">
                          {s.difference_amount !== undefined ? (
                            <span className={s.difference_amount >= 0 ? 'text-[#3B6652]' : 'text-[#9E4B3E]'}>
                              ${s.difference_amount.toLocaleString()}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold capitalize bg-[#FAF7F2] dark:bg-[#282421] text-stone-600 dark:text-stone-300 border border-[#E8E2D8] dark:border-[#352F2B]">
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CLOSE CASH MODAL */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#201D1B] rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-stone-900 dark:text-white">Cierre y Arqueo de Caja</h3>
            <p className="text-xs text-stone-500">
              Contá el dinero físico presente en el cajón e ingresá el valor exacto para calcular la diferencia:
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Efectivo Contado en Caja ($) *
              </label>
              <input
                type="number"
                min={0}
                value={closeActualAmount}
                onChange={(e) => setCloseActualAmount(Number(e.target.value))}
                className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E2D8] dark:border-[#2D2825]">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E4DDD2] dark:border-[#352F2B] text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-[#F7F3EC] dark:hover:bg-[#282421] transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  closeCashSession(closeActualAmount);
                  setShowCloseModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-[#9A4B3D] hover:bg-[#853E32] text-white font-semibold text-xs shadow-xs transition"
              >
                Cerrar Caja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
