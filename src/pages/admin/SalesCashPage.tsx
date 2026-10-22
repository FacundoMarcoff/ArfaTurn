import React, { useState } from 'react';
import {
  ReceiptText,
  Plus,
  CreditCard,
  CheckCircle,
  Search,
  Lock,
  Unlock,
  ShoppingBag,
  Trash2,
  Calendar,
  User,
  ArrowRight,
  Banknote,
  QrCode,
  Building,
  Clock,
  X,
  ArrowLeft,
  Check,
  ChevronRight,
  ChevronDown,
  Info,
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
  const [mobileStep, setMobileStep] = useState<'items' | 'review'>('items');
  const [mobileSubtab, setMobileSubtab] = useState<'services' | 'products'>('services');
  const [mobileSearch, setMobileSearch] = useState('');
  const [showAppointmentPickerModal, setShowAppointmentPickerModal] = useState(false);
  const [showCustomerPickerModal, setShowCustomerPickerModal] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return 'CO';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

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
      notes: `Cobro en mostrador - ${currentBranch.name}`,
    });

    if (res.success && res.sale) {
      setPosSuccessSale(res.sale);
      setCartItems([]);
      setSelectedCustomerId('');
      setSelectedAppointmentId('');
      setDepositCredit(0);
    }
  };

  const paymentOptions: Array<{ id: PaymentMethod; label: string; icon: React.ReactNode }> = [
    { id: 'cash', label: 'Efectivo', icon: <Banknote className="w-4 h-4" /> },
    { id: 'credit_card', label: 'Tarjeta (Débito/Crédito)', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'mercadopago', label: 'Mercado Pago QR', icon: <QrCode className="w-4 h-4" /> },
    { id: 'bank_transfer', label: 'Transferencia', icon: <Building className="w-4 h-4" /> },
  ];

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="space-y-6">
      {/* =========================================================================
          MOBILE VIEW: SCREEN 3 (Selección de ítems) & SCREEN 4 (Revisar cobro)
      ========================================================================= */}
      <div className="md:hidden space-y-4 pb-24">
        {activeTab === 'pos' && (
          <>
            {mobileStep === 'items' ? (
              /* SCREEN 3: CAJA — SELECCIÓN DE ÍTEMS */
              <div className="space-y-4">
                {/* Header 3-Tab Segment */}
                <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F2] rounded-2xl border border-[#E8E2D8]">
                  <button
                    onClick={() => {
                      setActiveTab('pos');
                      setMobileStep('items');
                    }}
                    className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#28634C] text-white shadow-xs transition cursor-pointer"
                  >
                    Cobrar
                  </button>
                  <button
                    onClick={() => setActiveTab('sales')}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl text-[#5E7166] hover:text-[#24352C] transition cursor-pointer"
                  >
                    Historial
                  </button>
                  <button
                    onClick={() => setActiveTab('cash')}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl text-[#5E7166] hover:text-[#24352C] transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Caja del día</span>
                    {activeSession ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                  </button>
                </div>

                {/* Vincular turno banner */}
                <div className="bg-white rounded-2xl border border-[#E8E2D8] p-3.5 shadow-xs">
                  {selectedAppointmentId ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#EAF2EC] flex items-center justify-center text-[#28634C]">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#24352C]">
                            Turno vinculado #{selectedAppointmentId.slice(-4)}
                          </p>
                          <p className="text-[11px] text-[#5E7166]">
                            {selectedCustomer?.full_name || 'Cliente'}
                            {depositCredit > 0 && ` · Seña: -$${depositCredit.toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedAppointmentId('');
                          setDepositCredit(0);
                        }}
                        className="p-1.5 rounded-lg text-[#5E7166] hover:text-red-600 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAppointmentPickerModal(true)}
                      className="w-full flex items-center justify-between text-xs font-semibold text-[#24352C] cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-[#28634C]" />
                        <span>Vincular turno (opcional)</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#5E7166]" />
                    </button>
                  )}
                </div>

                {/* Subtabs: Servicios | Productos */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setMobileSubtab('services')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      mobileSubtab === 'services'
                        ? 'bg-[#28634C] text-white shadow-xs'
                        : 'bg-white text-[#5E7166] border border-[#E8E2D8]'
                    }`}
                  >
                    Servicios
                  </button>
                  <button
                    onClick={() => setMobileSubtab('products')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      mobileSubtab === 'products'
                        ? 'bg-[#28634C] text-white shadow-xs'
                        : 'bg-white text-[#5E7166] border border-[#E8E2D8]'
                    }`}
                  >
                    Productos
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E7166]" />
                  <input
                    type="text"
                    placeholder={`Buscar un ${mobileSubtab === 'services' ? 'servicio' : 'producto'}...`}
                    value={mobileSearch}
                    onChange={(e) => setMobileSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E2D8] rounded-xl text-xs text-[#24352C] placeholder-[#5E7166]/60 focus:outline-[#28634C]"
                  />
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  {mobileSubtab === 'services' ? (
                    services
                      .filter(
                        (s) =>
                          s.is_active &&
                          s.name.toLowerCase().includes(mobileSearch.toLowerCase())
                      )
                      .map((service) => {
                        const isChecked = cartItems.some((i) => i.serviceId === service.id);
                        return (
                          <div
                            key={service.id}
                            onClick={() => {
                              if (isChecked) {
                                setCartItems((prev) =>
                                  prev.filter((i) => i.serviceId !== service.id)
                                );
                              } else {
                                handleAddService(service.id);
                              }
                            }}
                            className={`flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
                              isChecked
                                ? 'bg-[#FAFDFB] border-[#28634C] ring-1 ring-[#28634C]/20 shadow-xs'
                                : 'bg-white border-[#E8E2D8] hover:border-[#28634C]/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center transition ${
                                  isChecked
                                    ? 'bg-[#28634C] text-white'
                                    : 'border-2 border-[#CCD6D0]'
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-[#24352C]">
                                  {service.name}
                                </p>
                                <p className="text-[11px] text-[#5E7166]">
                                  {service.duration_minutes} min
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-[#24352C] tabular-nums">
                              ${service.price.toLocaleString()}
                            </span>
                          </div>
                        );
                      })
                  ) : (
                    products
                      .filter((p) =>
                        p.name.toLowerCase().includes(mobileSearch.toLowerCase())
                      )
                      .map((product) => {
                        const isChecked = cartItems.some((i) => i.productId === product.id);
                        return (
                          <div
                            key={product.id}
                            onClick={() => {
                              if (isChecked) {
                                setCartItems((prev) =>
                                  prev.filter((i) => i.productId !== product.id)
                                );
                              } else {
                                handleAddProduct(product.id);
                              }
                            }}
                            className={`flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
                              isChecked
                                ? 'bg-[#FAFDFB] border-[#28634C] ring-1 ring-[#28634C]/20 shadow-xs'
                                : 'bg-white border-[#E8E2D8] hover:border-[#28634C]/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center transition ${
                                  isChecked
                                    ? 'bg-[#28634C] text-white'
                                    : 'border-2 border-[#CCD6D0]'
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-[#24352C]">
                                  {product.name}
                                </p>
                                <p className="text-[11px] text-[#5E7166]">
                                  Stock: {product.current_stock} un.
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-[#24352C] tabular-nums">
                              ${product.sale_price.toLocaleString()}
                            </span>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Sticky Bottom Bar */}
                <div className="fixed bottom-14 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-[#E8E2D8] shadow-lg z-30">
                  <div className="max-w-md mx-auto flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-[#24352C]">
                        {cartItems.length} {cartItems.length === 1 ? 'ítem' : 'ítems'}
                      </span>
                      <span className="text-xs font-semibold text-[#5E7166] mx-1.5">·</span>
                      <span className="text-sm font-extrabold text-[#28634C] tabular-nums">
                        ${finalTotal.toLocaleString()}
                      </span>
                    </div>
                    <button
                      disabled={cartItems.length === 0}
                      onClick={() => setMobileStep('review')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#28634C] disabled:bg-[#CCD6D0] text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      <span>Revisar cobro</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* SCREEN 4: CAJA — REVISAR COBRO */
              <div className="space-y-4">
                {/* Header with back button */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setMobileStep('items')}
                    className="p-2 rounded-xl bg-white border border-[#E8E2D8] text-[#24352C] hover:bg-[#FAF8F2] transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-base font-bold text-[#24352C]">Revisar cobro</h2>
                    <p className="text-[11px] text-[#5E7166]">
                      Verificá los detalles antes de registrar la venta
                    </p>
                  </div>
                </div>

                {/* Client Selector Card */}
                <div className="bg-white rounded-2xl border border-[#E8E2D8] p-3.5 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EAF2EC] text-[#28634C] flex items-center justify-center font-bold text-xs border border-[#28634C]/20">
                      {selectedCustomer ? getInitials(selectedCustomer.full_name) : 'CO'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#24352C]">
                        {selectedCustomer ? selectedCustomer.full_name : 'Cliente Ocasional'}
                      </p>
                      <p className="text-[11px] text-[#5E7166]">
                        {selectedCustomer?.phone || 'Sin número registrado'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCustomerPickerModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FAF8F2] border border-[#E8E2D8] text-xs font-semibold text-[#28634C] cursor-pointer"
                  >
                    <span>Cambiar</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Selected Items Card */}
                <div className="bg-white rounded-2xl border border-[#E8E2D8] p-4 shadow-xs space-y-3">
                  <div className="divide-y divide-[#E8E2D8]/60">
                    {cartItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleRemoveCartItem(idx)}
                            className="p-1 text-[#5E7166] hover:text-red-600 transition cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div>
                            <p className="text-xs font-semibold text-[#24352C]">
                              {item.description}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-[10px] text-[#5E7166]">
                                {item.quantity} unidades
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#24352C] tabular-nums">
                          ${(item.quantity * item.unitPrice).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setMobileStep('items')}
                    className="w-full pt-2 flex items-center justify-center gap-1.5 text-xs font-bold text-[#28634C] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar otro ítem</span>
                  </button>
                </div>

                {/* Total Summary Card */}
                <div className="bg-white rounded-2xl border border-[#E8E2D8] p-4 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#5E7166]">
                    <span>Subtotal</span>
                    <span className="font-semibold tabular-nums">
                      ${subtotal.toLocaleString()}
                    </span>
                  </div>
                  {depositCredit > 0 && (
                    <div className="flex items-center justify-between text-xs font-semibold text-[#28634C] bg-[#EAF2EC] px-2.5 py-1.5 rounded-lg">
                      <span>Seña online abonada</span>
                      <span className="tabular-nums">-${depositCredit.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D8]">
                    <span className="text-sm font-bold text-[#24352C]">Total</span>
                    <span className="text-2xl font-black text-[#28634C] tabular-nums">
                      ${finalTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Payment Method Radio Selection */}
                <div className="bg-white rounded-2xl border border-[#E8E2D8] p-4 shadow-xs space-y-2.5">
                  <label className="block text-xs font-bold text-[#24352C]">
                    Método de pago
                  </label>
                  <div className="space-y-2">
                    {paymentOptions.map((opt) => {
                      const isSelected = paymentMethod === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setPaymentMethod(opt.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#FAFDFB] border-[#28634C] ring-1 ring-[#28634C]/20'
                              : 'bg-[#FAF8F2]/50 border-[#E8E2D8]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'border-[#28634C]' : 'border-[#CCD6D0]'
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-[#28634C]" />
                              )}
                            </div>
                            <div className="text-xs font-semibold text-[#24352C] flex items-center gap-2">
                              {opt.icon}
                              <span>{opt.label}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Info Notice */}
                <div className="flex items-start gap-2 p-3 bg-[#FAF8F2] rounded-xl border border-[#E8E2D8] text-[11px] text-[#5E7166]">
                  <Info className="w-4 h-4 text-[#28634C] shrink-0 mt-0.5" />
                  <p>Revisá que el monto recibido coincida antes de confirmar la venta.</p>
                </div>

                {/* Confirm Sale Button */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                  className="w-full py-4 rounded-2xl bg-[#28634C] hover:bg-[#1E4E3B] disabled:bg-[#CCD6D0] text-white font-extrabold text-sm shadow-md active:scale-[0.99] transition cursor-pointer"
                >
                  Confirmar cobro · ${finalTotal.toLocaleString()}
                </button>
              </div>
            )}
          </>
        )}

        {/* Sales History Tab in Mobile */}
        {activeTab === 'sales' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab('pos');
                  setMobileStep('items');
                }}
                className="p-2 rounded-xl bg-white border border-[#E8E2D8] text-[#24352C] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-bold text-[#24352C]">Historial de Cobros</h2>
            </div>

            <div className="space-y-2.5">
              {sales
                .filter((s) => s.branch_id === currentBranch.id)
                .slice(0, 25)
                .map((s) => (
                  <div
                    key={s.id}
                    className="bg-white p-3.5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#24352C]">
                        {s.receipt_number || `#${s.id.slice(-6)}`}
                      </span>
                      <span className="text-xs font-black text-[#28634C]">
                        ${s.final_total.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5E7166]">
                      {new Date(s.created_at).toLocaleString('es-AR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}{' '}
                      · {s.payment_method}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Daily Cash Tab in Mobile */}
        {activeTab === 'cash' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab('pos');
                  setMobileStep('items');
                }}
                className="p-2 rounded-xl bg-white border border-[#E8E2D8] text-[#24352C] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-bold text-[#24352C]">Caja del Día</h2>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5E7166]">Estado de la caja</span>
                {activeSession ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    Abierta
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                    Cerrada
                  </span>
                )}
              </div>
              {activeSession && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#5E7166]">Monto de apertura</span>
                    <span className="font-bold text-[#24352C]">
                      ${activeSession.opening_amount.toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowCloseModal(true)}
                    className="w-full py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Cerrar Caja
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          DESKTOP-ONLY VIEW: SCREEN 03 (Caja y cobros - Versión escritorio)
      ========================================================================= */}
      <div className="hidden md:block space-y-4">
        {/* Header Title */}
        <h1 className="text-2xl font-extrabold text-[#24352C] tracking-tight">
          Caja y cobros
        </h1>

        {/* Tab Buttons (Cobrar | Historial | Caja del día) */}
        <div className="flex items-center gap-6 border-b border-[#E8E2D8] pb-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`pb-2.5 font-bold transition cursor-pointer relative ${
              activeTab === 'pos'
                ? 'text-[#28634C] border-b-2 border-[#28634C]'
                : 'text-[#5E7166] hover:text-[#24352C]'
            }`}
          >
            Cobrar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`pb-2.5 font-bold transition cursor-pointer relative ${
              activeTab === 'sales'
                ? 'text-[#28634C] border-b-2 border-[#28634C]'
                : 'text-[#5E7166] hover:text-[#24352C]'
            }`}
          >
            Historial
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cash')}
            className={`pb-2.5 font-bold transition cursor-pointer flex items-center gap-1.5 relative ${
              activeTab === 'cash'
                ? 'text-[#28634C] border-b-2 border-[#28634C]'
                : 'text-[#5E7166] hover:text-[#24352C]'
            }`}
          >
            <span>Caja del día</span>
            {activeSession ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>
        </div>

        {/* TAB POS (SCREEN 03 MOCKUP) */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-12 gap-5 items-start pt-1">
            {/* Catalog & Item Selection (7 cols) */}
            <div className="col-span-12 lg:col-span-7 space-y-4">
              {/* Row 1: Vincular Turno & Buscar Ítem */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <select
                    value={selectedAppointmentId}
                    onChange={(e) => handleSelectAppointment(e.target.value)}
                    className="w-full bg-white border border-[#CCD6D0] rounded-xl px-3.5 py-2.5 text-xs text-[#24352C] font-semibold appearance-none focus:outline-[#28634C] shadow-2xs cursor-pointer truncate pr-8"
                  >
                    <option value="">Vincular turno (opcional)</option>
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
                            {new Date(a.starts_at).toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            hs - {cust?.full_name || 'Cliente'} (${a.total_amount.toLocaleString()})
                          </option>
                        );
                      })}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#5E7166] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-[#5E7166] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={mobileSearch}
                    onChange={(e) => setMobileSearch(e.target.value)}
                    placeholder="Buscar un ítem"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#CCD6D0] rounded-xl text-xs text-[#24352C] placeholder-[#5E7166]/70 focus:outline-[#28634C] shadow-2xs"
                  />
                </div>
              </div>

              {/* Row 2: Subtabs (Servicios | Productos) */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMobileSubtab('services')}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    mobileSubtab === 'services'
                      ? 'bg-[#28634C] text-white shadow-xs'
                      : 'bg-white text-[#5E7166] border border-[#CCD6D0] hover:bg-[#FAF8F2]'
                  }`}
                >
                  Servicios
                </button>
                <button
                  type="button"
                  onClick={() => setMobileSubtab('products')}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    mobileSubtab === 'products'
                      ? 'bg-[#28634C] text-white shadow-xs'
                      : 'bg-white text-[#5E7166] border border-[#CCD6D0] hover:bg-[#FAF8F2]'
                  }`}
                >
                  Productos
                </button>
              </div>

              {/* 2-Column Grid of Items (Screen 03 Cards) */}
              <div className="grid grid-cols-2 gap-3">
                {mobileSubtab === 'services' ? (
                  services
                    .filter(
                      (s) =>
                        s.is_active &&
                        s.name.toLowerCase().includes(mobileSearch.toLowerCase())
                    )
                    .map((service) => {
                      const isChecked = cartItems.some((i) => i.serviceId === service.id);

                      return (
                        <div
                          key={service.id}
                          onClick={() => {
                            if (isChecked) {
                              setCartItems((prev) =>
                                prev.filter((i) => i.serviceId !== service.id)
                              );
                            } else {
                              handleAddService(service.id);
                            }
                          }}
                          className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-2.5 shadow-2xs ${
                            isChecked
                              ? 'bg-[#FAFDFB] border-[#28634C] ring-1 ring-[#28634C]/20'
                              : 'bg-white border-[#E8E2D8] hover:border-[#28634C]/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition ${
                                isChecked
                                  ? 'bg-[#28634C] text-white'
                                  : 'border-2 border-[#CCD6D0]'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="font-bold text-xs text-[#24352C] truncate">
                              {service.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-xs text-[#24352C] tabular-nums">
                              ${service.price.toLocaleString()}
                            </span>
                            <div className="w-6 h-6 rounded-full border border-[#CCD6D0] flex items-center justify-center text-[#28634C] hover:bg-[#FAF8F2]">
                              <Plus className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  products
                    .filter((p) =>
                      p.name.toLowerCase().includes(mobileSearch.toLowerCase())
                    )
                    .map((product) => {
                      const isChecked = cartItems.some((i) => i.productId === product.id);

                      return (
                        <div
                          key={product.id}
                          onClick={() => {
                            if (isChecked) {
                              setCartItems((prev) =>
                                prev.filter((i) => i.productId !== product.id)
                              );
                            } else {
                              handleAddProduct(product.id);
                            }
                          }}
                          className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-2.5 shadow-2xs ${
                            isChecked
                              ? 'bg-[#FAFDFB] border-[#28634C] ring-1 ring-[#28634C]/20'
                              : 'bg-white border-[#E8E2D8] hover:border-[#28634C]/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition ${
                                isChecked
                                  ? 'bg-[#28634C] text-white'
                                  : 'border-2 border-[#CCD6D0]'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="font-bold text-xs text-[#24352C] truncate">
                              {product.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-xs text-[#24352C] tabular-nums">
                              ${product.sale_price.toLocaleString()}
                            </span>
                            <div className="w-6 h-6 rounded-full border border-[#CCD6D0] flex items-center justify-center text-[#28634C] hover:bg-[#FAF8F2]">
                              <Plus className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Ticket Panel (Right 5 cols) */}
            <div className="col-span-12 lg:col-span-5">
              <div className="bg-white rounded-2xl border border-[#E8E2D8] p-5 shadow-xs space-y-4 sticky top-20">
                <h3 className="font-bold text-base text-[#24352C]">Ticket</h3>

                {/* Cliente Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs text-[#5E7166] font-medium">Cliente</label>
                  <div className="relative">
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full bg-[#FAF8F2] border border-[#CCD6D0] rounded-xl px-3.5 py-2.5 text-xs text-[#24352C] font-semibold appearance-none focus:outline-[#28634C] cursor-pointer pr-8"
                    >
                      <option value="">Cliente Ocasional / Sin asignar</option>
                      {customers
                        .filter((c) => c.organization_id === currentOrg.id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.full_name} ({c.phone || 'Sin tel'})
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#5E7166] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Ítems del cobro */}
                <div className="space-y-2 pt-2 border-t border-[#E8E2D8]/60">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#5E7166]">
                    <span>Ítems del cobro</span>
                    <span className="text-[11px]">{cartItems.length} seleccionados</span>
                  </div>

                  <div className="divide-y divide-[#E8E2D8]/50 max-h-48 overflow-y-auto">
                    {cartItems.length === 0 ? (
                      <p className="py-4 text-center text-xs text-[#5E7166]">
                        No hay ítems en el ticket todavía.
                      </p>
                    ) : (
                      cartItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2 text-xs"
                        >
                          <span className="font-medium text-[#24352C] truncate pr-2">
                            {item.description}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-[#24352C] tabular-nums">
                              ${(item.quantity * item.unitPrice).toLocaleString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCartItem(idx)}
                              className="p-1 text-[#5E7166] hover:text-red-600 transition cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileSubtab('services')}
                    className="flex items-center gap-1 text-xs font-bold text-[#28634C] hover:underline pt-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar otro ítem</span>
                  </button>
                </div>

                {/* Total */}
                <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between">
                  <span className="text-sm font-bold text-[#24352C]">Total</span>
                  <span className="text-2xl font-black text-[#24352C] tabular-nums">
                    ${finalTotal.toLocaleString()}
                  </span>
                </div>

                {/* Medio de pago (2x2 Radio Grid) */}
                <div className="space-y-2 pt-1 border-t border-[#E8E2D8]/60">
                  <label className="block text-xs font-bold text-[#24352C]">
                    Medio de pago
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {paymentOptions.map((opt) => {
                      const isSelected = paymentMethod === opt.id;
                      return (
                        <label
                          key={opt.id}
                          onClick={() => setPaymentMethod(opt.id)}
                          className={`flex items-center gap-2 p-2 rounded-xl border transition cursor-pointer ${
                            isSelected
                              ? 'border-[#28634C] bg-[#FAFDFB]'
                              : 'border-[#E8E2D8] hover:border-[#CCD6D0]'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-[#28634C]' : 'border-[#CCD6D0]'
                            }`}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#28634C]" />
                            )}
                          </div>
                          <span className="font-semibold text-[#24352C] truncate">
                            {opt.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Confirmar Cobro Button */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                  className="w-full py-3.5 rounded-2xl bg-[#28634C] hover:bg-[#1E4E3B] disabled:bg-[#CCD6D0] text-white font-extrabold text-xs shadow-xs active:scale-[0.99] transition cursor-pointer"
                >
                  Confirmar cobro - ${finalTotal.toLocaleString()}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB HISTORIAL DE COBROS */}
        {activeTab === 'sales' && (
          <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E8E2D8] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#24352C]">Historial de Cobros Recientes</h3>
              <span className="text-xs text-[#5E7166]">
                {sales.filter((s) => s.branch_id === currentBranch.id).length} operaciones
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F2] text-[#5E7166] font-semibold border-b border-[#E8E2D8]">
                  <tr>
                    <th className="px-5 py-3">Comprobante</th>
                    <th className="px-4 py-3">Fecha y Hora</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Medio de Pago</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8]">
                  {sales
                    .filter((s) => s.branch_id === currentBranch.id)
                    .map((s) => {
                      const cust = customers.find((c) => c.id === s.customer_id);
                      return (
                        <tr key={s.id} className="hover:bg-[#FAF8F2]/60 transition">
                          <td className="px-5 py-3.5 font-bold font-mono text-[#24352C]">
                            {s.receipt_number || `#${s.id.slice(-6)}`}
                          </td>
                          <td className="px-4 py-3.5 text-[#5E7166]">
                            {new Date(s.created_at).toLocaleString('es-AR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-[#24352C]">
                            {cust?.full_name || 'Cliente Ocasional'}
                          </td>
                          <td className="px-4 py-3.5 capitalize font-medium text-[#5E7166]">
                            {s.payment_method}
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-[#28634C] tabular-nums text-sm">
                            ${s.final_total.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB CAJA DEL DÍA */}
        {activeTab === 'cash' && (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-[#24352C]">Estado de Caja</h3>
                  <p className="text-xs text-[#5E7166]">
                    Sesión activa para {currentBranch.name}
                  </p>
                </div>
                {activeSession ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                    Abierta
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                    Cerrada
                  </span>
                )}
              </div>

              {activeSession ? (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#FAF8F2] p-3 rounded-xl border border-[#E8E2D8]">
                      <span className="text-[#5E7166]">Apertura</span>
                      <p className="text-lg font-bold text-[#24352C] tabular-nums mt-0.5">
                        ${activeSession.opening_amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-[#FAF8F2] p-3 rounded-xl border border-[#E8E2D8]">
                      <span className="text-[#5E7166]">Ingresos de Hoy</span>
                      <p className="text-lg font-bold text-[#28634C] tabular-nums mt-0.5">
                        ${sales
                          .filter((s) => s.branch_id === currentBranch.id)
                          .reduce((sum, s) => sum + s.final_total, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCloseModal(true)}
                    className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    Cerrar y Arqueo de Caja
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-[#5E7166]">
                    Abrí la caja con el monto inicial en efectivo para comenzar la jornada.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-[#24352C] mb-1">
                      Monto de apertura ($)
                    </label>
                    <input
                      type="number"
                      value={openAmount}
                      onChange={(e) => setOpenAmount(Number(e.target.value))}
                      className="w-full bg-[#FAF8F2] border border-[#CCD6D0] rounded-xl px-3.5 py-2 text-xs font-bold text-[#24352C] focus:outline-[#28634C]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => openCashSession(openAmount, openNotes)}
                    className="w-full py-3 rounded-xl bg-[#28634C] hover:bg-[#1E4E3B] text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    Abrir Caja
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* APPOINTMENT PICKER MODAL (MOBILE) */}
      {showAppointmentPickerModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8E2D8] p-5 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div>
                <h3 className="font-bold text-base text-[#24352C]">Vincular Turno</h3>
                <p className="text-xs text-[#5E7166]">Seleccioná un turno agendado para hoy</p>
              </div>
              <button
                onClick={() => setShowAppointmentPickerModal(false)}
                className="p-1.5 rounded-xl text-[#5E7166] hover:text-[#24352C] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {appointments
                .filter(
                  (a) =>
                    a.branch_id === currentBranch.id &&
                    ['confirmed', 'checked_in', 'in_progress'].includes(a.status)
                )
                .map((appt) => {
                  const cust = customers.find((c) => c.id === appt.customer_id);
                  return (
                    <div
                      key={appt.id}
                      onClick={() => {
                        handleSelectAppointment(appt.id);
                        setShowAppointmentPickerModal(false);
                      }}
                      className="p-3 rounded-2xl border border-[#E8E2D8] hover:border-[#28634C] hover:bg-[#FAFDFB] transition cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-[#24352C]">
                          {cust?.full_name || 'Cliente'}
                        </p>
                        <p className="text-[11px] text-[#5E7166]">
                          {new Date(appt.starts_at).toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          hs · #{appt.id.slice(-4)}
                        </p>
                      </div>
                      <span className="text-xs font-extrabold text-[#28634C]">
                        ${appt.total_amount.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              {appointments.filter(
                (a) =>
                  a.branch_id === currentBranch.id &&
                  ['confirmed', 'checked_in', 'in_progress'].includes(a.status)
              ).length === 0 && (
                <p className="text-xs text-center text-[#5E7166] py-6">
                  No hay turnos activos para cobrar hoy.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER PICKER MODAL (MOBILE) */}
      {showCustomerPickerModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8E2D8] p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div>
                <h3 className="font-bold text-base text-[#24352C]">Seleccionar Cliente</h3>
                <p className="text-xs text-[#5E7166]">Asociá la venta a un cliente</p>
              </div>
              <button
                onClick={() => setShowCustomerPickerModal(false)}
                className="p-1.5 rounded-xl text-[#5E7166] hover:text-[#24352C] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              <div
                onClick={() => {
                  setSelectedCustomerId('');
                  setShowCustomerPickerModal(false);
                }}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  !selectedCustomerId
                    ? 'border-[#28634C] bg-[#FAFDFB]'
                    : 'border-[#E8E2D8] hover:border-[#28634C]/50'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-[#24352C]">
                    Cliente Ocasional / Sin asignar
                  </p>
                  <p className="text-[11px] text-[#5E7166]">Venta rápida en mostrador</p>
                </div>
                {!selectedCustomerId && <Check className="w-4 h-4 text-[#28634C]" />}
              </div>

              {customers
                .filter((c) => c.organization_id === currentOrg.id)
                .map((c) => {
                  const isSelected = selectedCustomerId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setShowCustomerPickerModal(false);
                      }}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-[#28634C] bg-[#FAFDFB]'
                          : 'border-[#E8E2D8] hover:border-[#28634C]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#EAF2EC] text-[#28634C] flex items-center justify-center font-bold text-xs">
                          {getInitials(c.full_name)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#24352C]">{c.full_name}</p>
                          <p className="text-[11px] text-[#5E7166]">
                            {c.phone || 'Sin teléfono'}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#28634C]" />}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* POS SUCCESS SALE MODAL */}
      {posSuccessSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E8E2D8] p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#24352C]">¡Cobro Exitoso!</h3>
              <p className="text-xs text-[#5E7166] mt-1">
                Comprobante {posSuccessSale.receipt_number || `#${posSuccessSale.id.slice(-6)}`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-[#E8E2D8] space-y-2 text-xs text-left">
              <div className="flex justify-between text-[#5E7166]">
                <span>Monto total</span>
                <span className="font-extrabold text-[#28634C] text-sm tabular-nums">
                  ${posSuccessSale.final_total.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[#5E7166]">
                <span>Método</span>
                <span className="font-semibold capitalize">{posSuccessSale.payment_method}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setPosSuccessSale(null);
                  setMobileStep('items');
                }}
                className="w-full py-3.5 rounded-xl bg-[#28634C] text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                Hacer otro cobro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLOSE CASH MODAL */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8E2D8] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div>
                <h3 className="font-bold text-base text-[#24352C]">Cierre y Arqueo de Caja</h3>
                <p className="text-xs text-[#5E7166]">Contá el dinero del cajón para cerrar el turno.</p>
              </div>
              <button
                onClick={() => setShowCloseModal(false)}
                className="p-1 rounded-xl text-[#5E7166] hover:text-[#24352C] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#24352C] mb-1">
                Efectivo Contado en Caja ($) *
              </label>
              <input
                type="number"
                min={0}
                value={closeActualAmount}
                onChange={(e) => setCloseActualAmount(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#24352C] focus:outline-[#28634C]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E2D8]">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#E8E2D8] text-xs font-bold text-[#5E7166] hover:bg-[#FAF8F2] transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  closeCashSession(closeActualAmount);
                  setShowCloseModal(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                Confirmar Cierre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
