import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from 'react';
import { BadgeCheck, Camera, Images, Loader2, Plus, Trash2, X } from 'lucide-react';
import { api, ApiError } from '@/api/client';
import type { DraftItem, Look } from '@/api/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { isAffiliateVerifiedClient } from '@/lib/affiliate';
import { cn } from '@/lib/cn';

interface DraftRow {
  id: string;
  brand: string;
  item_name: string;
  priceDollars: string;
  link: string;
  x_pct: number;
  y_pct: number;
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const FIELD =
  'w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/15';

/** Publishes a permanent profile photo (look) with shoppable item pins. */
export function PhotoComposer({ onPublished, onCancel }: { onPublished: (look: Look) => void; onCancel: () => void }) {
  const [local, setLocal] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const objectUrl = useRef<string | null>(null);

  useEffect(() => () => { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); }, []);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setUploadError('Please choose an image file');
    setUploadError(null);
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    const obj = URL.createObjectURL(file);
    objectUrl.current = obj;
    setLocal(obj);
    setImageUrl(null);
    setUploading(true);
    try {
      const { url } = await api.uploads.fromFile(file);
      setImageUrl(url);
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Upload failed — try again');
    } finally {
      setUploading(false);
    }
  }

  function updateRow(id: string, patch: Partial<DraftRow>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function addRow() {
    const id = crypto.randomUUID();
    setRows((rs) => [...rs, { id, brand: '', item_name: '', priceDollars: '', link: '', x_pct: 50, y_pct: 50 }]);
    setActiveId(id);
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
    if (uploading) return;
    if (!imageUrl) return setPublishError('Add a photo first');
    const items: DraftItem[] = [];
    for (const r of rows) {
      if (!r.brand.trim() || !r.item_name.trim() || !r.link.trim()) {
        return setPublishError('Each item needs a brand, name, and link');
      }
      const cents = Math.round(parseFloat(r.priceDollars || '0') * 100);
      items.push({
        x_pct: r.x_pct,
        y_pct: r.y_pct,
        brand: r.brand.trim(),
        item_name: r.item_name.trim(),
        price_cents: Number.isFinite(cents) && cents >= 0 ? cents : 0,
        currency: 'USD',
        affiliate_url: r.link.trim(),
      });
    }
    setPublishing(true);
    setPublishError(null);
    try {
      const { look } = await api.looks.create({ image_url: imageUrl, caption: caption.trim(), items });
      onPublished(look);
    } catch (e) {
      setPublishing(false);
      setPublishError(e instanceof ApiError ? e.message : 'Could not publish');
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3">
        <button type="button" onClick={onCancel} aria-label="Cancel" className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
          <X className="h-5 w-5" aria-hidden />
        </button>
        <h2 className="font-serif text-lg italic text-zinc-900">New photo</h2>
        <span className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        {!local ? (
          <div className="flex flex-col items-center gap-5 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50">
              <Camera className="h-7 w-7 text-zinc-500" aria-hidden />
            </div>
            <div>
              <h3 className="font-serif text-xl text-zinc-900">Add a photo to your profile</h3>
              <p className="mt-1 text-sm text-zinc-500">Snap a look or pick one from your gallery.</p>
            </div>
            <div className="flex w-full max-w-xs flex-col gap-2">
              <Button onClick={() => cameraRef.current?.click()}><Camera className="h-4 w-4" aria-hidden /> Take a photo</Button>
              <Button variant="outline" onClick={() => galleryRef.current?.click()}><Images className="h-4 w-4" aria-hidden /> Choose from gallery</Button>
            </div>
            {uploadError ? <p role="alert" className="text-sm text-rose-600">{uploadError}</p> : null}
          </div>
        ) : (
          <section className="flex flex-col gap-4">
            <div
              ref={previewRef}
              className="relative aspect-[4/5] w-full touch-none overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100"
              onPointerDown={(e) => { if (!activeId) return; dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); setPinFromEvent(e); }}
              onPointerMove={(e) => { if (dragging.current) setPinFromEvent(e); }}
              onPointerUp={() => { dragging.current = false; }}
            >
              <img src={local} alt="Photo preview" className="h-full w-full object-cover" draggable={false} />
              {rows.map((r) => (
                <span
                  key={r.id}
                  className={cn('pointer-events-none absolute rounded-full bg-rose-600', r.id === activeId ? 'h-3.5 w-3.5 ring-2 ring-white' : 'h-2.5 w-2.5')}
                  style={{ left: `${r.x_pct}%`, top: `${r.y_pct}%`, transform: 'translate(-50%, -50%)' }}
                  aria-hidden
                />
              ))}
              {uploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                  <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs text-zinc-700 shadow"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Uploading…</span>
                </div>
              ) : activeId ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2 text-center text-[11px] text-white">Tap or drag on the photo to place this pin</div>
              ) : null}
            </div>

            <button type="button" onClick={() => { setLocal(null); setImageUrl(null); setRows([]); setActiveId(null); }} className="self-start text-xs text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline">
              Change photo
            </button>

            <Input label="Caption" name="caption" placeholder="Say something about this look…" value={caption} onChange={(e) => setCaption(e.target.value)} />

            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Shoppable items</h3>
              <button type="button" onClick={addRow} className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 transition-colors hover:bg-zinc-100">
                <Plus className="h-3.5 w-3.5" aria-hidden /> Add item
              </button>
            </div>

            {rows.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-400">No items yet. Add one, then pin it on the photo.</p>
            ) : null}

            <div className="flex flex-col gap-3">
              {rows.map((r, idx) => {
                const verified = r.link.trim() ? isAffiliateVerifiedClient(r.link.trim()) : false;
                return (
                  <div
                    key={r.id}
                    onFocusCapture={() => setActiveId(r.id)}
                    onClick={() => setActiveId(r.id)}
                    className={cn('rounded-lg border p-3 transition-colors', r.id === activeId ? 'border-zinc-900/40 bg-zinc-50' : 'border-zinc-200')}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500">Item {idx + 1}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setRows((rs) => rs.filter((x) => x.id !== r.id)); if (activeId === r.id) setActiveId(null); }} aria-label={`Remove item ${idx + 1}`} className="rounded p-1 text-zinc-400 hover:text-rose-600">
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className={FIELD} placeholder="Brand" aria-label="Brand" value={r.brand} onChange={(e) => updateRow(r.id, { brand: e.target.value })} />
                      <input className={FIELD} placeholder="Product" aria-label="Product" value={r.item_name} onChange={(e) => updateRow(r.id, { item_name: e.target.value })} />
                      <input className={FIELD} placeholder="Price (e.g. 49)" inputMode="decimal" aria-label="Price" value={r.priceDollars} onChange={(e) => updateRow(r.id, { priceDollars: e.target.value })} />
                      <div className="relative">
                        <input className={cn(FIELD, verified && 'pr-7')} placeholder="Link (https://…)" aria-label="Link" value={r.link} onChange={(e) => updateRow(r.id, { link: e.target.value })} />
                        {verified ? <BadgeCheck className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-600" aria-label="Verified" /> : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {local ? (
        <footer className="shrink-0 border-t border-zinc-200 px-4 py-3">
          {publishError ? <p role="alert" className="mb-2 text-sm text-rose-600">{publishError}</p> : null}
          <Button onClick={publish} pending={publishing} disabled={uploading || !imageUrl} className="w-full">
            {uploading ? 'Uploading photo…' : 'Publish photo'}
          </Button>
        </footer>
      ) : null}
    </div>
  );
}
