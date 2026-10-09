type AuthFormHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function AuthFormHeader({ eyebrow, title, description }: AuthFormHeaderProps) {
  return (
    <header className="space-y-2">
      {eyebrow ? <p className="type-caption text-brand-primary">{eyebrow}</p> : null}
      <h1 className="type-heading-2 text-text-primary sm:text-[2rem]">{title}</h1>
      <p className="type-body max-w-md text-text-secondary">{description}</p>
    </header>
  );
}
