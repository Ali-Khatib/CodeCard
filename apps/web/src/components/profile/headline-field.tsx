'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  Briefcase,
  Code2,
  FlaskConical,
  GraduationCap,
  Layers,
  Palette,
  PenLine,
  Plus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  parseHeadlineParts,
  serializeHeadlineParts,
  type HeadlineIconId,
  type HeadlinePart,
} from '@/lib/profile/headline-roles';

const ICONS: { id: HeadlineIconId; label: string; Icon: LucideIcon }[] = [
  { id: 'work', label: 'Work', Icon: Briefcase },
  { id: 'code', label: 'Code', Icon: Code2 },
  { id: 'lab', label: 'Research', Icon: FlaskConical },
  { id: 'design', label: 'Design', Icon: Palette },
  { id: 'product', label: 'Product', Icon: Layers },
  { id: 'data', label: 'Data', Icon: BarChart3 },
  { id: 'write', label: 'Writing', Icon: PenLine },
  { id: 'teach', label: 'Teaching', Icon: GraduationCap },
  { id: 'lead', label: 'Leadership', Icon: Users },
];

const MAX_LINES = 3;

function partsFromValue(value: string): HeadlinePart[] {
  const parsed = parseHeadlineParts(value);
  if (parsed.length === 0) return [{ text: '', icon: null }];
  return parsed.slice(0, MAX_LINES);
}

export function HeadlineField({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [parts, setParts] = useState<HeadlinePart[]>(() => partsFromValue(value));
  const [stored, setStored] = useState(() => serializeHeadlineParts(partsFromValue(value)));

  useEffect(() => {
    if (value === stored) return;
    const next = partsFromValue(value);
    setParts(next);
    setStored(serializeHeadlineParts(next));
  }, [stored, value]);

  function commit(next: HeadlinePart[]) {
    const lines = next.length > 0 ? next : [{ text: '', icon: null }];
    setParts(lines);
    const serialized = serializeHeadlineParts(lines);
    setStored(serialized);
    onChange(serialized);
  }

  return (
    <div className="space-y-2 scroll-mt-28" id="headline-field">
      <label className="text-[13px] font-medium text-[var(--app-ink)]" htmlFor="headline">
        Headline
      </label>
      <p className="text-[12px] text-[var(--app-smoke)]">
        The first line stands on its own when you add a third. The other lines share the row under
        it. Pick an icon for any line.
      </p>
      <div className="space-y-3">
        {parts.map((part, index) => (
          <div key={index} className="cc-headline-field__line">
            <div className="cc-headline-field__icons" role="group" aria-label={`Icons for line ${index + 1}`}>
              {ICONS.map(({ id, label, Icon }) => {
                const selected = part.icon === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`cc-headline-field__icon${selected ? ' is-selected' : ''}`}
                    aria-pressed={selected}
                    aria-label={`${label} icon`}
                    title={label}
                    disabled={disabled}
                    onClick={() => {
                      const next = parts.slice();
                      next[index] = { ...part, icon: selected ? null : id };
                      commit(next);
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
            <div className="cc-headline-field__entry">
              <input
                id={index === 0 ? 'headline' : undefined}
                className="cc-app-input min-w-0 flex-1"
                value={part.text}
                disabled={disabled}
                placeholder={index === 0 ? 'Founder of CodeCard' : 'Software Engineer'}
                onChange={(event) => {
                  const next = parts.slice();
                  next[index] = { ...part, text: event.target.value };
                  commit(next);
                }}
              />
              {parts.length > 1 ? (
                <button
                  type="button"
                  className="shrink-0 text-[12px] text-[var(--app-smoke)] underline-offset-2 hover:underline"
                  disabled={disabled}
                  onClick={() => commit(parts.filter((_, line) => line !== index))}
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      {parts.length < MAX_LINES ? (
        <button
          type="button"
          className="cc-headline-field__add"
          disabled={disabled}
          onClick={() => commit([...parts, { text: '', icon: null }])}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add a line
        </button>
      ) : null}
    </div>
  );
}
