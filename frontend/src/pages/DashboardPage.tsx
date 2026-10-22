import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Receipt, 
  Plus, 
  Search, 
  Filter
} from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config/api';

interface InventoryItem {
  id: string;
  name: string;
  category: 'paint' | 'utility' | 'accessory';
  sku?: string;
  hex?: string;
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
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  onSignOut,
  onNavigateSettings 
}) => {
  const { token } = useAuth();
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

  // Billing state
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [billingSearch, setBillingSearch] = useState('');
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedItemName, setSelectedItemName] = useState('');
  const [selectedItemQty, setSelectedItemQty] = useState('1');
  const [selectedItemPrice, setSelectedItemPrice] = useState('');

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

  // Handle Add Inventory
  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvName || !newInvQty || !newInvPrice) return;

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
        }),
      });

      if (res.ok) {
        setNewInvName('');
        setNewInvQty('');
        setNewInvPrice('');
        setShowAddInventoryModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Create Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !selectedItemName || !selectedItemPrice) return;

    try {
      const res = await fetch(`${API_URL}/billing/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          paymentMethod: 'cash',
          items: [
            {
              name: selectedItemName,
              quantity: Number(selectedItemQty),
              unitPrice: Number(selectedItemPrice),
            }
          ],
        }),
      });

      if (res.ok) {
        setCustomerName('');
        setCustomerPhone('');
        setSelectedItemName('');
        setSelectedItemPrice('');
        setShowCreateInvoiceModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Bar with round profile circle and dynamic store name/Paintly */}
      <TopBar 
        onSignOut={onSignOut} 
        onNavigateSettings={onNavigateSettings}
        onNavigateDashboard={() => {}}
        isPublic={false}
      />

      {/* Tabs Bar — centered horizontally */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-16 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-14">
            
            {/* Animated Tab Switcher Buttons — centered */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800/80">
              
              {/* Inventory Tab Button */}
              <button
                id="dashboard-tab-inventory"
                onClick={() => setActiveTab('inventory')}
                className={`relative px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'inventory'
                    ? 'text-white bg-indigo-600 shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Inventory</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'inventory'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-slate-400'
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
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Billing</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'billing'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-slate-400'
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
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Search inventory items..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                {(['all', 'paint', 'utility', 'accessory'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setInventoryCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer ${
                      inventoryCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Spacer pushes button to right on large screens */}
              <div className="hidden lg:block flex-1" />

              {/* Add Product Button */}
              <button
                onClick={() => setShowAddInventoryModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer transition-all whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Inventory Table — horizontal scroll on small screens */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[640px]">
                  <thead className="bg-slate-950/40 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Item Name</th>
                      <th className="py-3 px-4 whitespace-nowrap">Category</th>
                      <th className="py-3 px-4 whitespace-nowrap">In Stock</th>
                      <th className="py-3 px-4 whitespace-nowrap">Unit Price</th>
                      <th className="py-3 px-4 whitespace-nowrap">Total Value</th>
                      <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-500 text-xs">
                          No inventory items yet. Click "Add Product" to get started.
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map(item => {
                        const isLow = item.quantity < 20;
                        return (
                          <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4 font-medium text-slate-100 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {item.hex && (
                                  <span className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" style={{ backgroundColor: item.hex }} />
                                )}
                                <span>{item.name}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 capitalize text-slate-400 whitespace-nowrap">{item.category}</td>
                            <td className="py-3.5 px-4 font-mono font-semibold whitespace-nowrap">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-3.5 px-4 font-mono whitespace-nowrap">{formatPkr(item.unitPrice)}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-200 whitespace-nowrap">
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
          </div>
        )}

        {/* TAB 2: BILLING */}
        {activeTab === 'billing' && (
          <div className="space-y-6 animate-in fade-in duration-300">

            {/* Search Bar & New Invoice Button — same row on large screens */}
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
              {/* Search */}
              <div className="relative w-full lg:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={billingSearch}
                  onChange={(e) => setBillingSearch(e.target.value)}
                  placeholder="Search invoices by number or customer..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
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
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                {filteredInvoices.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No invoices created yet. Click "New Invoice" above to log a sale.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs min-w-[720px]">
                    <thead className="bg-slate-950/40 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-4 whitespace-nowrap">Invoice #</th>
                        <th className="py-3 px-4 whitespace-nowrap">Date</th>
                        <th className="py-3 px-4 whitespace-nowrap">Customer</th>
                        <th className="py-3 px-4 whitespace-nowrap">Items</th>
                        <th className="py-3 px-4 whitespace-nowrap">Total</th>
                        <th className="py-3 px-4 whitespace-nowrap">Payment</th>
                        <th className="py-3 px-4 whitespace-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-400 whitespace-nowrap">{inv.invoiceNumber}</td>
                          <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">{new Date(inv.createdAt).toLocaleDateString()}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-200 whitespace-nowrap">{inv.customerName}</td>
                          <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                            {inv.items.map(it => `${it.name} (${it.quantity})`).join(', ')}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">{formatPkr(inv.totalAmount)}</td>
                          <td className="py-3.5 px-4 uppercase text-[10px] font-semibold text-slate-400 whitespace-nowrap">{inv.paymentMethod}</td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold capitalize">
                              {inv.status}
                            </span>
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add Inventory Item</h3>
            <form onSubmit={handleAddInventory} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold uppercase">Product Name</label>
                <input
                  type="text"
                  required
                  value={newInvName}
                  onChange={(e) => setNewInvName(e.target.value)}
                  placeholder="e.g. Synthetic Thinner 1L"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold uppercase">Category</label>
                  <select
                    value={newInvCategory}
                    onChange={(e: any) => setNewInvCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="paint">Paint</option>
                    <option value="utility">Utility</option>
                    <option value="accessory">Accessory</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold uppercase">Unit</label>
                  <select
                    value={newInvUnit}
                    onChange={(e: any) => setNewInvUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
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
                  <label className="block text-slate-400 mb-1 font-semibold uppercase">Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newInvQty}
                    onChange={(e) => setNewInvQty(e.target.value)}
                    placeholder="50"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold uppercase">Unit Price (PKR)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={newInvPrice}
                    onChange={(e) => setNewInvPrice(e.target.value)}
                    placeholder="1250"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddInventoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE INVOICE */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">New Counter Invoice</h3>
            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold uppercase">Customer Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Asad Builders"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold uppercase">Customer Phone</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0300 1111111"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Line Item</span>
                <div>
                  <label className="block text-slate-500 mb-1">Select / Enter Item</label>
                  <input
                    type="text"
                    required
                    value={selectedItemName}
                    onChange={(e) => setSelectedItemName(e.target.value)}
                    placeholder="e.g. Titanium White (20L)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Quantity</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={selectedItemQty}
                      onChange={(e) => setSelectedItemQty(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Unit Price (PKR)</label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={selectedItemPrice}
                      onChange={(e) => setSelectedItemPrice(e.target.value)}
                      placeholder="1500"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-slate-800">
                <span>Total Amount:</span>
                <span className="text-emerald-400">
                  {formatPkr(Number(selectedItemQty || 0) * Number(selectedItemPrice || 0))}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
                >
                  Confirm & Print Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Paintly. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
