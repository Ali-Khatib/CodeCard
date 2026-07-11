import { ProjectCreateForm } from '@/components/dashboard/project-create-form';

export default function NewProjectPage() {
  return (
    <div className="cc-container cc-content py-8 md:py-12">
      <div className="mb-8 max-w-[720px]">
        <p className="font-eyebrow text-[10px] uppercase tracking-[0.18em] text-lavender/80">
          New project
        </p>
        <h1 className="mt-3 text-[28px] font-medium tracking-[-0.03em] text-[var(--app-ink)] md:text-[36px]">
          Create a project card
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ash">
          Start with the basics, then add up to six optional showcase extras — short text or photos for
          the cinematic header. Your full description, tech stack, and screenshots stay below.
        </p>
      </div>
      <ProjectCreateForm />
    </div>
  );
}
