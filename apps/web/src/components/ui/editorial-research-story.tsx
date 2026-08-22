'use client';

export type EditorialResearchBeat = {
  id: string;
  index: string;
  marker: string;
  /** Full phrase for screen readers */
  problemTitle: string;
  problemLead: string;
  problemSub: string;
  researchBody: string;
  solutionBody: string;
};

type StoryPhase = 'problem' | 'research' | 'solution';

const PHASE_LABEL: Record<StoryPhase, string> = {
  problem: 'The problem',
  research: 'The research',
  solution: 'The solution',
};

function CodeCardSolutionCopy({ text }: { text: string }) {
  const parts = text.split(/(CodeCard)/g);
  return (
    <p className="cc-ed-research-story__body" data-research-reveal>
      {parts.map((part, i) =>
        part === 'CodeCard' ? (
          <span key={i} className="cc-ed-research-story__brand">
            CodeCard
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

function StoryPhaseBlock({
  beat,
  phase,
}: {
  beat: EditorialResearchBeat;
  phase: StoryPhase;
}) {
  const isSolution = phase === 'solution';

  return (
    <article
      className={
        isSolution
          ? 'cc-ed-research-story__slide cc-ed-research-story__slide--solution'
          : 'cc-ed-research-story__slide'
      }
      data-testid={`editorial-proof-box-${beat.id}-${phase}`}
      aria-label={`${PHASE_LABEL[phase]}: ${beat.marker}`}
    >
      <div className="cc-ed-research-story__panel">
        <p className="cc-ed-research-story__eyebrow" data-research-reveal>
          {PHASE_LABEL[phase]}
        </p>
        <p className="cc-ed-research-story__marker" data-research-reveal>
          {beat.index} · {beat.marker}
        </p>

        {phase === 'problem' ? (
          <h3
            className="cc-ed-research-story__headline-stack"
            data-research-reveal
            aria-label={beat.problemTitle}
          >
            <span className="cc-ed-research-story__headline-line">
              {beat.problemLead}
            </span>
            <span className="cc-ed-research-story__headline-line cc-ed-research-story__headline-line--accent">
              {beat.problemSub}
            </span>
          </h3>
        ) : null}

        {phase === 'research' ? (
          <>
            <h3
              className="cc-ed-research-story__headline cc-ed-research-story__headline--research"
              data-research-reveal
            >
              {beat.marker}
            </h3>
            <p className="cc-ed-research-story__body" data-research-reveal>
              {beat.researchBody}
            </p>
          </>
        ) : null}

        {phase === 'solution' ? (
          <>
            <p className="cc-ed-research-story__solution-kicker" data-research-reveal>
              The answer
            </p>
            <CodeCardSolutionCopy text={beat.solutionBody} />
          </>
        ) : null}
      </div>
    </article>
  );
}

export function EditorialResearchStory({ beats }: { beats: EditorialResearchBeat[] }) {
  return (
    <div className="cc-ed-research-story" data-testid="editorial-research-story">
      {beats.map((beat) => (
        <section
          key={beat.id}
          className="cc-ed-research-story__beat"
          aria-label={`${beat.index} ${beat.marker}`}
        >
          <span className="cc-ed-research-story__bg-index" aria-hidden>
            {beat.index}
          </span>
          <StoryPhaseBlock beat={beat} phase="problem" />
          <StoryPhaseBlock beat={beat} phase="research" />
          <StoryPhaseBlock beat={beat} phase="solution" />
        </section>
      ))}
    </div>
  );
}
