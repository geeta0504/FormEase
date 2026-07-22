function Seal({ label, tone = "primary" }) {
  const toneClasses = {
    primary: "border-primary text-primary",
    secondary: "border-secondary text-secondary",
    neutral: "border-neutral text-neutral",
  };

  return (
    <span
      className={`inline-flex items-center justify-center px-3 py-1 rounded-full border-2 border-dashed font-display text-[11px] uppercase tracking-[0.15em] -rotate-2 ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}

export default Seal;