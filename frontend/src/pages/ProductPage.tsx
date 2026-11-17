import React, { useEffect, useState } from 'react';
import { ArrowLeft, Pencil, Check, X, Loader2 } from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { stockStatus } from '../components/ProductCard';
import { ProductGallery } from '../components/ProductGallery';
import type { ProductLike } from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config/api';
import { fileToResizedDataUrl } from '../utils/productImage';

interface Product extends ProductLike {
  sku?: string;
  description?: string;
  images?: string[];
  imageUrls?: string[];
  updatedAt: string;
  userId?: string;
}

interface Props {
  productId: string;
  onBack: () => void;
  onSignOut: () => void;
  onNavigateSettings: () => void;
}

const fieldCls =
  'w-full bg-slate-950 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-100 light:text-slate-900 focus:outline-none focus:border-indigo-500';

export const ProductPage: React.FC<Props> = ({ productId, onBack, onSignOut, onNavigateSettings }) => {
  const { token, user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');

  const api = getApiUrl();
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  // Items without an owner are shared sample data and cannot be edited
  const canEdit = Boolean(product && product.userId && product.userId === user?.id);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${api}/inventory`, { headers });
        if (!res.ok) throw new Error();
        const list: Product[] = await res.json();
        const found = list.find((p) => p.id === productId) || null;
        if (!cancelled) {
          setProduct(found);
          if (!found) setError('This product could not be found.');
        }
      } catch {
        if (!cancelled) setError('Could not load the product.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [productId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (body: Record<string, unknown>) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${api}/inventory/${productId}`, { method: 'PUT', headers, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'Could not save changes.'); return false; }
      setProduct(data);
      return true;
    } catch {
      setError('Network error. Changes were not saved.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const MAX_IMAGES = 8;

  const onAddImages = async (files: File[]) => {
    const room = MAX_IMAGES - (product?.imageUrls?.length || 0);
    try {
      const converted = await Promise.all(files.slice(0, room).map((f) => fileToResizedDataUrl(f)));
      const ok = await save({ addImages: converted });
      if (ok && files.length > room) setError(`Only ${MAX_IMAGES} photos per product; extra files were skipped.`);
    } catch (err: any) {
      setError(err.message || 'Could not use that image.');
    }
  };

  const onRemoveImage = async (index: number) => {
    const fileName = product?.images?.[index];
    // Legacy single-image products have no file list; they cannot be removed individually
    if (!fileName) { setError('This older photo cannot be removed. Add new photos instead.'); return; }
    await save({ removeImages: [fileName] });
  };

  const startEdit = () => {
    if (!product) return;
    setName(product.name);
    setPrice(String(product.unitPrice));
    setSku(product.sku || '');
    setDescription(product.description || '');
    setEditing(true);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await save({ name, unitPrice: Number(price), sku, description })) setEditing(false);
  };

  const status = product ? stockStatus(product.quantity) : null;

  return (
    <div className="min-h-screen bg-slate-950 light:bg-slate-100 text-slate-100 light:text-slate-800 flex flex-col">
      <TopBar onSignOut={onSignOut} onNavigateSettings={onNavigateSettings} onNavigateDashboard={onBack} isPublic={false} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <button onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to inventory
        </button>

        {loading && <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading product…</div>}
        {!loading && !product && <p className="text-slate-400 light:text-slate-600">{error}</p>}

        {product && status && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Gallery: carousel + side list of all photos */}
            <ProductGallery
              item={product}
              urls={product.imageUrls || []}
              canEdit={canEdit}
              busy={saving}
              maxImages={MAX_IMAGES}
              onAdd={onAddImages}
              onRemove={onRemoveImage}
            />

            {/* Details */}
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-slate-400 light:text-slate-600">
                <span>{product.category}</span>
                <span className={`px-2 py-0.5 rounded-full border normal-case tracking-normal text-[11px] ${status.cls}`}>{status.label}</span>
              </div>

              {!editing ? (
                <>
                  <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-white light:text-slate-900">{product.name}</h1>
                  <div className="mt-3 font-mono text-3xl font-bold text-indigo-400">Rs. {Math.round(product.unitPrice).toLocaleString('en-PK')}
                    <span className="text-sm text-slate-400 font-sans font-medium"> / {product.unit.replace(/s$/, '')}</span>
                  </div>
                  <p className="mt-5 text-slate-300 light:text-slate-700 leading-relaxed whitespace-pre-line">
                    {product.description || <span className="text-slate-500">No description yet.</span>}
                  </p>
                </>
              ) : (
                <form onSubmit={submitEdit} className="mt-3 space-y-3">
                  <input className={fieldCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" required />
                  <div className="grid grid-cols-2 gap-3">
                    <input className={fieldCls} value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="1" placeholder="Unit price (PKR)" required />
                    <input className={fieldCls} value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" />
                  </div>
                  <textarea className={fieldCls} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
                    </button>
                    <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl border border-slate-700 light:border-slate-300 text-sm font-semibold text-slate-300 light:text-slate-700 flex items-center gap-1.5 cursor-pointer">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </form>
              )}

              {error && product && <p className="mt-3 text-sm text-red-400">{error}</p>}

              <dl className="mt-7 grid grid-cols-2 gap-px rounded-2xl overflow-hidden border border-slate-800 light:border-slate-300 bg-slate-800 light:bg-slate-300 text-sm">
                {[
                  ['In stock', `${product.quantity} ${product.unit}`],
                  ['Stock value', `Rs. ${Math.round(product.quantity * product.unitPrice).toLocaleString('en-PK')}`],
                  ['SKU', product.sku || '—'],
                  ['Last updated', new Date(product.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })],
                ].map(([k, v]) => (
                  <div key={k} className="bg-slate-900 light:bg-white p-4">
                    <dt className="text-xs uppercase tracking-wider text-slate-400 light:text-slate-600 font-semibold">{k}</dt>
                    <dd className="mt-1 font-mono font-semibold text-slate-100 light:text-slate-900">{v}</dd>
                  </div>
                ))}
              </dl>

              {canEdit && !editing && (
                <button onClick={startEdit} className="mt-5 px-4 py-2 rounded-xl border border-slate-700 light:border-slate-300 text-sm font-semibold text-slate-200 light:text-slate-800 hover:border-indigo-500 flex items-center gap-2 cursor-pointer">
                  <Pencil className="w-4 h-4" /> Edit details
                </button>
              )}
              {!canEdit && (
                <p className="mt-5 text-xs text-slate-500">This is a shared sample item, so it can't be edited.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
