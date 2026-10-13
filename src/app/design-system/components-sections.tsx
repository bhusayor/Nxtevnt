import { ArrowRight, MoreHorizontal, Plus, Save } from "@/components/ui/icons";

import { DesignSystemSection, ShowcasePanel } from "@/components/nextevnt/design-system-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateInput, TimeInput } from "@/components/ui/date-time-input";
import { FileUploader } from "@/components/ui/file-uploader";
import { FormSection } from "@/components/ui/form-section";
import { AutosaveStatus, UnsavedChangesIndicator } from "@/components/ui/form-status";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { RadioGroup } from "@/components/ui/radio-group";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { StatusBadge, type ProductStatus } from "@/components/ui/status-badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip } from "@/components/ui/tooltip";

const selectOptions = [{ label: "Wedding", value: "wedding" }, { label: "Corporate event", value: "corporate" }, { label: "Private celebration", value: "private" }, { label: "Other", value: "other" }];

function StatusGroup({ label, statuses }: { label: string; statuses: ProductStatus[] }) {
  return <div className="grid gap-3 border-b border-border-subtle px-4 py-4 last:border-b-0 sm:grid-cols-[7rem_1fr] sm:items-center"><p className="text-xs font-semibold text-text-secondary">{label}</p><div className="flex flex-wrap gap-2">{statuses.map((status) => <StatusBadge key={status} status={status} />)}</div></div>;
}

