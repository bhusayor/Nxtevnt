import { CalendarPlus, MoreHorizontal, Plus } from "lucide-react";

import { EventsFilterDemo } from "@/app/design-system/events-filter-demo";
import { EventsTableDemo } from "@/app/design-system/events-table-demo";
import { DesignSystemSection, ShowcasePanel } from "@/components/nextevnt/design-system-section";
import { DashboardActionCard, EventCard, PlannerProfileCard, SummaryMetricGroup, TemplateCard, VendorCard } from "@/components/nextevnt/product-cards";
import { DashboardSectionSkeleton, EventCardSkeleton, FormSkeleton, ImageSkeleton, TableSkeleton, VendorCardSkeleton } from "@/components/nextevnt/loading-patterns";
import { DesktopSidebar, MobileBottomNavigation, PageHeader, SettingsSubNavigation, Tabs, TopNavigation } from "@/components/nextevnt/navigation";
import { Button } from "@/components/ui/button";
import { CardMedia } from "@/components/ui/card-media";
import { ConfirmationDialog, UnsavedChangesPrompt } from "@/components/ui/confirmation-dialog";
import { AutosaveStatus } from "@/components/ui/form-status";
import { DraftRestoredMessage, EmptyState, ErrorState, InlineFeedback, OfflineState, SuccessState, Toast } from "@/components/ui/feedback";
import { IconButton } from "@/components/ui/icon-button";

