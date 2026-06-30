type SectionCounterProps = {
  index: string;
  total?: string;
  label?: string;
};

export function SectionCounter({ index, total, label }: SectionCounterProps) {
  const text = label ? `${label}` : `${index}${total ? ` / ${total}` : ''}`;
  return (
    <p className="font-eyebrow text-[12px] font-normal uppercase leading-[0.9] tracking-[0.06em] text-iris">
      {text}
    </p>
  );
}
