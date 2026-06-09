import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from 'react';
import { Camera, Images, Loader2, Tag as TagIcon, Trash2, X, BadgeCheck, ArrowRight } from 'lucide-react';
import { api, ApiError } from '@/api/client';
import type { DraftPollTag, Poll, Side } from '@/api/types';
import { Button } from '@/components/Button';
import { isAffiliateVerifiedClient } from '@/lib/affiliate';
import { cn } from '@/lib/cn';

interface SideState {
  local: string | null;
  url: string | null;
  uploading: boolean;
  error: string | null;
}
interface DraftTag {
  id: string;
  side: Side;
  x: number;
  y: number;
  brand: string;
  product: string;
  priceDollars: string;
  link: string;
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const emptySide = (): SideState => ({ local: null, url: null, uploading: false, error: null });
const FIELD =
  'w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/15';

export function PollComposer({ onCreated, onCancel }: { onCreated: (poll: Poll) => void; onCancel: () => void }) {
  const [sides, setSides] = useState<Record<Side, SideState>>({ A: emptySide(), B: emptySide() });
  const [tags, setTags] = useState<DraftTag[]>([]);
  const [taggingSide, setTaggingSide] = useState<Side | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [captionStep, setCaptionStep] = useState(false);
  const [caption, setCaption] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const previewRefs = useRef<Record<Side, HTMLDivElement | null>>({ A: null, B: null });
  const objectUrls = useRef<string[]>([]);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const drag = useRef<{ id: string; moved: boolean } | null>(null);

  useEffect(() => () => objectUrls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  function setSide(side: Side, patch: Partial<SideState>) {
    setSides((s) => ({ ...s, [side]: { ...s[side], ...patch } }));
  }

  async function onFile(side: Side, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSide(side, { error: 'Please choose an image' });
      return;
    }
    const local = URL.createObjectURL(file);
    objectUrls.current.push(local);
    setSide(side, { local, url: null, uploading: true, error: null });
    try {
      const { url } = await api.uploads.fromFile(file);
      setSide(side, { url, uploading: false });
    } catch (err) {
      setSide(side, { uploading: false, error: err instanceof ApiError ? err.message : 'Upload failed' });
    }
  }

  function removeImage(side: Side) {
    setSide(side, emptySide());
    setTags((t) => t.filter((x) => x.side !== side));
    if (taggingSide === side) setTaggingSide(null);
  }

  function updateTag(id: string, patch: Partial<DraftTag>) {
    setTags((t) => t.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function createTagAt(side: Side, clientX: number, clientY: number) {
    const rect = previewRefs.current[side]?.getBoundingClientRect();
    if (!rect) return;
    const id = crypto.randomUUID();
    setTags((t) => [
      ...t,
      {
        id,
        side,
        x: clamp(((clientX - rect.left) / rect.width) * 100),
        y: clamp(((clientY - rect.top) / rect.height) * 100),
        brand: '',
        product: '',
        priceDollars: '',
        link: '',
      },
    ]);
    setEditingId(id);
  }

  function closeForm() {
    // Discard a tag the user left completely empty.
    setTags((t) =>
      t.filter((x) => x.id !== editingId || x.brand.trim() || x.product.trim() || x.link.trim()),
    );
    setEditingId(null);
  }

  function proceedToCaption() {
    if (!sides.A.url || !sides.B.url) {
      setPublishError('Add a photo to both sides');
      return;
    }
    setPublishError(null);
    setCaptionStep(true);
  }

  async function publish() {
    if (!sides.A.url || !sides.B.url) return;
    const draftTags: DraftPollTag[] = [];
    for (const t of tags) {
      if (!t.brand.trim() || !t.product.trim() || !t.link.trim()) {
        setCaptionStep(false);
        setPublishError('Finish or remove an incomplete item tag');
        return;
      }
      const cents = Math.round(parseFloat(t.priceDollars || '0') * 100);
      draftTags.push({
        side: t.side,
        x_pct: t.x,
        y_pct: t.y,
        brand: t.brand.trim(),
        item_name: t.product.trim(),
        price_cents: Number.isFinite(cents) && cents >= 0 ? cents : 0,
        currency: 'USD',
        affiliate_url: t.link.trim(),
      });
    }
    setPublishing(true);
    setPublishError(null);
    try {
      const { poll } = await api.polls.create({
        caption: caption.trim(),
        option_a_image_url: sides.A.url,
        option_b_image_url: sides.B.url,
        tags: draftTags,
      });
      onCreated(poll);
    } catch (err) {
      setPublishing(false);
      setCaptionStep(false);
      setPublishError(err instanceof ApiError ? err.message : 'Could not publish');
    }
  }

  const editing = tags.find((t) => t.id === editingId) ?? null;
  const bothReady = !!sides.A.url && !!sides.B.url;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3">
        <button type="button" onClick={onCancel} aria-label="Cancel" className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
          <X className="h-5 w-5" aria-hidden />
        </button>
        <h2 className="font-serif text-lg italic text-zinc-900">New poll</h2>
        <button
          type="button"
          onClick={proceedToCaption}
          disabled={!bothReady}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
            bothReady ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'cursor-not-allowed bg-zinc-200 text-zinc-400',
          )}
        >
          Next <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </header>

      {publishError ? (
        <p role="alert" className="bg-rose-50 px-4 py-2 text-center text-sm text-rose-600">
          {publishError}
        </p>
      ) : null}

      {/* Split canvas */}
      <div className="relative flex flex-1 overflow-hidden">
        {(['A', 'B'] as Side[]).map((side) => (
          <div
            key={side}
            ref={(el) => (previewRefs.current[side] = el)}
            className={cn('relative h-full w-1/2 touch-none bg-white', side === 'A' && 'border-r border-zinc-200')}
            onPointerDown={(e) => {
              if (taggingSide === side && sides[side].url && !editingId) {
                createTagAt(side, e.clientX, e.clientY);
              }
            }}
          >
            {sides[side].local ? (
              <>
                <img src={sides[side].local!} alt={`Option ${side}`} className="h-full w-full object-cover" draggable={false} />
                {/* remove */}
                <button
                  type="button"
                  onClick={() => removeImage(side)}
                  aria-label={`Remove ${side} photo`}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-zinc-700 shadow hover:text-zinc-900"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
                {/* tag tool */}
                <button
                  type="button"
                  onClick={() => setTaggingSide((s) => (s === side ? null : side))}
                  aria-label={`Tag items on ${side}`}
                  className={cn(
                    'absolute bottom-2 right-2 rounded-full p-2 shadow transition-colors',
                    taggingSide === side ? 'bg-rose-600 text-white' : 'bg-white/90 text-zinc-700 hover:text-zinc-900',
                  )}
                >
                  <TagIcon className="h-4 w-4" aria-hidden />
                </button>
                {sides[side].uploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-700" aria-hidden />
                  </div>
                ) : null}
                {taggingSide === side && !editingId ? (
                  <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
                    <span className="rounded-full bg-zinc-900/80 px-2.5 py-1 text-[11px] text-white">Tap the photo to tag an item</span>
                  </div>
                ) : null}
                {/* dots */}
                {tags
                  .filter((t) => t.side === side)
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      aria-label={`Item tag ${t.product || ''}`}
                      onPointerDown={(e: PointerEvent) => {
                        e.stopPropagation();
                        (e.target as Element).setPointerCapture?.(e.pointerId);
                        drag.current = { id: t.id, moved: false };
                      }}
                      onPointerMove={(e: PointerEvent) => {
                        if (drag.current?.id !== t.id) return;
                        const rect = previewRefs.current[side]?.getBoundingClientRect();
                        if (!rect) return;
                        drag.current.moved = true;
                        updateTag(t.id, {
                          x: clamp(((e.clientX - rect.left) / rect.width) * 100),
                          y: clamp(((e.clientY - rect.top) / rect.height) * 100),
                        });
                      }}
                      onPointerUp={() => {
                        const moved = drag.current?.moved;
                        drag.current = null;
                        if (!moved) setEditingId(t.id);
                      }}
                      className={cn(
                        'absolute h-3 w-3 rounded-full bg-rose-600',
                        t.id === editingId && 'ring-2 ring-white',
                      )}
                      style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%, -50%)' }}
                    />
                  ))}
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-2">
                <input ref={(el) => (inputs.current[`${side}-cam`] = el)} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(side, e)} />
                <input ref={(el) => (inputs.current[`${side}-gal`] = el)} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(side, e)} />
                <button type="button" onClick={() => inputs.current[`${side}-cam`]?.click()} className="flex flex-col items-center gap-1.5 text-zinc-600 hover:text-zinc-900">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-300"><Camera className="h-5 w-5" aria-hidden /></span>
                  <span className="text-[11px] font-medium">Camera</span>
                </button>
                <button type="button" onClick={() => inputs.current[`${side}-gal`]?.click()} className="flex flex-col items-center gap-1.5 text-zinc-600 hover:text-zinc-900">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-300"><Images className="h-5 w-5" aria-hidden /></span>
                  <span className="text-[11px] font-medium">Gallery</span>
                </button>
                {sides[side].error ? <p className="text-center text-[11px] text-rose-600">{sides[side].error}</p> : null}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tag form sheet */}
      {editing ? (
        <TagSheet
          tag={editing}
          onChange={(patch) => updateTag(editing.id, patch)}
          onDelete={() => {
            setTags((t) => t.filter((x) => x.id !== editing.id));
            setEditingId(null);
          }}
          onClose={closeForm}
        />
      ) : null}

      {/* Caption sheet */}
      {captionStep ? (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={() => !publishing && setCaptionStep(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg italic text-zinc-900">Add some context</h3>
            <p className="mt-1 text-sm text-zinc-500">What should voters know? e.g. “Party at the beach”.</p>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              maxLength={280}
              placeholder="Which one should I buy?"
              className={cn(FIELD, 'mt-3 resize-none')}
            />
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCaptionStep(false)} disabled={publishing}>
                Back
              </Button>
              <Button className="flex-1" onClick={publish} pending={publishing}>
                Publish poll
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TagSheet({
  tag,
  onChange,
  onDelete,
  onClose,
}: {
  tag: DraftTag;
  onChange: (patch: Partial<DraftTag>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const verified = tag.link.trim() ? isAffiliateVerifiedClient(tag.link.trim()) : false;
  return (
    <div className="absolute inset-0 z-40 flex items-end bg-black/30" onClick={onClose} role="presentation">
      <div className="w-full rounded-t-2xl bg-white p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-900">Tag an item</span>
          <button type="button" onClick={onClose} aria-label="Done" className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className={FIELD} placeholder="Brand name" aria-label="Brand name" value={tag.brand} onChange={(e) => onChange({ brand: e.target.value })} />
          <input className={FIELD} placeholder="Product" aria-label="Product" value={tag.product} onChange={(e) => onChange({ product: e.target.value })} />
          <input className={FIELD} placeholder="Price (e.g. 49)" inputMode="decimal" aria-label="Price" value={tag.priceDollars} onChange={(e) => onChange({ priceDollars: e.target.value })} />
          <div className="relative">
            <input className={cn(FIELD, verified && 'pr-7')} placeholder="Link (https://…)" aria-label="Product link" value={tag.link} onChange={(e) => onChange({ link: e.target.value })} />
            {verified ? <BadgeCheck className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-600" aria-label="Verified affiliate" /> : null}
          </div>
        </div>
        {verified ? <p className="mt-1.5 text-[11px] text-rose-600">Verified affiliate brand ✓</p> : null}
        <div className="mt-3 flex gap-2">
          <Button variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={onDelete}>
            <Trash2 className="h-4 w-4" aria-hidden /> Remove
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
