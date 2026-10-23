import { DesignSystemSection, ShowcasePanel } from "@/components/nextevnt/design-system-section";
import { BrandLogo } from "@/components/nextevnt/brand-logo";
import { TokenSwatch } from "@/components/nextevnt/token-swatch";
import { Divider } from "@/components/ui/divider";

const colors = [
  { name: "Primary", token: "--brand-primary", value: "#254E3F", dark: true }, { name: "Primary hover", token: "--brand-primary-hover", value: "#1F4437", dark: true }, { name: "Primary active", token: "--brand-primary-active", value: "#19392F", dark: true },
  { name: "Secondary", token: "--brand-secondary", value: "#F3E8DB" }, { name: "Secondary hover", token: "--brand-secondary-hover", value: "#EADCCB" }, { name: "Secondary active", token: "--brand-secondary-active", value: "#E2D0BB" },
  { name: "Background", token: "--background", value: "#FAFAFA" }, { name: "Surface", token: "--surface", value: "#FFFFFF" }, { name: "Selected", token: "--surface-selected", value: "#EDF3F0" },
  { name: "Text primary", token: "--text-primary", value: "#1C2924", dark: true }, { name: "Text secondary", token: "--text-secondary", value: "#52615B", dark: true }, { name: "Border", token: "--border-default", value: "#D5DAD7" },
  { name: "Success", token: "--success", value: "#2F6B4F", dark: true }, { name: "Warning", token: "--warning", value: "#8A5A12", dark: true }, { name: "Error", token: "--error", value: "#A63F3F", dark: true }, { name: "Info", token: "--info", value: "#315F78", dark: true },
] as const;

const typography = [
  ["Display", "type-display", "Plan beautifully. Deliver confidently."], ["Heading 1", "type-heading-1", "Everything that needs your attention"], ["Heading 2", "type-heading-2", "Upcoming celebrations"], ["Heading 3", "type-heading-3", "Vendor recommendations"], ["Heading 4", "type-heading-4", "Payment schedule"],
  ["Body large", "type-body-large", "A calm workspace for planning remarkable events."], ["Body", "type-body", "Keep timelines, budgets, people, and decisions moving together."], ["Body small", "type-body-small", "Last updated a few moments ago"], ["Label large", "type-label-large", "Business information"], ["Label", "type-label", "Event location"], ["Label small", "type-label-small", "Optional"], ["Caption", "type-caption", "Workspace"],
] as const;

export function FoundationsSections() {
  const spaces = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64];
  const radii = [["xs", "4px", "var(--radius-xs)"], ["sm", "6px", "var(--radius-sm)"], ["md", "8px", "var(--radius-md)"], ["lg", "12px", "var(--radius-lg)"], ["xl", "16px", "var(--radius-xl)"], ["full", "Full", "var(--radius-full)"]] as const;

  return (
    <>
      <DesignSystemSection id="brand" eyebrow="01 · Foundations" title="Calm tools for ambitious planners" description="NXTEVNT balances professional clarity with a warm, human presence. The system uses spacious layouts, restrained surfaces, and decisive green actions.">
        <div className="overflow-hidden rounded-[var(--radius-xl)] bg-brand-primary-active shadow-[var(--shadow-md)]"><div className="grid min-h-[26rem] items-end gap-10 px-6 py-8 sm:px-10 sm:py-12 lg:grid-cols-[1.3fr_0.7fr] lg:px-14"><div className="max-w-2xl"><div className="mb-10 w-32 overflow-hidden rounded-[var(--radius-lg)] bg-white"><BrandLogo priority /></div><p className="type-caption mb-4 text-[#d9c7b2]">NXTEVNT foundations</p><h1 className="type-display max-w-xl text-text-inverse">Serious event work, made beautifully manageable.</h1><p className="type-body-large mt-5 max-w-xl text-white/66">Built for focus, trust, and confident decisions—without the visual noise of a generic dashboard.</p></div><div className="grid gap-3 self-end rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm"><div className="flex items-center justify-between gap-4"><span className="type-label text-white/70">Visual character</span></div><Divider className="bg-white/10" /><p className="type-body text-white/85">Premium · warm · modern · spacious · trustworthy</p></div></div></div>
      </DesignSystemSection>

      <DesignSystemSection id="colors" eyebrow="02 · Foundations" title="Semantic color" description="Components consume purpose-led aliases, keeping brand and feedback colors consistent as the product expands."><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{colors.map((color) => <TokenSwatch key={color.token} {...color} />)}</div></DesignSystemSection>

      <DesignSystemSection id="typography" eyebrow="03 · Foundations" title="Typography" description="DM Sans provides a clear, contemporary voice. The scale stays compact enough for information-rich productivity screens."><ShowcasePanel><div>{typography.map(([name, className, sample]) => <div key={name} className="grid gap-3 border-b border-border-subtle py-5 first:pt-0 last:border-b-0 last:pb-0 md:grid-cols-[8rem_1fr] md:items-baseline"><span className="type-caption text-text-tertiary">{name}</span><p className={className}>{sample}</p></div>)}</div></ShowcasePanel></DesignSystemSection>

      <DesignSystemSection id="spacing" eyebrow="04 · Foundations" title="Spacing" description="A 4px-based scale creates consistent density across controls, sections, and responsive layouts."><ShowcasePanel><div className="grid gap-3">{spaces.map((space) => <div key={space} className="grid grid-cols-[3rem_1fr] items-center gap-4"><span className="type-label-small text-text-tertiary">{space}px</span><div className="h-3 rounded-[var(--radius-xs)] bg-brand-secondary" style={{ width: `${space * 2}px` }} /></div>)}</div></ShowcasePanel></DesignSystemSection>

      <DesignSystemSection id="radius" eyebrow="05 · Foundations" title="Radius" description="Corners feel approachable but restrained. Pills are reserved for compact statuses rather than entire interfaces."><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{radii.map(([name, value, radius]) => <ShowcasePanel key={name} className="p-4"><div className="mb-4 aspect-square border border-border-default bg-surface-selected" style={{ borderRadius: radius }} /><p className="type-label">{name}</p><p className="type-body-small text-text-tertiary">{value}</p></ShowcasePanel>)}</div></DesignSystemSection>

      <DesignSystemSection id="shadows" eyebrow="06 · Foundations" title="Shadows" description="Elevation is subtle and secondary to surface color and borders. Larger shadows are reserved for floating layers."><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{["xs", "sm", "md", "lg"].map((shadow) => <div key={shadow} className="flex h-32 items-end rounded-[var(--radius-lg)] bg-surface p-5" style={{ boxShadow: `var(--shadow-${shadow})` }}><div><p className="type-label">Shadow {shadow}</p><code className="text-xs text-text-tertiary">--shadow-{shadow}</code></div></div>)}</div></DesignSystemSection>
    </>
  );
}
