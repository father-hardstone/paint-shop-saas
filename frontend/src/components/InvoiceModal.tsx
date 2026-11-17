import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, Trash2, Printer, X, UserRound, Loader2, Search, ChevronDown } from 'lucide-react';
import { getApiUrl } from '../config/api';

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  hex?: string;
}

export interface CreatedInvoice {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone?: string;
  items: { inventoryId?: string; name: string; unit?: string; quantity: number; unitPrice: number; subtotal: number }[];
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'online' | 'credit';
}

interface Line {
  key: number;
  itemId: string; // '' until chosen
  qty: number;
}

interface Props {
  token: string | null;
  inventory: StockItem[];
  onClose: () => void;
  onCreated: (invoice: CreatedInvoice) => void | Promise<void>;
}

const PAYMENTS: { value: CreatedInvoice['paymentMethod']; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'online', label: 'Online' },
  { value: 'credit', label: 'Udhaar' },
];

const pkr = (n: number) => `Rs. ${Math.round(n).toLocaleString('en-PK')}`;

const field =
  'w-full bg-slate-950 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-100 light:text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500';

/** Type-to-search product picker. Type any part of the name, then click / press Enter to select. */
const ItemCombobox: React.FC<{
  inventory: StockItem[];
  value: string;
  disabledIds: Set<string>;
  onChange: (id: string) => void;
}> = ({ inventory, value, disabledIds, onChange }) => {
  const selected = inventory.find((i) => i.id === value);
  const [query, setQuery] = useState(selected?.name ?? '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Keep the text in sync when the selection changes from outside
  useEffect(() => { setQuery(selected?.name ?? ''); }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q || (selected && q === selected.name.toLowerCase())
      ? inventory
      : inventory.filter((i) => i.name.toLowerCase().includes(q));
    return list;
  }, [inventory, query, selected]);

  const place = () => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom;
    setPos(below < 280 && r.top > below
      ? { bottom: window.innerHeight - r.top + 4, left: r.left, width: r.width }
      : { top: r.bottom + 4, left: r.left, width: r.width });
  };

  useEffect(() => {
    if (!open) return;
    place();
    const close = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node) && !(e.target as HTMLElement).closest('[data-combo-list]')) {
        setOpen(false);
        setQuery(selected?.name ?? '');
      }
    };
    const reposition = () => place();
    document.addEventListener('mousedown', close);
    window.addEventListener('resize', reposition);
    document.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('resize', reposition);
      document.removeEventListener('scroll', reposition, true);
    };
  }, [open, selected?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (item: StockItem) => {
    if (item.quantity < 1 || disabledIds.has(item.id)) return;
    onChange(item.id);
    setQuery(item.name);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, matches.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && open) {
      e.preventDefault();
      // Exact typed name wins, otherwise the highlighted match
      const exact = matches.find((m) => m.name.toLowerCase() === query.trim().toLowerCase());
      const pick = exact ?? matches[active];
      if (pick) choose(pick);
    } else if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); setQuery(selected?.name ?? ''); }
  };

  return (
    <div ref={wrapRef} className="relative flex-1 min-w-0">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); if (value) onChange(''); }}
        onFocus={(e) => { setOpen(true); e.currentTarget.select(); }}
        onKeyDown={onKeyDown}
        placeholder="Search or type product name…"
        aria-label="Product"
        autoComplete="off"
        className={`${field} pl-9 pr-9`}
      />
      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      {open && pos && (
        <ul
          data-combo-list
          style={{ position: 'fixed', top: pos.top, bottom: pos.bottom, left: pos.left, width: pos.width }}
          className="z-[70] max-h-64 overflow-y-auto rounded-xl border border-slate-700 light:border-slate-300 bg-slate-900 light:bg-white shadow-2xl py-1"
        >
          {matches.length === 0 && <li className="px-3 py-3 text-sm text-slate-400 light:text-slate-600">No matching product in inventory.</li>}
          {matches.map((i, idx) => {
            const out = i.quantity < 1;
            const taken = disabledIds.has(i.id);
            return (
              <li
                key={i.id}
                onMouseDown={(e) => { e.preventDefault(); choose(i); }}
                onMouseEnter={() => setActive(idx)}
                className={`px-3 py-2 flex items-center gap-2 text-sm ${
                  out || taken ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                } ${idx === active ? 'bg-slate-800 light:bg-slate-100' : ''}`}
              >
                <span className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" style={{ background: i.hex || undefined }} />
                <span className="flex-1 truncate text-slate-100 light:text-slate-900">{i.name}</span>
                <span className="text-xs text-slate-400 light:text-slate-600 font-mono shrink-0">
                  {out ? 'out of stock' : taken ? 'already added' : `${i.quantity} ${i.unit} · ${pkr(i.unitPrice)}`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export const InvoiceModal: React.FC<Props> = ({ token, inventory, onClose, onCreated }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [lines, setLines] = useState<Line[]>([{ key: 1, itemId: '', qty: 1 }]);
  const [discount, setDiscount] = useState('');
  const [payment, setPayment] = useState<CreatedInvoice['paymentMethod']>('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const byId = useMemo(() => new Map(inventory.map((i) => [i.id, i])), [inventory]);

  const updateLine = (key: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const chooseItem = (key: number, itemId: string) => {
    const stock = byId.get(itemId);
    updateLine(key, { itemId, qty: stock ? Math.min(1, stock.quantity) || 1 : 1 });
  };

  const setQty = (line: Line, next: number) => {
    const stock = byId.get(line.itemId);
    const max = stock ? stock.quantity : 1;
    updateLine(line.key, { qty: Math.max(1, Math.min(max, Math.floor(next) || 1)) });
  };

  const addLine = () => setLines((ls) => [...ls, { key: Date.now(), itemId: '', qty: 1 }]);
  const removeLine = (key: number) =>
    setLines((ls) => (ls.length === 1 ? [{ key: Date.now(), itemId: '', qty: 1 }] : ls.filter((l) => l.key !== key)));

  const chosen = lines.filter((l) => l.itemId && byId.has(l.itemId));
  const subtotal = chosen.reduce((s, l) => s + byId.get(l.itemId)!.unitPrice * l.qty, 0);
  const discountNum = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const total = subtotal - discountNum;
  const itemCount = chosen.reduce((s, l) => s + l.qty, 0);

  const canSubmit = customerName.trim().length > 0 && chosen.length > 0 && !submitting;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${getApiUrl()}/billing/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          paymentMethod: payment,
          discountAmount: discountNum,
          items: chosen.map((l) => {
            const s = byId.get(l.itemId)!;
            return { inventoryId: s.id, name: s.name, unit: s.unit, quantity: l.qty, unitPrice: s.unitPrice };
          }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not create the invoice.');
        return;
      }
      await onCreated(data as CreatedInvoice);
    } catch {
      setError('Network error. The invoice was not created.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <form
        onSubmit={submit}
        className="bg-slate-900 light:bg-white border border-slate-800 light:border-slate-300 rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-800 light:border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-white light:text-slate-900">
              New invoice <span className="text-slate-400 light:text-slate-600 font-medium">· {itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
            </h3>
            <p className="text-xs text-slate-400 light:text-slate-600">Invoice number and date are generated automatically.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-slate-800 light:hover:bg-slate-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Customer */}
          <div className="px-6 py-4 border-b border-slate-800 light:border-slate-200">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 light:text-slate-600 mb-2 flex items-center gap-1.5">
              <UserRound className="w-3.5 h-3.5" /> Customer
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className={field} placeholder="Customer name *" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
              <input className={field} placeholder="Phone number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} inputMode="tel" />
            </div>
          </div>

          {/* Line items */}
          <div className="px-6 py-5 space-y-3">
            {lines.map((line) => {
              const stock = byId.get(line.itemId);
              const usedElsewhere = new Set(lines.filter((l) => l.key !== line.key).map((l) => l.itemId));
              return (
                <div key={line.key} className="rounded-2xl border border-slate-800 light:border-slate-200 bg-slate-950/50 light:bg-slate-50 p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span
                        className="w-9 h-9 rounded-lg border border-slate-700 light:border-slate-300 shrink-0"
                        style={{ background: stock?.hex || undefined }}
                      />
                      <ItemCombobox
                        inventory={inventory}
                        value={line.itemId}
                        disabledIds={usedElsewhere}
                        onChange={(id) => chooseItem(line.key, id)}
                      />
                    </div>

                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center rounded-xl border border-slate-700 light:border-slate-300 overflow-hidden">
                          <button type="button" disabled={!stock || line.qty <= 1} onClick={() => setQty(line, line.qty - 1)} className="px-2.5 py-2 text-slate-300 light:text-slate-700 hover:bg-slate-800 light:hover:bg-slate-200 disabled:opacity-30 cursor-pointer" aria-label="Decrease quantity">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            value={line.qty}
                            onChange={(e) => setQty(line, Number(e.target.value))}
                            disabled={!stock}
                            inputMode="numeric"
                            className="w-12 text-center bg-transparent text-sm font-mono font-bold text-white light:text-slate-900 focus:outline-none"
                            aria-label="Quantity"
                          />
                          <button type="button" disabled={!stock || line.qty >= stock.quantity} onClick={() => setQty(line, line.qty + 1)} className="px-2.5 py-2 text-slate-300 light:text-slate-700 hover:bg-slate-800 light:hover:bg-slate-200 disabled:opacity-30 cursor-pointer" aria-label="Increase quantity">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-400 light:text-slate-600 mt-1">
                          {stock ? `${stock.quantity} ${stock.unit} available` : '—'}
                        </span>
                      </div>
                      <div className="w-24 text-right font-mono font-bold text-white light:text-slate-900 text-sm">
                        {stock ? pkr(stock.unitPrice * line.qty) : '—'}
                      </div>
                      <button type="button" onClick={() => removeLine(line.key)} aria-label="Remove line" className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={addLine}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 light:border-slate-300 text-sm font-semibold text-slate-300 light:text-slate-700 hover:border-indigo-500 hover:text-indigo-400 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add another item
            </button>
          </div>
        </div>

        {/* Totals + actions */}
        <div className="px-6 py-4 border-t border-slate-800 light:border-slate-200 bg-slate-950/40 light:bg-slate-50 space-y-3">
          <div className="flex items-center justify-between text-sm text-slate-400 light:text-slate-600">
            <span>Subtotal</span>
            <span className="font-mono font-semibold text-slate-100 light:text-slate-900">{pkr(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-400 light:text-slate-600">
            <span>Discount (Rs.)</span>
            <input
              value={discount}
              onChange={(e) => setDiscount(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="0"
              inputMode="numeric"
              className="w-28 text-right bg-slate-950 light:bg-white border border-slate-800 light:border-slate-300 rounded-lg px-3 py-1.5 font-mono text-sm text-slate-100 light:text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-end justify-between pt-1">
            <span className="font-bold text-white light:text-slate-900">Total</span>
            <span className="font-mono font-bold text-2xl text-white light:text-slate-900">{pkr(total)}</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {PAYMENTS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPayment(p.value)}
                className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                  payment === p.value
                    ? 'border-indigo-500 text-white light:text-slate-900 bg-indigo-600/20'
                    : 'border-slate-800 light:border-slate-300 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-5 py-3 rounded-xl border border-slate-800 light:border-slate-300 text-slate-300 light:text-slate-700 text-sm font-semibold hover:bg-slate-800 light:hover:bg-slate-200 cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              Confirm &amp; Print Invoice · {pkr(total)}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
