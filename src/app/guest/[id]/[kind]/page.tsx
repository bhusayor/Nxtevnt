import { GuestPublicForm } from "@/components/planner/guest-public-form";

export default async function GuestFormPage({ params }: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await params;
  return <GuestPublicForm id={id} kind={kind === "collect" ? "collect" : "rsvp"} />;
}
