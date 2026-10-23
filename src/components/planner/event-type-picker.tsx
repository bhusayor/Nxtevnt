import { BriefcaseBusiness, Check, Heart, LayoutGrid, Music2 } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

const eventTypes = [
  { label: "Wedding", value: "Wedding", icon: Heart, tone: "text-[#087b56] bg-[#ecfdf5]", selected: "border-[#10b981] bg-[#f0fdf7]" },
  { label: "Corporate", value: "Corporate", icon: BriefcaseBusiness, tone: "text-[#087ca8] bg-[#eaf8ff]", selected: "border-[#2dbcf0] bg-[#f1fbff]" },
  { label: "Party", value: "Party", icon: Music2, tone: "text-[#ad4d0c] bg-[#fff2e7]", selected: "border-[#ff8b2d] bg-[#fff7f0]" },
  { label: "Other", value: "Other event", icon: LayoutGrid, tone: "text-[#596172] bg-[#f1f2f5]", selected: "border-[#9ca3af] bg-[#f7f8fa]" },
] as const;

export function EventTypePicker({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  return (
    <fieldset aria-describedby={error ? "event-type-error" : undefined}>
      <legend className="mb-2 text-sm font-medium text-text-primary">Event type <span className="text-error" aria-label="required">*</span></legend>
      <div className="grid grid-cols-2 gap-3 @min-[480px]/event-form:grid-cols-4">
        {eventTypes.map(({ label, value: choice, icon: Icon, tone, selected }, index) => (
          <label key={choice} className="relative cursor-pointer">
            <input
              id={index === 0 ? "event-type" : `event-type-${index}`}
              type="radio"
              name="event-type"
              value={choice}
              checked={value === choice}
              onChange={() => onChange(choice)}
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "event-type-error" : undefined}
              className="peer sr-only"
            />
            <span className={cn("flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-primary", value === choice ? selected : "border-border-subtle bg-white hover:border-border-strong hover:bg-background-subtle", error && value !== choice && "border-error/50")}>
              <span className={cn("flex size-9 items-center justify-center rounded-full", tone)}><Icon className="size-5" aria-hidden="true" /></span>
              {label}
              {value === choice && <Check className="absolute right-2.5 top-2.5 size-3.5 text-text-primary" aria-hidden="true" />}
            </span>
          </label>
        ))}
      </div>
      {error && <p id="event-type-error" role="alert" className="mt-2 text-xs text-error">{error}</p>}
    </fieldset>
  );
}
