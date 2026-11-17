import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Camera, Trash2, Loader2 } from 'lucide-react';
import { ProductImage } from './ProductCard';
import type { ProductLike } from './ProductCard';
import { resolveProductImage } from '../utils/productImage';

interface Props {
  item: ProductLike;
  urls: string[];
  canEdit: boolean;
  busy: boolean;
  maxImages: number;
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
}

/** Carousel with a side list of thumbnails. Falls back to the product swatch when there are no photos. */
export const ProductGallery: React.FC<Props> = ({ item, urls, canEdit, busy, maxImages, onAdd, onRemove }) => {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const touchX = useRef<number | null>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const count = urls.length;

  // Keep the index valid when images are added or removed
  useEffect(() => {
    if (index > count - 1) setIndex(Math.max(0, count - 1));
  }, [count, index]);

  // Keep the selected thumbnail visible in the side list
  useEffect(() => {
    thumbRefs.current[index]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [index]);

  const go = (i: number) => count && setIndex((i + count) % count);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
  };

  const canAddMore = canEdit && count < maxImages;

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-3">
      {/* Side list of all images */}
      {(count > 1 || canAddMore) && (
        <div className="lg:relative lg:w-[84px] shrink-0">
          <div className="flex lg:flex-col gap-2 overflow-auto lg:absolute lg:inset-0 pb-1 lg:pb-0 lg:pr-1" role="list" aria-label="Product images">
            {urls.map((u, i) => (
              <button
                key={u}
                ref={(el) => { thumbRefs.current[i] = el; }}
                role="listitem"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={`relative shrink-0 w-[72px] h-[72px] lg:w-[76px] lg:h-[76px] rounded-xl overflow-hidden border-2 transition-colors cursor-pointer ${
                  i === index ? 'border-indigo-500' : 'border-slate-800 light:border-slate-300 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={resolveProductImage(u) || u} alt="" className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute bottom-0.5 left-0.5 px-1 rounded bg-black/60 text-[10px] text-white font-mono">{i + 1}</span>
              </button>
            ))}
            {canAddMore && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                aria-label="Add photos"
                className="shrink-0 w-[72px] h-[72px] lg:w-[76px] lg:h-[76px] rounded-xl border-2 border-dashed border-slate-700 light:border-slate-300 text-slate-500 hover:border-indigo-500 hover:text-indigo-400 flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Carousel */}
      <div
        className="relative flex-1 aspect-square rounded-3xl overflow-hidden border border-slate-800 light:border-slate-300 bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        }}
      >
        {count === 0 ? (
          <ProductImage item={item} className="w-full h-full" />
        ) : (
          <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
            {urls.map((u, i) => (
              <img key={u} src={resolveProductImage(u) || u} alt={`${item.name} photo ${i + 1}`} className="w-full h-full shrink-0 object-cover" draggable={false}
                onLoad={() => setLoaded((l) => ({ ...l, [u]: true }))} onError={() => setLoaded((l) => ({ ...l, [u]: true }))} />
            ))}
          </div>
        )}

        {count > 0 && !loaded[urls[index]] && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 pointer-events-none" role="status" aria-label="Loading photo">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        )}

        {count > 1 && (
          <>
            <button onClick={() => go(index - 1)} aria-label="Previous photo" className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/55 hover:bg-black/75 text-white backdrop-blur-md cursor-pointer">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => go(index + 1)} aria-label="Next photo" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/55 hover:bg-black/75 text-white backdrop-blur-md cursor-pointer">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/45 backdrop-blur-md">
              {urls.map((u, i) => (
                <button key={u} onClick={() => setIndex(i)} aria-label={`Go to photo ${i + 1}`} className={`h-1.5 rounded-full transition-all cursor-pointer ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
              ))}
            </div>
            <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/55 text-xs text-white font-mono backdrop-blur-md">{index + 1} / {count}</span>
          </>
        )}

        {canEdit && count > 0 && (
          <button
            onClick={() => { if (window.confirm('Delete this photo?')) onRemove(index); }}
            disabled={busy}
            aria-label="Delete this photo"
            title="Delete this photo"
            className="absolute top-3 right-3 p-2 rounded-full bg-black/55 hover:bg-red-600 text-white backdrop-blur-md cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        {canEdit && count === 0 && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="absolute bottom-3 right-3 px-3.5 py-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700 text-sm font-semibold text-white flex items-center gap-2 hover:bg-slate-900 cursor-pointer disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} Add photos
          </button>
        )}
      </div>

      {canEdit && (
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => { const files = Array.from(e.target.files || []); e.target.value = ''; if (files.length) onAdd(files); }}
        />
      )}
    </div>
  );
};
