import type { Metadata } from "next";

import { CreateEventForm } from "@/components/planner/create-event-form";

export const metadata: Metadata = {
  title: "Create event",
  description: "Start planning a new event in two simple steps.",
};

export default function CreateEventPage() {
  return <CreateEventForm />;
}
