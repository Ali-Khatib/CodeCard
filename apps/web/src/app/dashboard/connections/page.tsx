export default function ConnectionsPage() {
  const connections = ['Met at DevConf', 'Recruiter intro', 'Mentor coffee chat'];

  return (
    <div className="space-y-4">
      <div>
        <p className="font-eyebrow text-[12px] uppercase tracking-[0.08em] text-graphite">Connections</p>
        <h1 className="mt-2 font-display text-[28px] font-medium text-phosphor">Saved connections</h1>
        <p className="mt-2 max-w-lg text-[15px] text-lichen">
          Private notes and context for people you meet — only visible to you.
        </p>
      </div>

      <div className="space-y-3">
        {connections.map((note) => (
          <div
            key={note}
            className="cc-workspace-tile flex items-center justify-between rounded-[10px] border border-border/40 px-4 py-3"
          >
            <span className="text-[15px] text-phosphor">{note}</span>
            <span className="text-[12px] text-graphite">Private note</span>
          </div>
        ))}
      </div>

      <p className="text-[14px] text-graphite">
        Full connection management ships with the mobile companion app.
      </p>
    </div>
  );
}
