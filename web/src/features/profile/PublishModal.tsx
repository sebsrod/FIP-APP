import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { X, Plus, Trash2, ImageDown } from 'lucide-react';
import { api, ApiError } from '@/api/client';
import type { DraftItem, Look } from '@/api/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { cn } from '@/lib/cn';

interface DraftRow {
  id: string;
  brand: string;
  item_name: string;
  priceDollars: string;
  currency: string;
  affiliate_url: string;
  x_pct: number;
  y_pct: number;
}

const FIELD =
  'w-full rounded-md border border-white/10 bg-black/40 px-2.5 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-rose-500/60 focus:outline-none focus:ring-2 focus:ring-rose-500/30';

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function PublishModal({
  onClose,
  onPublished,
}: {
  onClose: () => void;
  onPublished: (look: Look) => void;
}) {
  const [urlInput, setUrlInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const [caption, setCaption] = useState('');
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !publishing) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, publishing]);

  async function importImage() {
    const url = urlInput.trim();
    if (!url) return;
    setImporting(true);
    setImportError(null);
    try {
      const res = await api.uploads.fromUrl(url);
      setImageUrl(res.url);
    } catch (e) {
      setImportError(e instanceof ApiError ? e.message : 'Could not import image');
    } finally {
      setImporting(false);
    }
  }

  function updateRow(id: string, patch: Partial<DraftRow>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    const id = crypto.randomUUID();
    setRows((rs) => [
      ...rs,
      { id, brand: '', item_name: '', priceDollars: '', currency: 'USD', affiliate_url: '', x_pct: 50, y_pct: 50 },
    ]);
    setActiveId(id);
  }

  function removeRow(id: string) {
    setRows((rs) => rs.filter((r) => r.id !== id));
    setActiveId((cur) => (cur === id ? null : cur));
  }

  function setPinFromEvent(e: PointerEvent) {
    if (!activeId || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    updateRow(activeId, {
      x_pct: clamp(((e.clientX - rect.left) / rect.width) * 100),
      y_pct: clamp(((e.clientY - rect.top) / rect.height) * 100),
    });
  }

  async function publish() {
    if (!imageUrl) {
      setPublishError('Import a layout image first');
      return;
    }
    if (rows.length === 0) {
      setPublishError('Add at least one shoppable item');
      return;
    }
    const items: DraftItem[] = [];
    for (const r of rows) {
      if (!r.brand.trim() || !r.item_name.trim() || !r.affiliate_url.trim()) {
        setPublishError('Each item needs a brand, name, and link');
        return;
      }
      const cents = Math.round(parseFloat(r.priceDollars || '0') * 100);
      if (!Number.isFinite(cents) || cents < 0) {
        setPublishError('Enter a valid price for each item');
        return;
      }
      items.push({
        x_pct: r.x_pct,
        y_pct: r.y_pct,
        brand: r.brand.trim(),
        item_name: r.item_name.trim(),
        price_cents: cents,
        currency: (r.currency || 'USD').toUpperCase().slice(0, 3),
        affiliate_url: r.affiliate_url.trim(),
      });
    }

    setPublishing(true);
    setPublishError(null);
    try {
      const { look } = await api.looks.create({ image_url: imageUrl, caption: caption.trim(), items });
      onPublished(look);
    } catch (e) {
      setPublishError(e instanceof ApiError ? e.message : 'Could not publish');
      setPublishing(false);
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-zinc-950" role="dialog" aria-modal="true" aria-label="Publish a new look">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="font-serif text-lg italic text-zinc-50">Publish New Look</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {/* 1. Import image */}
        {!imageUrl ? (
          <section className="flex flex-col gap-3">
            <Input
              label="Layout image URL"
              name="image_url"
              placeholder="https://images.example.com/look.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              hint="The image is ingested through /api/uploads (stored in R2)."
            />
            <div className="flex items-center gap-2">
              <Button onClick={importImage} pending={importing} className="flex-1">
                <ImageDown className="h-4 w-4" aria-hidden />
                Import image
              </Button>
              <Button
                variant="ghost"
                onClick={() => setUrlInput(`https://picsum.photos/seed/fip-${Date.now() % 9999}/900/1350`)}
                type="button"
              >
                Use a sample
              </Button>
            </div>
            {importError ? (
              <p role="alert" className="text-sm text-rose-400">
                {importError}
              </p>
            ) : null}
          </section>
        ) : (
          <section className="flex flex-col gap-4">
            {/* Preview with draggable pins */}
            <div
              ref={previewRef}
              className="relative aspect-[4/5] w-full touch-none overflow-hidden rounded-lg border border-white/10"
              onPointerDown={(e) => {
                if (!activeId) return;
                dragging.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                setPinFromEvent(e);
              }}
              onPointerMove={(e) => {
                if (dragging.current) setPinFromEvent(e);
              }}
              onPointerUp={() => {
                dragging.current = false;
              }}
            >
              <ImageWithFallback src={imageUrl} alt="Look preview" className="h-full w-full" eager />
              {rows.map((r) => (
                <span
                  key={r.id}
                  className={cn(
                    'pointer-events-none absolute rounded-full bg-rose-600 transition-transform',
                    r.id === activeId ? 'h-3.5 w-3.5 ring-2 ring-white/80' : 'h-2.5 w-2.5',
                  )}
                  style={{ left: `${r.x_pct}%`, top: `${r.y_pct}%`, transform: 'translate(-50%, -50%)' }}
                  aria-hidden
                />
              ))}
              {activeId ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-center text-[11px] text-zinc-200">
                  Tap or drag on the image to place this pin
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => {
                setImageUrl(null);
                setRows([]);
                setActiveId(null);
              }}
              className="self-start text-xs text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline"
            >
              Choose a different image
            </button>

            <Input
              label="Caption"
              name="caption"
              placeholder="Say something about this look…"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />

            {/* Items */}
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-400">Shoppable items</h3>
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:bg-white/5"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Add item
              </button>
            </div>

            {rows.length === 0 ? (
              <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-sm text-zinc-500">
                No items yet. Add one, then pin it on the image.
              </p>
            ) : null}

            <div className="flex flex-col gap-3">
              {rows.map((r, idx) => (
                <div
                  key={r.id}
                  onFocusCapture={() => setActiveId(r.id)}
                  onClick={() => setActiveId(r.id)}
                  className={cn(
                    'rounded-lg border p-3 transition-colors',
                    r.id === activeId ? 'border-rose-500/50 bg-white/[0.03]' : 'border-white/10',
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-400">
                      Item {idx + 1}
                      <span className="ml-2 tabular-nums text-zinc-600">
                        {Math.round(r.x_pct)}%, {Math.round(r.y_pct)}%
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRow(r.id);
                      }}
                      aria-label={`Remove item ${idx + 1}`}
                      className="rounded p-1 text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className={FIELD}
                      placeholder="Brand"
                      aria-label="Brand"
                      value={r.brand}
                      onChange={(e) => updateRow(r.id, { brand: e.target.value })}
                    />
                    <input
                      className={FIELD}
                      placeholder="Item name"
                      aria-label="Item name"
                      value={r.item_name}
                      onChange={(e) => updateRow(r.id, { item_name: e.target.value })}
                    />
                    <input
                      className={FIELD}
                      placeholder="Price (e.g. 49)"
                      inputMode="decimal"
                      aria-label="Price"
                      value={r.priceDollars}
                      onChange={(e) => updateRow(r.id, { priceDollars: e.target.value })}
                    />
                    <input
                      className={FIELD}
                      placeholder="Currency"
                      aria-label="Currency"
                      value={r.currency}
                      maxLength={3}
                      onChange={(e) => updateRow(r.id, { currency: e.target.value })}
                    />
                    <input
                      className={cn(FIELD, 'col-span-2')}
                      placeholder="Affiliate URL (https://…)"
                      aria-label="Affiliate URL"
                      value={r.affiliate_url}
                      onChange={(e) => updateRow(r.id, { affiliate_url: e.target.value })}
                    />
                  </div>

                  {/* Precise pin controls */}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-[11px] text-zinc-500">
                      X
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={r.x_pct}
                        onChange={(e) => updateRow(r.id, { x_pct: Number(e.target.value) })}
                        className="w-full accent-rose-600"
                        aria-label={`Item ${idx + 1} horizontal position`}
                      />
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-zinc-500">
                      Y
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={r.y_pct}
                        onChange={(e) => updateRow(r.id, { y_pct: Number(e.target.value) })}
                        className="w-full accent-rose-600"
                        aria-label={`Item ${idx + 1} vertical position`}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      {imageUrl ? (
        <footer className="shrink-0 border-t border-white/10 px-4 py-3">
          {publishError ? (
            <p role="alert" className="mb-2 text-sm text-rose-400">
              {publishError}
            </p>
          ) : null}
          <Button onClick={publish} pending={publishing} className="w-full">
            Publish look
          </Button>
        </footer>
      ) : null}
    </div>
  );
}
