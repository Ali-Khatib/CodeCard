'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectBannerEditor } from '@/components/dashboard/project-banner-editor';
import { finalizeResearchCoverUploadAction } from '@/lib/research/research-cover-actions';
import { executeResearchCoverUploadFlow } from '@/lib/research/research-cover-upload-client';
import { PROJECT_BANNER_LIMITS, PROJECT_BANNER_PRESETS } from '@/lib/projects/project-banner';

const paperPreset = PROJECT_BANNER_PRESETS.find((preset) => preset.id === 'paper')!;

function defaultSubtitle(venue: string | null, publicationStatus: string | null): string {
  return [venue, publicationStatus]
    .filter(Boolean)
    .join(' · ')
    .slice(0, PROJECT_BANNER_LIMITS.subtitle);
}

export function ResearchBannerUpload({
  researchPaperId,
  title,
  venue,
  publicationStatus,
  coverUrl,
}: {
  researchPaperId: string;
  title: string;
  venue: string | null;
  publicationStatus: string | null;
  coverUrl: string | null;
}) {
  const router = useRouter();
  const [savedUrl, setSavedUrl] = useState(coverUrl);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[15px] font-semibold text-[var(--app-ink)]">Banner</h3>
        <p className="mt-1 text-[13px] text-[var(--app-smoke)]">
          The label sits on the left. The title and line stay centered, even when the title wraps.
        </p>
      </div>
      <ProjectBannerEditor
        defaultEyebrow="Research"
        defaultTitle={title}
        defaultSubtitle={defaultSubtitle(venue, publicationStatus)}
        initialAccent={paperPreset.accent}
        initialBackground={paperPreset.background}
        initialBackgroundBottom={paperPreset.backgroundBottom}
        onSave={async (file) => {
          setMessage(null);
          const result = await executeResearchCoverUploadFlow({
            researchPaperId,
            file,
            finalize: finalizeResearchCoverUploadAction,
          });
          if (!result.ok) {
            throw new Error(result.message);
          }
          setSavedUrl(result.coverImageUrl);
          setMessage('Banner saved.');
          router.refresh();
        }}
      />
      {savedUrl ? (
        <div className="relative aspect-[4/1] w-full max-w-[40rem] overflow-hidden rounded-2xl border border-[var(--app-line)] bg-[#141311]">
          <Image src={savedUrl} alt="Current research banner" fill className="object-contain" sizes="640px" unoptimized={savedUrl.startsWith('blob:')} />
        </div>
      ) : null}
      {message ? <p className="text-[13px] text-[var(--app-smoke)]">{message}</p> : null}
    </div>
  );
}
