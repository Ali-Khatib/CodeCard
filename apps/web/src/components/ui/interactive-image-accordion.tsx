'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { projectColorAt } from '@/lib/design/project-card-colors';

export type ImageAccordionItem = {
  id: string;
  title: string;
  imageUrl: string;
  subtitle?: string;
  colorIndex?: number;
};

type AccordionPanelProps = {
  item: ImageAccordionItem;
  isActive: boolean;
  onActivate: () => void;
  index: number;
};

function AccordionPanel({ item, isActive, onActivate, index }: AccordionPanelProps) {
  const color = projectColorAt(item.colorIndex ?? index);

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-expanded={isActive}
      aria-label={item.title}
      onMouseEnter={() => {
        if (
          typeof window !== 'undefined' &&
          window.matchMedia('(hover: hover) and (pointer: fine)').matches
        ) {
          onActivate();
        }
      }}
      onFocus={onActivate}
      onClick={onActivate}
      className={cn(
        'cc-accordion-panel relative h-[min(450px,52vh)] shrink-0 overflow-hidden rounded-[24px] border-2',
        'transition-[width,box-shadow,transform] duration-[520ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c094e4]',
        isActive ? 'w-[min(400px,42vw)] scale-[1.01] shadow-[0_12px_40px_rgba(35,35,36,0.12)]' : 'w-[60px]',
      )}
      style={{
        borderColor: color.border,
        background: color.bg,
        boxShadow: isActive ? `0 0 0 1px ${color.border}40, 0 12px 40px rgba(${color.glow}, 0.2)` : undefined,
      }}
    >
      <Image
        src={item.imageUrl}
        alt=""
        fill
        className={cn(
          'object-cover transition-transform duration-[520ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
          isActive ? 'scale-[1.03] opacity-95' : 'scale-100 opacity-80',
        )}
        sizes={isActive ? '400px' : '60px'}
      />
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-300',
          isActive
            ? 'bg-gradient-to-t from-[rgba(35,35,36,0.6)] via-[rgba(35,35,36,0.15)] to-transparent'
            : `bg-[rgba(35,35,36,0.25)]`,
        )}
        aria-hidden
      />
      <span
        className={cn(
          'absolute text-[15px] font-semibold tracking-[-0.02em] text-white drop-shadow-sm',
          'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isActive
            ? 'bottom-6 left-1/2 max-w-[90%] -translate-x-1/2 text-center'
            : 'bottom-24 left-1/2 w-max -translate-x-1/2 rotate-90 whitespace-nowrap',
        )}
      >
        {item.title}
      </span>
      {isActive && item.subtitle && (
        <span className="absolute bottom-14 left-1/2 max-w-[90%] -translate-x-1/2 text-center text-[13px] text-white/90">
          {item.subtitle}
        </span>
      )}
    </button>
  );
}

export type InteractiveImageAccordionProps = {
  items: ImageAccordionItem[];
  defaultActiveIndex?: number;
  activeIndex?: number;
  onActiveChange?: (index: number) => void;
  className?: string;
};

export function InteractiveImageAccordion({
  items,
  defaultActiveIndex = 0,
  activeIndex: controlledIndex,
  onActiveChange,
  className,
}: InteractiveImageAccordionProps) {
  const [internalIndex, setInternalIndex] = useState(defaultActiveIndex);
  const activeIndex = controlledIndex ?? internalIndex;

  const setActive = (index: number) => {
    if (controlledIndex === undefined) setInternalIndex(index);
    onActiveChange?.(index);
  };

  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        'flex flex-row items-stretch justify-center gap-3 overflow-x-auto p-1',
        className,
      )}
      role="tablist"
      aria-label="Featured projects"
    >
      {items.map((item, index) => (
        <AccordionPanel
          key={item.id}
          item={item}
          index={index}
          isActive={index === activeIndex}
          onActivate={() => setActive(index)}
        />
      ))}
    </div>
  );
}

/** Demo / marketing variant with side copy — optional standalone section */
export function LandingAccordionItem() {
  const demoItems: ImageAccordionItem[] = [
    {
      id: '1',
      title: 'DevFlow',
      subtitle: 'CI/CD that makes sense',
      imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: '2',
      title: 'SchemaSync',
      subtitle: 'Migrations without drama',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: '3',
      title: 'Pulse',
      subtitle: 'Observability for teams',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: '4',
      title: 'API Gateway',
      subtitle: 'Edge routing layer',
      imageUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: '5',
      title: 'Design System',
      subtitle: 'Components at scale',
      imageUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=800&q=80',
    },
  ];

  return (
    <section className="bg-[var(--paper,#ffffff)] font-sans">
      <div className="mx-auto max-w-[1200px] px-6 py-12 md:py-20">
        <div className="flex flex-col items-center justify-between gap-12 md:flex-row">
          <div className="w-full text-center md:w-[42%] md:text-left">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#767073]">
              Featured work
            </p>
            <h2 className="mt-3 text-[36px] font-medium leading-[1.08] tracking-[-0.03em] text-[#232324] md:text-[42px]">
              Your best projects, one glance away
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-[#767073] md:mx-0">
              Hover to explore featured work — the same calm stack visitors see on your public
              CodeCard.
            </p>
          </div>
          <div className="w-full md:w-[58%]">
            <InteractiveImageAccordion items={demoItems} defaultActiveIndex={0} />
          </div>
        </div>
      </div>
    </section>
  );
}
