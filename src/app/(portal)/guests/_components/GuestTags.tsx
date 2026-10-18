'use client';

import { useState } from 'react';
import { Lock, Plus } from 'lucide-react';
import { deriveAutoTags, type Guest, type GuestTag, type Tone } from '@/core';
import { useMesaStore } from '@/lib/store';
import { TagChip } from '@/components/ui/pill';
import { Modal } from '@/components/ui/dialog';
import { SecondaryButton, PrimaryButton } from '@/components/ui/button';
import { Field, TextInput } from '@/components/ui/field';
import { cn } from '@/lib/utils';

// The rule each auto tag encodes — surfaced in the lock tooltip so staff know why
// it can't be removed. Ids come from deriveAutoTags in core.
const AUTO_REASON: Record<string, string> = {
  'auto-frequent': 'Auto: 5+ visits',
  'auto-vip': 'Auto: 10+ visits',
  'auto-noshow': 'Auto: 2+ no-shows',
  'auto-celebrator': 'Auto: 2+ occasions on record',
};

// Tones a manual tag may take. brass stays available for VIP-style manual flags.
const TONE_CHOICES: { tone: Tone; label: string; swatch: string }[] = [
  { tone: 'neutral', label: 'Neutral', swatch: 'bg-mute' },
  { tone: 'info', label: 'Info', swatch: 'bg-info' },
  { tone: 'ok', label: 'Good', swatch: 'bg-ok' },
  { tone: 'warn', label: 'Warn', swatch: 'bg-warn' },
  { tone: 'danger', label: 'Danger', swatch: 'bg-danger' },
  { tone: 'brass', label: 'VIP', swatch: 'bg-brass' },
];

export function GuestTags({ guest, canEdit }: { guest: Guest; canEdit: boolean }) {
  const upsertGuestTag = useMesaStore((s) => s.upsertGuestTag);
  const removeGuestTag = useMesaStore((s) => s.removeGuestTag);

  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [tone, setTone] = useState<Tone>('neutral');

  const manual = guest.tags;
  const auto = deriveAutoTags(guest).filter(
    // A manual tag with the same label supersedes the auto one (matches tagsFor).
    (a) => !manual.some((m) => m.label === a.label),
  );

  const trimmed = label.trim();
  const duplicate = manual.some((t) => t.label.toLowerCase() === trimmed.toLowerCase());

  const addTag = () => {
    if (!trimmed || duplicate) return;
    const tag: GuestTag = {
      id: `man-${Date.now().toString(36)}`,
      label: trimmed,
      kind: 'manual',
      tone,
    };
    upsertGuestTag(guest.id, tag);
    setLabel('');
    setTone('neutral');
    setOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {manual.map((tag) => (
        <TagChip
          key={tag.id}
          tag={tag}
          onRemove={canEdit ? (id) => removeGuestTag(guest.id, id) : undefined}
        />
      ))}

      {auto.map((tag) => (
        <span
          key={tag.id}
          title={AUTO_REASON[tag.id] ?? 'Auto-generated tag'}
          className="inline-flex items-center gap-1"
        >
          <TagChip tag={tag} />
          <Lock className="size-3 text-mute" aria-hidden />
        </span>
      ))}

      {manual.length === 0 && auto.length === 0 && (
        <span className="text-sm text-mute">No tags yet.</span>
      )}

      {canEdit && (
        <>
          <SecondaryButton size="sm" onClick={() => setOpen(true)} className="gap-1">
            <Plus className="size-3.5" />
            Add tag
          </SecondaryButton>

          <Modal
            open={open}
            onOpenChange={setOpen}
            title="Add a tag"
            description="Manual tags sit alongside the automatic ones derived from visit history."
            size="sm"
            footer={
              <>
                <SecondaryButton size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton size="sm" onClick={addTag} disabled={!trimmed || duplicate}>
                  Add tag
                </PrimaryButton>
              </>
            }
          >
            <div className="flex flex-col gap-4">
              <Field
                label="Label"
                required
                htmlFor="tag-label"
                error={duplicate ? 'This guest already has that tag' : undefined}
              >
                <TextInput
                  id="tag-label"
                  value={label}
                  invalid={duplicate}
                  onChange={(e) => setLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  placeholder="e.g. Allergy: shellfish"
                  maxLength={40}
                  autoFocus
                />
              </Field>

              <Field label="Tone">
                <div className="flex flex-wrap gap-2">
                  {TONE_CHOICES.map((c) => (
                    <button
                      key={c.tone}
                      type="button"
                      onClick={() => setTone(c.tone)}
                      aria-pressed={tone === c.tone}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px] outline-terracotta transition',
                        tone === c.tone
                          ? 'border-terracotta bg-sand text-ink'
                          : 'border-line text-slate hover:bg-sand',
                      )}
                    >
                      <span className={cn('size-2.5 rounded-full', c.swatch)} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
