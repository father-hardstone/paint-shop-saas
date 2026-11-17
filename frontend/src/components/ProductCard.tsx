import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { resolveProductImage } from '../utils/productImage';
import { getCardImageRotateSeconds } from '../config/ui';

export interface ProductLike {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  hex?: string;
  imageUrl?: string;
  imageUrls?: string[];
}

export const LOW_STOCK_THRESHOLD = 20;

export function stockStatus(quantity: number): { label: string; cls: string } {
  if (quantity < 1) return { label: 'Out of stock', cls: 'bg-red-500/10 border-red-500/30 text-red-400' };
  if (quantity < LOW_STOCK_THRESHOLD) return { label: 'Low stock', cls: 'bg-amber-500/10 border-amber-500/30 text-amber-400' };
  return { label: 'In stock', cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' };
}

/** Product image, falling back to a colour swatch / icon when there is no photo. */
export const ProductImage: React.FC<{ item: ProductLike; className?: string }> = ({ item, className = '' }) => {
  const src = resolveProductImage(item.imageUrl);
  if (src) return <img src={src} alt={item.name} loading="lazy" className={`object-cover ${className}`} />;
  return (
    <div
      className={`flex items-center justify-center text-slate-500 bg-slate-800 light:bg-slate-200 ${className}`}
      style={item.hex ? { background: item.hex } : undefined}
      aria-label={`${item.name} (no photo)`}
    >
      {!item.hex && <ImageOff className="w-8 h-8 opacity-60" />}
    </div>
  );
};

/** Cover image that cross-fades through all of a product's photos every N seconds (paused on hover). */
const RotatingCover: React.FC<{ item: ProductLike; paused: boolean }> = ({ item, paused }) => {
  const urls = item.imageUrls && item.imageUrls.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : [];
  const seconds = getCardImageRotateSeconds();
  const [index, setIndex] = useState(0);
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (urls.length < 2 || seconds <= 0 || paused || reduceMotion) return;
    // Random head start so a grid of cards does not all flip at the same instant
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      setIndex((i) => (i + 1) % urls.length);
      interval = window.setInterval(() => setIndex((i) => (i + 1) % urls.length), seconds * 1000);
    }, seconds * 1000 + Math.random() * 600);
    return () => { window.clearTimeout(start); if (interval) window.clearInterval(interval); };
  }, [urls.length, seconds, paused, reduceMotion]);

  if (urls.length < 2) return <ProductImage item={item} className="w-full h-full group-hover:scale-105 transition-transform duration-300" />;

  return (
    <div className="relative w-full h-full">
      {urls.map((u, i) => (
        <img
          key={u}
          src={resolveProductImage(u) || u}
          alt={i === index ? item.name : ''}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
    </div>
  );
};

export const ProductCard: React.FC<{ item: ProductLike; onOpen: (id: string) => void }> = ({ item, onOpen }) => {
  const status = stockStatus(item.quantity);
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group text-left rounded-2xl overflow-hidden bg-slate-900/60 light:bg-white border border-slate-800 light:border-slate-300 hover:border-indigo-500/70 hover:-translate-y-0.5 hover:shadow-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-950 light:bg-slate-100">
        <RotatingCover item={item} paused={hovered} />
        <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold backdrop-blur-md ${status.cls}`}>
          {status.label}
        </span>
      </div>
      <div className="p-3.5">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 light:text-slate-600 font-semibold">{item.category}</div>
        <div className="mt-0.5 font-semibold text-slate-100 light:text-slate-900 truncate">{item.name}</div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <span className="font-mono font-bold text-white light:text-slate-900">Rs. {Math.round(item.unitPrice).toLocaleString('en-PK')}</span>
          <span className="text-xs text-slate-400 light:text-slate-600 font-mono">{item.quantity} {item.unit}</span>
        </div>
      </div>
    </button>
  );
};
