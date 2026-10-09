import type { Metadata } from "next";
import { QuestionnaireSettings } from "@/components/planner/questionnaire-settings";

export const metadata: Metadata = { title: "Questionnaire templates" };

export default function QuestionnaireSettingsPage() {
  return <QuestionnaireSettings />;
}