export function PatternsSections() {
  return (
    <>
      <DesignSystemSection id="tables" eyebrow="10 · Patterns" title="Table system" description="A composable presentation layer handles dense desktop data and turns the same records into useful cards on smaller screens.">
        <div className="grid gap-6"><div><div className="flex items-center justify-between gap-4 rounded-t-[var(--radius-lg)] border border-b-0 border-border-default bg-surface px-4 py-3"><div><p className="text-sm font-semibold text-text-primary">All events</p><p className="mt-0.5 text-xs text-text-tertiary">6 events across your workspace</p></div><Button size="sm" leadingIcon={<Plus className="size-4" />}>Create event</Button></div><EventsTableDemo /></div><div className="grid gap-4 xl:grid-cols-2"><ShowcasePanel title="Loading table"><TableSkeleton rows={3} /></ShowcasePanel><ShowcasePanel title="Empty table"><EmptyState /></ShowcasePanel><ShowcasePanel title="Filtered-empty table" className="xl:col-span-2"><EmptyState filtered /></ShowcasePanel></div></div>
      </DesignSystemSection>

      <DesignSystemSection id="filters" eyebrow="11 · Patterns" title="Search, filters, and views" description="Filtering stays quiet until needed while active criteria remain visible and easy to clear.">
        <EventsFilterDemo />
      </DesignSystemSection>

      <DesignSystemSection id="cards" eyebrow="12 · Patterns" title="Product cards" description="Media-aware cards support distinct product jobs while sharing consistent hierarchy, image treatment, and action placement.">
        <div className="grid gap-7">
          <div><p className="type-caption mb-3 text-text-tertiary">Event and vendor</p><div className="grid max-w-5xl gap-5 lg:grid-cols-2"><EventCard /><VendorCard /></div></div>
          <div><p className="type-caption mb-3 text-text-tertiary">Template and planner profile</p><div className="grid max-w-5xl items-start gap-5 lg:grid-cols-2"><TemplateCard /><PlannerProfileCard /></div></div>
          <div><p className="type-caption mb-3 text-text-tertiary">Dashboard actions</p><div className="grid gap-3 md:grid-cols-3"><DashboardActionCard /><DashboardActionCard index={1} /><DashboardActionCard index={2} /></div></div>
          <div><p className="type-caption mb-3 text-text-tertiary">Summary metric group</p><SummaryMetricGroup /></div>
          <div><p className="type-caption mb-3 text-text-tertiary">Image states</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><ShowcasePanel title="Missing image" className="overflow-hidden p-0"><CardMedia alt="Event image unavailable" /><div className="p-4"><p className="type-body-small text-text-secondary">Fallback preserves the card ratio and hierarchy.</p></div></ShowcasePanel><ShowcasePanel title="Loading image" className="overflow-hidden p-0"><CardMedia alt="Loading event image" loading /><div className="p-4"><p className="type-body-small text-text-secondary">Skeleton matches the final media footprint.</p></div></ShowcasePanel><ShowcasePanel title="Graceful crop" className="overflow-hidden p-0"><CardMedia src="/images/design-system/event-garden-reception.png" alt="Garden reception" /><div className="p-4"><p className="type-body-small text-text-secondary">Consistent 16:10 ratio with object-fit cover.</p></div></ShowcasePanel></div></div>
        </div>
      </DesignSystemSection>

      <DesignSystemSection id="feedback" eyebrow="13 · Patterns" title="Feedback and recovery" description="Feedback distinguishes lightweight confirmation from states that need explanation, recovery, or explicit consent.">
        <div className="grid gap-8">
          <div><p className="type-caption mb-3 text-text-tertiary">Featured toast</p><div className="flex min-h-52 items-end justify-end border border-border-subtle bg-surface-subtle p-5 sm:p-7"><Toast tone="success" title="New vendor quote received" meta="Just now" action={<Button variant="ghost" size="sm">Review quote</Button>}>Maison Bloom sent a quote of ₦720,000 for Ada & Chidi’s Celebration.</Toast></div></div>
          <div><p className="type-caption mb-3 text-text-tertiary">Toast variants</p><div className="grid gap-3 lg:grid-cols-2"><Toast tone="success" title="Changes saved" meta="Now">Your event details are up to date.</Toast><Toast tone="warning" title="Payment due soon" meta="3 days">The venue deposit needs your attention.</Toast><Toast tone="error" title="Could not save event">Check your connection and try again.</Toast><Toast tone="info" title="Draft restored">We restored the details from your last session.</Toast></div></div>
          <ShowcasePanel title="Inline feedback"><div className="grid gap-3 sm:grid-cols-2"><InlineFeedback tone="success">Client email verified</InlineFeedback><InlineFeedback tone="warning">Complete pricing to strengthen your profile</InlineFeedback><InlineFeedback tone="error">Budget must be greater than zero</InlineFeedback><InlineFeedback tone="info">This change is visible to your team</InlineFeedback></div></ShowcasePanel>
          <div><p className="type-caption mb-3 text-text-tertiary">Draft and save state</p><div className="grid gap-3"><DraftRestoredMessage /><ShowcasePanel><div className="flex flex-wrap items-center gap-6"><AutosaveStatus state="saving" /><AutosaveStatus state="saved" /><AutosaveStatus state="failed" /></div></ShowcasePanel></div></div>
          <div><p className="type-caption mb-3 text-text-tertiary">Empty, error, success, and offline</p><div className="grid gap-4 md:grid-cols-2"><EmptyState /><ErrorState /><SuccessState /><OfflineState /></div></div>
          <ShowcasePanel title="Confirmation and unsaved changes" description="Both examples use accessible modal focus management and explicit action language."><div className="flex flex-wrap gap-3"><ConfirmationDialog trigger={<Button variant="outline">Open confirmation</Button>} title="Remove this vendor?" description="Maison Bloom will be removed from My Vendors. Existing event records will remain unchanged." confirmLabel="Remove vendor" destructive /><UnsavedChangesPrompt trigger={<Button variant="outline">Preview unsaved prompt</Button>} /></div></ShowcasePanel>
        </div>
      </DesignSystemSection>

      <DesignSystemSection id="loading" eyebrow="14 · Patterns" title="Loading system" description="Content-shaped skeletons preserve context and layout. Small progress indicators are reserved for local actions such as saving.">
        <div className="grid gap-6"><ShowcasePanel title="Table skeleton"><TableSkeleton rows={3} /></ShowcasePanel><div className="grid gap-4 lg:grid-cols-2"><ShowcasePanel title="Event card skeleton"><EventCardSkeleton /></ShowcasePanel><ShowcasePanel title="Vendor card skeleton"><VendorCardSkeleton /></ShowcasePanel></div><ShowcasePanel title="Dashboard section skeleton"><DashboardSectionSkeleton /></ShowcasePanel><div className="grid gap-4 lg:grid-cols-2"><ShowcasePanel title="Form skeleton"><FormSkeleton /></ShowcasePanel><ShowcasePanel title="Image and inline loading"><ImageSkeleton /><div className="mt-5 flex flex-wrap items-center gap-4"><Button loading>Saving event</Button><AutosaveStatus state="saving" /></div></ShowcasePanel></div></div>
      </DesignSystemSection>

      <DesignSystemSection id="navigation" eyebrow="15 · Patterns" title="Navigation system" description="Workspace navigation keeps daily work primary, account controls predictable, and smaller screens focused on four essential destinations.">
        <div className="grid gap-8">
          <div><p className="type-caption mb-3 text-text-tertiary">Expanded, hover preview, and collapsed sidebar</p><div className="flex gap-4 overflow-x-auto border border-border-subtle bg-background-subtle p-4"><DesktopSidebar previewHover /><DesktopSidebar collapsed /></div></div>
          <div><p className="type-caption mb-3 text-text-tertiary">Top navigation</p><TopNavigation /></div>
          <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]"><div><p className="type-caption mb-3 text-text-tertiary">Mobile bottom navigation</p><div className="max-w-md rounded-[var(--radius-lg)] bg-background-subtle p-4"><MobileBottomNavigation /></div></div><div><p className="type-caption mb-3 text-text-tertiary">Settings sub-navigation</p><ShowcasePanel><SettingsSubNavigation /></ShowcasePanel></div></div>
          <div><p className="type-caption mb-3 text-text-tertiary">Page header, breadcrumbs, and tabs</p><ShowcasePanel><div className="grid gap-7"><PageHeader title="Events" description="Plan, find, and keep every event moving." breadcrumbs={["Workspace", "Events"]} secondaryActions={<IconButton aria-label="More page actions" variant="outline" icon={<MoreHorizontal className="size-4" />} />} primaryAction={<Button leadingIcon={<CalendarPlus className="size-4" />}>Create event</Button>} /><Tabs items={["All events", "Upcoming", "Completed", "Prospects"]} active="All events" /></div></ShowcasePanel></div>
        </div>
      </DesignSystemSection>
    </>
  );
}