export function ComponentsSections() {
  return (
    <>
      <DesignSystemSection id="buttons" eyebrow="07 · Components" title="Buttons" description="A compact action hierarchy with clear state changes, flexible icon placement, and consistent focus behavior.">
        <div className="grid gap-4">
          <ShowcasePanel title="Variants" description="Outline is the default secondary action. Soft is reserved for warm contextual emphasis."><div className="flex flex-wrap items-center gap-3"><Button>Primary</Button><Button variant="secondary">Secondary / outline</Button><Button variant="ghost">Ghost</Button><Button variant="soft">Soft</Button><Button variant="destructive">Destructive</Button></div></ShowcasePanel>
          <ShowcasePanel title="Sizing matrix" description="Visible heights follow a 4–8px grid. On coarse-pointer devices, compact controls preserve a minimum 44px touch target."><div className="flex flex-wrap items-end gap-3"><Button size="xs">Extra small · 28</Button><Button size="sm">Small · 32</Button><Button size="md">Medium · 40</Button><Button size="lg">Large · 48</Button><Button size="xl">Extra large · 56</Button></div></ShowcasePanel>
          <div className="grid gap-4 lg:grid-cols-2"><ShowcasePanel title="Icons and compact actions"><div className="flex flex-wrap items-center gap-3"><Button leadingIcon={<Plus className="size-4" />}>Create event</Button><Button variant="outline" trailingIcon={<ArrowRight className="size-4" />}>Continue</Button><Button size="sm" variant="ghost">Compact action</Button><Tooltip content="More actions"><IconButton aria-label="More actions" variant="outline" icon={<MoreHorizontal className="size-4" />} /></Tooltip></div></ShowcasePanel><ShowcasePanel title="Full-width action"><Button fullWidth leadingIcon={<Save className="size-4" />}>Save changes</Button></ShowcasePanel></div>
          <ShowcasePanel title="Interaction states" description="Hover, focus, pressed, loading, and disabled states keep the action hierarchy intact."><div className="flex flex-wrap items-center gap-3"><Button>Default</Button><Button className="bg-brand-primary-hover">Hover preview</Button><Button className="ring-[3px] ring-brand-primary/20 ring-offset-2">Focus preview</Button><Button className="translate-y-px bg-brand-primary-active">Pressed preview</Button><Button loading>Saving</Button><Button disabled>Disabled</Button></div></ShowcasePanel>
        </div>
      </DesignSystemSection>

      <DesignSystemSection id="forms" eyebrow="08 · Components" title="Forms" description="Forms communicate priority and progress clearly while protecting the planner from ambiguous validation or lost work.">
        <div className="grid gap-6">
          <FormSection title="Core event information" description="A reusable section groups related fields without turning the page into one large form." actions={<AutosaveStatus state="saved" />}>
            <div className="grid gap-5 md:grid-cols-2"><Input label="Event name" placeholder="e.g. Ada & Chidi’s Celebration" helperText="Use the name your team will recognize." required /><Select label="Event type" placeholder="Choose event type" options={selectOptions} required /><Input label="Client reference" defaultValue="Ada Okafor" success="Client record found." optional /><Input label="Public subtitle" placeholder="An intimate garden celebration" recommended helperText="Helps make the event easier to identify." /></div>
          </FormSection>

          <div className="grid gap-4 xl:grid-cols-2"><ShowcasePanel title="Search and secure entry"><div className="grid gap-5"><div><p className="type-label mb-2">Search events</p><SearchInput placeholder="Search by event, client, or location" /></div><PasswordInput defaultValue="Nxtevnt9" helperText="Use a password unique to Nxtevnt." required /></div></ShowcasePanel><ShowcasePanel title="Money and contact"><div className="grid gap-5"><CurrencyInput label="Estimated budget" defaultValue="18,500,000" helperText="Amounts are shown in your workspace currency." /><PhoneInput label="Client phone" placeholder="801 234 5678" helperText="Include the number used for event communication." /><PhoneInput label="Alternate phone" defaultValue="80" error="Enter a complete phone number." /></div></ShowcasePanel></div>

          <div className="grid gap-4 xl:grid-cols-2"><ShowcasePanel title="Date and time"><div className="grid gap-5 sm:grid-cols-2"><DateInput label="Event date" defaultValue="2026-12-18" required /><TimeInput label="Guest arrival" defaultValue="16:30" /><DateInput label="Unavailable date" disabled /><TimeInput label="Vendor call time" defaultValue="10:00" success="No availability conflict." /></div></ShowcasePanel><ShowcasePanel title="Files"><FileUploader label="Event cover image" description="PNG or JPG · 1600 × 1000 recommended · max 5 MB" /></ShowcasePanel></div>

          <div className="grid gap-4 xl:grid-cols-2"><ShowcasePanel title="Long-form and choice fields"><div className="grid gap-6"><Textarea label="Planning notes" placeholder="Add details the team should know…" recommended helperText="Recommended for smoother handoffs." /><RadioGroup label="Preferred client contact" defaultValue="email" options={[{ value: "email", label: "Email", description: "Best for detailed updates" }, { value: "phone", label: "Phone", description: "Best for urgent updates" }]} /></div></ShowcasePanel><ShowcasePanel title="Selections and settings"><div className="grid gap-6"><Checkbox label="Send client reminders" description="Notify the client before key milestones." defaultChecked /><Checkbox label="Terms accepted" error="You must accept the terms to continue." required /><Switch label="Allow booking requests" description="New clients can ask about this date." defaultChecked /><Switch label="Managed by workspace owner" disabled defaultChecked /></div></ShowcasePanel></div>

          <ShowcasePanel title="Save and change indicators" description="Status stays close to the work without interrupting it."><div className="flex flex-wrap items-center gap-x-6 gap-y-3"><AutosaveStatus state="saving" /><AutosaveStatus state="saved" /><AutosaveStatus state="failed" /><UnsavedChangesIndicator /><UnsavedChangesIndicator unsaved={false} /><Badge tone="brand">Recommended</Badge><Badge>Optional</Badge><span className="type-label"><span className="text-error">*</span> Required</span></div></ShowcasePanel>
        </div>
      </DesignSystemSection>

      <DesignSystemSection id="status" eyebrow="09 · Components" title="Product status language" description="A restrained semantic system keeps Events, Payments, Requests, Verification, and Tasks understandable without visual noise.">
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface"><StatusGroup label="Event" statuses={["upcoming", "completed", "prospect", "draft", "cancelled"]} /><StatusGroup label="Payment" statuses={["paid", "pending", "overdue", "partially-paid"]} /><StatusGroup label="Request" statuses={["pending", "viewed", "responded", "accepted", "declined", "expired"]} /><StatusGroup label="Verification" statuses={["verified", "unverified", "pending-verification", "action-required"]} /><StatusGroup label="Task" statuses={["to-do", "in-progress", "blocked", "completed"]} /></div>
      </DesignSystemSection>
    </>
  );
}
