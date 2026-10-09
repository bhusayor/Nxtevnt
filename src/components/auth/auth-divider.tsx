export function AuthDivider() {
  return (
    <div className="flex items-center gap-3" role="separator" aria-label="Or continue with">
      <span className="h-px flex-1 bg-border-subtle" />
      <span className="type-label-small text-text-tertiary">OR CONTINUE WITH</span>
      <span className="h-px flex-1 bg-border-subtle" />
    </div>
  );
}
