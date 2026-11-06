import type { ReactNode } from 'react';

/** Shared header for sub-pages. Pure server-safe markup, CSS does the entrance. */
export function Cc2PageHead({ title, lede, children }: { title: string; lede?: string; children?: ReactNode }) {
  return (
    <header className="cc2-pagehead">
      <div className="cc2-wrap">
        <h1 className="cc2-display cc2-pagehead__title">{title}</h1>
        {lede ? <p className="cc2-lede cc2-pagehead__lede">{lede}</p> : null}
        {children}
      </div>
    </header>
  );
}
