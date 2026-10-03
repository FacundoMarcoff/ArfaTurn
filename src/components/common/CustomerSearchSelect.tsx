import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, User, X, Check, ChevronDown, Phone, Mail } from 'lucide-react';
import { Customer } from '../../types/database.types';

interface CustomerSearchSelectProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomerId: (customerId: string) => void;
  allowOccasional?: boolean;
  occasionalLabel?: string;
  placeholder?: string;
  className?: string;
}

export const CustomerSearchSelect: React.FC<CustomerSearchSelectProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomerId,
  allowOccasional = true,
  occasionalLabel = 'Cliente Ocasional / Mostrador',
  placeholder = 'Buscar cliente por nombre o teléfono...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Filtered customer list based on query
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const matchName = c.full_name.toLowerCase().includes(q);
      const matchPhone = (c.phone || '').toLowerCase().includes(q);
      const matchEmail = (c.email || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchEmail;
    });
  }, [customers, searchQuery]);

  const handleSelectCustomer = (id: string) => {
    onSelectCustomerId(id);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectCustomerId('');
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger / Display Box */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-[#FAF7F2] dark:bg-[#1A1817] border rounded-xl cursor-pointer text-xs transition select-none ${
          isOpen
            ? 'border-[#335946] dark:border-[#5E836F] ring-2 ring-[#335946]/10'
            : 'border-[#E4DDD2] dark:border-[#352F2B] hover:border-[#C8BFB2] dark:hover:border-[#4A423D]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedCustomer ? (
            <>
              <div className="w-6 h-6 rounded-full bg-[#EBF2EE] dark:bg-[#25382D] text-[#335946] dark:text-[#A1CEB5] font-bold text-[10px] flex items-center justify-center shrink-0 border border-[#D5E3DB] dark:border-[#314A3B]">
                {selectedCustomer.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate">
                <span className="font-semibold text-stone-900 dark:text-white">
                  {selectedCustomer.full_name}
                </span>
                {selectedCustomer.phone && (
                  <span className="text-stone-500 dark:text-stone-400 ml-1.5 text-[11px]">
                    ({selectedCustomer.phone})
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-stone-700 dark:text-stone-300 truncate">
                {occasionalLabel}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-stone-400 dark:text-stone-500">
          {selectedCustomer ? (
            <button
              type="button"
              onClick={handleClearSelection}
              title="Quitar cliente y usar Cliente Ocasional"
              className="p-1 hover:text-stone-700 dark:hover:text-stone-200 rounded-md hover:bg-stone-200/50 dark:hover:bg-stone-700/50 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#335946]' : ''}`}
          />
        </div>
      </div>

      {/* Popover Dropdown with Search */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#1E1C1A] border border-[#E0D8CC] dark:border-[#352F2B] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Input Bar */}
          <div className="p-2 border-b border-[#E8E2D8] dark:border-[#2D2825] bg-[#FAF7F2] dark:bg-[#161413]">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-[#201D1B] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-[#335946] focus:border-[#335946]"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-[#F2ECE4] dark:divide-[#282421] p-1">
            {/* Quick Option: Cliente Ocasional / Mostrador */}
            {allowOccasional && (!searchQuery || occasionalLabel.toLowerCase().includes(searchQuery.toLowerCase())) && (
              <button
                type="button"
                onClick={() => handleSelectCustomer('')}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition ${
                  !selectedCustomerId
                    ? 'bg-[#EBF2EE] dark:bg-[#25382D] text-[#2F4F3E] dark:text-[#A1CEB5]'
                    : 'hover:bg-[#FAF7F2] dark:hover:bg-[#252220] text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">{occasionalLabel}</div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400">
                      Venta rápida sin asignar cliente específico
                    </div>
                  </div>
                </div>
                {!selectedCustomerId && <Check className="w-4 h-4 text-[#335946] dark:text-[#A1CEB5] shrink-0" />}
              </button>
            )}

            {/* Customers list header */}
            <div className="px-2 py-1 text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              Clientes Registrados ({filteredCustomers.length})
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  No se encontraron clientes para &quot;{searchQuery}&quot;
                </p>
                <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
                  Puedes cobrar como cliente ocasional o crear el cliente desde el módulo Clientes.
                </p>
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = selectedCustomerId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCustomer(c.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition ${
                      isSelected
                        ? 'bg-[#EBF2EE] dark:bg-[#25382D] text-[#2F4F3E] dark:text-[#A1CEB5]'
                        : 'hover:bg-[#FAF7F2] dark:hover:bg-[#252220] text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#E0ECE5] dark:bg-[#203026] text-[#335946] dark:text-[#A1CEB5] font-bold text-xs flex items-center justify-center shrink-0">
                        {c.full_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                          <span>{c.full_name}</span>
                          {c.is_blacklisted && (
                            <span className="px-1.5 py-0.2 text-[9px] rounded bg-red-100 text-red-700 font-bold">
                              Bloqueado
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                          {c.phone && (
                            <span className="flex items-center gap-0.5">
                              <Phone className="w-2.5 h-2.5" />
                              {c.phone}
                            </span>
                          )}
                          {c.email && (
                            <span className="flex items-center gap-0.5 truncate">
                              <Mail className="w-2.5 h-2.5" />
                              {c.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#335946] dark:text-[#A1CEB5] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
