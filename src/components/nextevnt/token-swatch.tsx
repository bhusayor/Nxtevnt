type TokenSwatchProps = {
  name: string;
  token: string;
  value: string;
  dark?: boolean;
};

export function TokenSwatch({ name, token, value, dark }: TokenSwatchProps) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-border-subtle bg-surface shadow-[var(--shadow-xs)]">
      <div className="h-20 border-b border-black/5" style={{ background: `var(${token})` }} />
      <div className="grid gap-1 px-3.5 py-3">
        <p className="type-label-small text-text-primary">{name}</p>
        <code className="text-[0.6875rem] text-text-tertiary">{token}</code>
        <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-text-secondary">{value}</p>
        {dark ? <span className="sr-only">Dark color swatch</span> : null}
      </div>
    </div>
  );
}
