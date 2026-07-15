'use client';

import { externalPdfHostname } from '@codecard/validation';
import { ResearchFigureManager } from '@/components/dashboard/research-figure-manager';
import type { ResearchFigureRecord } from '@/lib/research/research-figure-core';

export function ResearchMediaSection({
  researchPaperId,
  pdfUrl,
  figures,
}: {
  researchPaperId: string;
  pdfUrl: string | null;
  figures: ResearchFigureRecord[];
}) {
  const host = pdfUrl ? externalPdfHostname(pdfUrl) : null;

  return (
    <section className="mt-10 max-w-[720px] space-y-8 border-t border-[var(--app-border)] pt-10">
      <div>
        <h2 className="text-[18px] font-semibold text-[var(--app-ink)]">Research media</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--app-smoke)]">
          PDF links and figures save independently from the paper details form above. Unsaved text
          changes are not submitted when you manage media.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-[var(--app-border)] bg-white p-4">
        <h3 className="text-[15px] font-semibold text-[var(--app-ink)]">PDF</h3>
        {pdfUrl && host ? (
          <div className="space-y-2">
            <p className="text-[14px] text-[var(--app-ink)]">
              External paper link · <span className="font-medium">{host}</span>
            </p>
            <p className="text-[13px] text-[var(--app-smoke)]">
              Externally hosted. CodeCard does not host, scan, or verify this file. Edit or clear the
              URL in Paper details above, then save.
            </p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cc-app-btn cc-app-btn--ghost !h-9 inline-flex"
            >
              Open external paper
            </a>
          </div>
        ) : (
          <p className="text-[14px] text-[var(--app-smoke)]">No PDF added</p>
        )}
        <p className="rounded-lg border border-dashed border-[var(--app-border)] bg-[var(--app-mist)] px-3 py-2 text-[13px] text-[var(--app-smoke)]">
          CodeCard-hosted PDF uploads are unavailable. Use an external HTTPS paper URL in the form
          above.
        </p>
      </div>

      <ResearchFigureManager researchPaperId={researchPaperId} initialFigures={figures} />
    </section>
  );
}
