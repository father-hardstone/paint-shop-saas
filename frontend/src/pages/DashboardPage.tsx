import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Receipt, 
  Plus, 
  Search, 
  Filter,
  Printer,
  LayoutGrid,
  List,
  ImagePlus,
  X
} from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import { getApiUrl, getBackendOrigin } from '../config/api';
import { InvoiceModal } from '../components/InvoiceModal';
import type { CreatedInvoice } from '../components/InvoiceModal';
import { generateInvoicePdf } from '../utils/invoicePdf';
import { ProductCard } from '../components/ProductCard';
import { fileToResizedDataUrl } from '../utils/productImage';

interface InventoryItem {
  id: string;
  name: string;
  category: 'paint' | 'utility' | 'accessory';
  sku?: string;
  hex?: string;
  imageUrl?: string;
  imageUrls?: string[];
  description?: string;
  unit: 'litres' | 'pieces' | 'cans' | 'rolls' | 'kg';
  quantity: number;
  unitPrice: number;
  updatedAt: string;
}

interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  items: {
    inventoryId?: string;
    unit?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: 'paid' | 'pending' | 'draft';
  paymentMethod: 'cash' | 'card' | 'online' | 'credit';
  createdAt: string;
}

interface DashboardPageProps {
  onSignOut: () => void;
  onNavigateSettings: () => void;
  onOpenProduct: (id: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  onSignOut,
  onNavigateSettings,
  onOpenProduct
}) => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'inventory' | 'billing'>('inventory');

  // Inventory state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState<'all' | 'paint' | 'utility' | 'accessory'>('all');
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [newInvName, setNewInvName] = useState('');
  const [newInvCategory, setNewInvCategory] = useState<'paint' | 'utility' | 'accessory'>('paint');
  const [newInvUnit, setNewInvUnit] = useState<'litres' | 'pieces' | 'cans' | 'rolls' | 'kg'>('litres');
  const [newInvQty, setNewInvQty] = useState('');
  const [newInvPrice, setNewInvPrice] = useState('');
  const [newInvImages, setNewInvImages] = useState<string[]>([]);
  const [newInvDescription, setNewInvDescription] = useState('');
  const [addError, setAddError] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  const [inventoryView, setInventoryView] = useState<'table' | 'cards'>(() => {
    try { return localStorage.getItem('inventoryView') === 'cards' ? 'cards' : 'table'; } catch { return 'table'; }
  });
  const changeView = (v: 'table' | 'cards') => {
    setInventoryView(v);
    try { localStorage.setItem('inventoryView', v); } catch { /* ignore */ }
  };

  // Billing state
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [billingSearch, setBillingSearch] = useState('');
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);

  const API_URL = getApiUrl();

  // Fetch Inventory and Invoices
  const fetchData = async () => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const [invRes, invcRes] = await Promise.all([
        fetch(`${API_URL}/inventory`, { headers }),
        fetch(`${API_URL}/billing/invoices`, { headers })
      ]);

      if (invRes.ok) {
        const invData = await invRes.json();
        setInventory(invData);
      }
      if (invcRes.ok) {
        const invcData = await invcRes.json();
        setInvoices(invcData);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const MAX_IMAGES = 8;
  const pickNewImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    try {
      const room = MAX_IMAGES - newInvImages.length;
      const converted = await Promise.all(files.slice(0, room).map((f) => fileToResizedDataUrl(f)));
      setNewInvImages((prev) => [...prev, ...converted]);
      setAddError(files.length > room ? `Only ${MAX_IMAGES} photos per product; extra files were skipped.` : '');
    } catch (err: any) {
      setAddError(err.message || 'Could not use that image.');
    }
  };

  // Handle Add Inventory
  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvName || !newInvQty || !newInvPrice) return;
    setAddSaving(true);
    setAddError('');

    try {
      const res = await fetch(`${API_URL}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newInvName,
          category: newInvCategory,
          unit: newInvUnit,
          quantity: Number(newInvQty),
          unitPrice: Number(newInvPrice),
          description: newInvDescription,
          images: newInvImages,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setNewInvName('');
        setNewInvQty('');
        setNewInvPrice('');
        setNewInvImages([]);
        setNewInvDescription('');
        setShowAddInventoryModal(false);
        await fetchData();
        if (Array.isArray(data.imageErrors) && data.imageErrors.length) {
          // The product is saved; only the photo failed
          window.alert(`Product saved, but some photos were not uploaded: ${data.imageErrors.join(' ')}`);
        }
      } else {
        setAddError(data.error || 'Could not save the product.');
      }
    } catch (err) {
      console.error(err);
      setAddError('Network error. The product was not saved.');
    } finally {
      setAddSaving(false);
    }
  };

  // Build and download the PDF for an invoice using the shop profile
  const printInvoice = async (inv: CreatedInvoice | BillingInvoice) => {
    const resolve = (path?: string) => {
      if (!path) return null;
      return path.startsWith('http') ? path : `${getBackendOrigin()}${path}`;
    };
    try {
      await generateInvoicePdf(
        { ...inv, taxAmount: inv.taxAmount || 0, discountAmount: inv.discountAmount || 0 },
        {
          shopName: user?.shopName,
          ownerName: user?.name,
          address: user?.shopAddress,
          phone: user?.phone || (user?.primaryType === 'phone' ? user.primaryCommunication : undefined),
          email: user?.email || (user?.primaryType === 'email' ? user.primaryCommunication : undefined),
          logoUrl: resolve(user?.companyLogo),
        }
      );
    } catch (err) {
      console.error('PDF generation failed:', err);
    }
  };

  // Called by the modal once the invoice is saved and stock has been deducted
  const handleInvoiceCreated = async (inv: CreatedInvoice) => {
    setShowCreateInvoiceModal(false);
    await fetchData(); // refreshes invoice list and the reduced stock
    await printInvoice(inv);
  };

  // Filtered lists
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchesCat = inventoryCategory === 'all' || item.category === inventoryCategory;
    return matchesSearch && matchesCat;
  });

  const filteredInvoices = invoices.filter(inv => {
    return (
      inv.invoiceNumber.toLowerCase().includes(billingSearch.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(billingSearch.toLowerCase())
    );
  });

  // Format PKR currency
  const formatPkr = (amount: number) => `PKR ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="min-h-screen bg-slate-950 light:bg-slate-100 text-slate-100 light:text-slate-800 flex flex-col font-sans transition-colors">
      {/* Top Bar with round profile circle and dynamic store name/Paintly */}
      <TopBar 
        onSignOut={onSignOut} 
        onNavigateSettings={onNavigateSettings}
        onNavigateDashboard={() => {}}
        isPublic={false}
      />

      {/* Tabs Bar — centered horizontally */}
      <div className="border-b border-slate-800 light:border-slate-300 bg-slate-900/60 light:bg-white backdrop-blur-md sticky top-16 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-14">
            
            {/* Animated Tab Switcher Buttons — centered */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 light:bg-slate-100 rounded-2xl border border-slate-800/80 light:border-slate-300">
              
              {/* Inventory Tab Button */}
              <button
                id="dashboard-tab-inventory"
                onClick={() => setActiveTab('inventory')}
                className={`relative px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'inventory'
                    ? 'text-white bg-indigo-600 shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Inventory</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'inventory'
                    ? 'bg-white/20 text-white light:text-slate-900'
                    : 'bg-slate-800 light:bg-slate-200 text-slate-400 light:text-slate-600'
                }`}>
                  {inventory.length}
                </span>
              </button>

              {/* Billing Tab Button */}
              <button
                id="dashboard-tab-billing"
                onClick={() => setActiveTab('billing')}
                className={`relative px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'billing'
                    ? 'text-white bg-indigo-600 shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Billing</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'billing'
                    ? 'bg-white/20 text-white light:text-slate-900'
                    : 'bg-slate-800 light:bg-slate-200 text-slate-400 light:text-slate-600'
                }`}>
                  {invoices.length}
                </span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Main Tab Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
        
        {/* TAB 1: INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-in fade-in duration-300">

            {/* Filter, Search Bar & Add Product — all in one row on large screens */}
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
              {/* Search */}
              <div className="relative w-full lg:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500 light:text-slate-600" />
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Search inventory items..."
                  className="w-full bg-slate-900 light:bg-white border border-slate-800 light:border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 light:text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter className="w-3.5 h-3.5 text-slate-500 light:text-slate-600" />
                {(['all', 'paint', 'utility', 'accessory'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setInventoryCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer ${
                      inventoryCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 light:bg-white text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 border border-slate-800 light:border-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Spacer pushes button to right on large screens */}
              <div className="hidden lg:block flex-1" />

              {/* View toggle: table / product cards */}
              <div className="flex items-center p-1 rounded-xl border border-slate-800 light:border-slate-300 bg-slate-900 light:bg-white" role="group" aria-label="Inventory view">
                {([['table', List, 'Table'], ['cards', LayoutGrid, 'Cards']] as const).map(([v, Icon, label]) => (
                  <button
                    key={v}
                    onClick={() => changeView(v)}
                    aria-pressed={inventoryView === v}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      inventoryView === v ? 'bg-indigo-600 text-white' : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Add Product Button */}
              <button
                onClick={() => setShowAddInventoryModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer transition-all whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Storefront-style product cards */}
            {inventoryView === 'cards' && (
              filteredInventory.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 light:border-slate-300 text-center py-12 text-slate-500 light:text-slate-600 text-xs">
                  No inventory items yet. Click "Add Product" to get started.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredInventory.map(item => (
                    <ProductCard key={item.id} item={item} onOpen={onOpenProduct} />
                  ))}
                </div>
              )
            )}

            {/* Inventory Table — horizontal scroll on small screens */}
            {inventoryView === 'table' && (
            <div className="rounded-2xl bg-slate-900/60 light:bg-white border border-slate-800 light:border-slate-300 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[640px]">
                  <thead className="bg-slate-950/40 light:bg-slate-100 border-b border-slate-800 light:border-slate-300 text-slate-400 light:text-slate-600 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Item Name</th>
                      <th className="py-3 px-4 whitespace-nowrap">Category</th>
                      <th className="py-3 px-4 whitespace-nowrap">In Stock</th>
                      <th className="py-3 px-4 whitespace-nowrap">Unit Price</th>
                      <th className="py-3 px-4 whitespace-nowrap">Total Value</th>
                      <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 light:divide-slate-200">
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-500 light:text-slate-600 text-xs">
                          No inventory items yet. Click "Add Product" to get started.
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map(item => {
                        const isLow = item.quantity < 20;
                        return (
                          <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4 font-medium text-slate-100 light:text-slate-800 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {item.hex && (
                                  <span className="w-3.5 h-3.5 rounded-full border border-slate-700 light:border-slate-300 shrink-0" style={{ backgroundColor: item.hex }} />
                                )}
                                <button type="button" onClick={() => onOpenProduct(item.id)} className="hover:text-indigo-400 text-left cursor-pointer">{item.name}</button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 capitalize text-slate-400 light:text-slate-600 whitespace-nowrap">{item.category}</td>
                            <td className="py-3.5 px-4 font-mono font-semibold whitespace-nowrap">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-3.5 px-4 font-mono whitespace-nowrap">{formatPkr(item.unitPrice)}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-200 light:text-slate-800 whitespace-nowrap">
                              {formatPkr(item.quantity * item.unitPrice)}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {isLow ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
                                  Low Stock
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                  Available
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </div>
        )}

        {/* TAB 2: BILLING */}
        {activeTab === 'billing' && (
          <div className="space-y-6 animate-in fade-in duration-300">

            {/* Search Bar & New Invoice Button — same row on large screens */}
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
              {/* Search */}
              <div className="relative w-full lg:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500 light:text-slate-600" />
                <input
                  type="text"
                  value={billingSearch}
                  onChange={(e) => setBillingSearch(e.target.value)}
                  placeholder="Search invoices by number or customer..."
                  className="w-full bg-slate-900 light:bg-white border border-slate-800 light:border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 light:text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Spacer pushes button to right on large screens */}
              <div className="hidden lg:block flex-1" />

              {/* New Invoice Button */}
              <button
                onClick={() => setShowCreateInvoiceModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer transition-all whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Invoice</span>
              </button>
            </div>

            {/* Invoices Table — horizontal scroll on small screens */}
            <div className="rounded-2xl bg-slate-900/60 light:bg-white border border-slate-800 light:border-slate-300 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                {filteredInvoices.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 light:text-slate-600 text-xs">
                    No invoices created yet. Click "New Invoice" above to log a sale.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs min-w-[780px]">
                    <thead className="bg-slate-950/40 light:bg-slate-100 border-b border-slate-800 light:border-slate-300 text-slate-400 light:text-slate-600 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-4 whitespace-nowrap">Invoice #</th>
                        <th className="py-3 px-4 whitespace-nowrap">Date</th>
                        <th className="py-3 px-4 whitespace-nowrap">Customer</th>
                        <th className="py-3 px-4 whitespace-nowrap">Items</th>
                        <th className="py-3 px-4 whitespace-nowrap">Total</th>
                        <th className="py-3 px-4 whitespace-nowrap">Payment</th>
                        <th className="py-3 px-4 whitespace-nowrap">Status</th>
                        <th className="py-3 px-4 whitespace-nowrap text-right">PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 light:divide-slate-200">
                      {filteredInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-400 whitespace-nowrap">{inv.invoiceNumber}</td>
                          <td className="py-3.5 px-4 text-slate-400 light:text-slate-600 whitespace-nowrap">{new Date(inv.createdAt).toLocaleDateString()}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-200 light:text-slate-800 whitespace-nowrap">{inv.customerName}</td>
                          <td className="py-3.5 px-4 text-slate-400 light:text-slate-600 whitespace-nowrap">
                            {inv.items.map(it => `${it.name} (${it.quantity})`).join(', ')}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">{formatPkr(inv.totalAmount)}</td>
                          <td className="py-3.5 px-4 uppercase text-[10px] font-semibold text-slate-400 light:text-slate-600 whitespace-nowrap">{inv.paymentMethod}</td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold capitalize">
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => printInvoice(inv)}
                              title="Download invoice PDF"
                              aria-label={`Download PDF for ${inv.invoiceNumber}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-slate-800 light:hover:bg-slate-200 cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL: ADD INVENTORY */}
      {showAddInventoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 light:bg-white border border-slate-800 light:border-slate-300 rounded-3xl p-6 w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <h3 className="text-lg font-bold text-white light:text-slate-900 mb-4">Add Inventory Item</h3>
            <form onSubmit={handleAddInventory} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-400 light:text-slate-600 font-semibold uppercase">Product photos</span>
                  <span className="text-slate-500">{newInvImages.length}/{MAX_IMAGES} · first photo is the cover</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {newInvImages.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-700 light:border-slate-300 group">
                      <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 px-1.5 rounded bg-black/60 text-[10px] text-white font-mono">{i + 1}</span>
                      <button
                        type="button"
                        onClick={() => setNewInvImages((prev) => prev.filter((_, idx) => idx !== i))}
                        aria-label={`Remove photo ${i + 1}`}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {newInvImages.length < MAX_IMAGES && (
                    <label className="aspect-square rounded-xl border border-dashed border-slate-700 light:border-slate-300 bg-slate-950 light:bg-slate-100 flex flex-col items-center justify-center gap-1 text-slate-500 hover:border-indigo-500 hover:text-indigo-400 cursor-pointer">
                      <ImagePlus className="w-6 h-6" />
                      <span className="text-[10px]">Add</span>
                      <input type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pickNewImages} />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 light:text-slate-600 mb-1 font-semibold uppercase">Product Name</label>
                <input
                  type="text"
                  required
                  value={newInvName}
                  onChange={(e) => setNewInvName(e.target.value)}
                  placeholder="e.g. Synthetic Thinner 1L"
                  className="w-full bg-slate-950 light:bg-slate-100 border border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-white light:text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 light:text-slate-600 mb-1 font-semibold uppercase">Category</label>
                  <select
                    value={newInvCategory}
                    onChange={(e: any) => setNewInvCategory(e.target.value)}
                    className="w-full bg-slate-950 light:bg-slate-100 border border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-white light:text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="paint">Paint</option>
                    <option value="utility">Utility</option>
                    <option value="accessory">Accessory</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 light:text-slate-600 mb-1 font-semibold uppercase">Unit</label>
                  <select
                    value={newInvUnit}
                    onChange={(e: any) => setNewInvUnit(e.target.value)}
                    className="w-full bg-slate-950 light:bg-slate-100 border border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-white light:text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="litres">Litres</option>
                    <option value="pieces">Pieces</option>
                    <option value="cans">Cans</option>
                    <option value="rolls">Rolls</option>
                    <option value="kg">Kg</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 light:text-slate-600 mb-1 font-semibold uppercase">Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newInvQty}
                    onChange={(e) => setNewInvQty(e.target.value)}
                    placeholder="50"
                    className="w-full bg-slate-950 light:bg-slate-100 border border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-white light:text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 light:text-slate-600 mb-1 font-semibold uppercase">Unit Price (PKR)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={newInvPrice}
                    onChange={(e) => setNewInvPrice(e.target.value)}
                    placeholder="1250"
                    className="w-full bg-slate-950 light:bg-slate-100 border border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-white light:text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 light:text-slate-600 mb-1 font-semibold uppercase">Description (optional)</label>
                <textarea
                  rows={2}
                  value={newInvDescription}
                  onChange={(e) => setNewInvDescription(e.target.value)}
                  placeholder="Finish, coverage, drying time..."
                  className="w-full bg-slate-950 light:bg-slate-100 border border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-white light:text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {addError && <p className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{addError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddInventoryModal(false); setAddError(''); }}
                  className="px-4 py-2 rounded-xl bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold cursor-pointer"
                >
                  {addSaving ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE INVOICE */}
      {showCreateInvoiceModal && (
        <InvoiceModal
          token={token}
          inventory={inventory}
          onClose={() => setShowCreateInvoiceModal(false)}
          onCreated={handleInvoiceCreated}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 light:border-slate-300 bg-slate-950 light:bg-slate-100 py-6 text-center text-xs text-slate-500 light:text-slate-600 mt-auto transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Paintly. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
