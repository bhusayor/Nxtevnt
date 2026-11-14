export type GuestRsvp = "pending" | "coming" | "not-coming" | "maybe";

export type EventGuest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  group: string;
  tags: string[];
  priority?: boolean;
  rsvp: GuestRsvp;
  invitedAt?: string;
  invitationFailedAt?: string;
  responseAt?: string;
  responseChannel?: "Email" | "WhatsApp" | "Phone" | "In person" | "Collector";
  adults: number;
  children: number;
  dietary: string;
  tableId?: string;
  ceremonyTableId?: string;
  checkedInAt?: string;
  walkIn?: boolean;
  gateCodeSentAt?: string;
};

export type GuestTable = { id: string; name: string; capacity: number; space: "Reception" | "Ceremony"; color: string; position?: { x: number; y: number } };
export type GuestQuestion = { id: string; sectionId?: string; label: string; type: "Short answer" | "Long answer" | "Yes or no"; required: boolean };
export type GuestCollectorSection = { id: string; title: string };
export type GuestCollectorResponse = {
  id: string;
  name: string;
  phone: string;
  email: string;
  adults: number;
  children: number;
  answers: string;
  receivedAt: string;
  status: "new" | "added" | "skipped";
  guestId?: string;
};
export type RsvpFormQuestion = { id: string; sectionId: string; label: string; type: "Short answer" | "Long answer" | "Yes or no" | "Number"; required: boolean };
export type RsvpFormSection = { id: string; title: string };
export type RsvpForm = { allowSelfAdded: boolean; sections: RsvpFormSection[]; questions: RsvpFormQuestion[] };
export type GuestMessageChannel = "Email" | "WhatsApp" | "SMS";
export type GuestMessageKind = "Invitation" | "Reminder" | "Save the date" | "General update";
export type GuestDeliveryStatus = "read" | "opened" | "delivered" | "failed" | "pending";
export type GuestMessageRecipient = {
  id: string;
  name: string;
  channel: GuestMessageChannel;
  status: GuestDeliveryStatus;
  rsvp: boolean;
};
export type GuestMessage = {
  id: string;
  subject: string;
  body: string;
  channel: GuestMessageChannel;
  audience: string;
  createdAt: string;
  recipients: number;
  kind?: GuestMessageKind;
  recipientIds?: string[];
  channels?: GuestMessageChannel[];
  replyTo?: string;
};
export type GuestMessageRun = {
  id: string;
  kind: GuestMessageKind | "Gate codes";
  sentAt: string;
  subject: string;
  body: string;
  recipients: GuestMessageRecipient[];
  credits: number;
  author: string;
};
export type GuestGateSettings = {
  allowWalkIns: boolean;
  automaticCodes: boolean;
  bandRules: { tag: string; band: string }[];
  codeColor: string;
  useWebsiteTheme: boolean;
};
export type GuestAccessLevel = 1 | 2 | 3;
export type GuestAccessCapabilities = {
  viewNames: boolean;
  viewRsvp: boolean;
  viewAnswers: boolean;
  editRsvpQuestions: boolean;
  manageSeating: boolean;
  manageGuests: boolean;
  viewContact: boolean;
  sendMessages: boolean;
};
export function guestAccessCapabilities(level: GuestAccessLevel): GuestAccessCapabilities {
  return {
    viewNames: true,
    viewRsvp: level >= 2,
    viewAnswers: level >= 2,
    editRsvpQuestions: level >= 2,
    manageSeating: level >= 2,
    manageGuests: level >= 3,
    viewContact: level >= 3,
    sendMessages: level >= 3,
  };
}
export const defaultGateSettings = (): GuestGateSettings => ({
  allowWalkIns: true, automaticCodes: false, codeColor: "#255646", useWebsiteTheme: true,
  bandRules: ["Family", "Bride’s side", "Groom’s side", "Bride’s friends", "Work", "Groom’s friends", "VIP"].map((tag, index) => ({ tag, band: index === 0 ? "Blue" : "None / N/A" })),
});
export type GuestWorkspaceData = {
  guests: EventGuest[];
  tables: GuestTable[];
  floorPlans?: Partial<Record<GuestTable["space"], string>>;
  seatingSeeded?: boolean;
  questions: GuestQuestion[];
  collectorResponses: GuestCollectorResponse[];
  collector: { hostLine: string; closesOn: string; closed: boolean; sections: GuestCollectorSection[] };
  messages: GuestMessage[];
  messageRuns: GuestMessageRun[];
  rsvpForm: RsvpForm;
  clientAccessLevel?: GuestAccessLevel;
  listLocked?: boolean;
  gateSettings?: GuestGateSettings;
  sampleSeeded?: boolean;
};

export const emptyGuestWorkspace = (): GuestWorkspaceData => ({
  guests: [], tables: [], questions: [
    { id: "name", label: "Your name", type: "Short answer", required: true },
    { id: "phone", label: "Phone / WhatsApp", type: "Short answer", required: true },
    { id: "email", label: "Email", type: "Short answer", required: false },
  ], collectorResponses: [], collector: { hostLine: "We’d love to celebrate with you. Tell us who’s coming so we can plan properly.", closesOn: "", closed: false, sections: [{ id: "before-invitation", title: "Before the invitation" }] }, messages: [], messageRuns: [],
  rsvpForm: defaultRsvpForm(),
  gateSettings: defaultGateSettings(),
});

export function defaultRsvpForm(): RsvpForm {
  return {
    allowSelfAdded: false,
    sections: [
      { id: "details", title: "Your details" },
      { id: "attendance", title: "Who’s coming" },
      { id: "preferences", title: "A few more details" },
    ],
    questions: [
      { id: "rsvp-name", sectionId: "details", label: "Your name", type: "Short answer", required: true },
      { id: "rsvp-phone", sectionId: "details", label: "Phone / WhatsApp", type: "Short answer", required: true },
      { id: "rsvp-email", sectionId: "details", label: "Email", type: "Short answer", required: false },
      { id: "rsvp-attending", sectionId: "attendance", label: "Will you be coming?", type: "Yes or no", required: true },
      { id: "rsvp-adults", sectionId: "attendance", label: "Adults coming with you", type: "Number", required: false },
      { id: "rsvp-children", sectionId: "attendance", label: "Children coming with you", type: "Number", required: false },
      { id: "rsvp-dietary", sectionId: "preferences", label: "Any dietary needs?", type: "Long answer", required: false },
    ],
  };
}

const sampleNames = [
  "Ngozi Okafor", "Bola Adeyemi", "Ifeoma Bassey", "Emeka Nwosu", "Kemi Adebayo", "Uche Eze", "Tosin Balogun", "Amaka Obi", "Chuka Okeke", "Funmi Bello",
  "Tolu Adebayo", "Ada Okeke", "Daniel Akinwale", "Sharon Warmate", "Zainab Musa", "Nneka Udeh", "Femi Ajayi", "Chidinma Okafor", "Segun Bello", "Nora Eze",
  "Dele Akin", "Ibrahim Yusuf", "Chioma Nnadi", "Bisi Ogunleye", "David Okoro", "Lara Adeyemi", "Ola Martins", "Mariam Lawal", "Ayo Peters", "Nkiru Ibe",
];

export function sampleGuestWorkspace(): GuestWorkspaceData {
  const base = emptyGuestWorkspace();
  const guests: EventGuest[] = sampleNames.map((name, index) => {
    const rsvp: GuestRsvp = index >= 10 && index < 23 ? "coming" : index >= 23 && index < 25 ? "not-coming" : index >= 25 && index < 27 ? "maybe" : "pending";
    const group = index < 4 ? "Warmaid family" : index < 11 ? "Family" : index < 18 ? "Friends" : index < 24 ? "Work" : "VIP";
    const tags = index < 4 ? ["Family", "Bride’s side"] : index < 11 ? ["Groom’s side"] : index < 18 ? ["Bride’s friends"] : index < 24 ? ["Work"] : ["VIP"];
    const invitedAt = index >= 10 && index < 26 ? "2026-10-26T10:00:00.000Z" : undefined;
    return {
      id: `sample-guest-${index + 1}`, name, email: `guest${index}@example.com`, phone: index === 4 || index === 9 ? "" : `+234800000${String(index).padStart(4, "0")}`,
      group, tags, rsvp, invitedAt, invitationFailedAt: index === 26 || index === 27 ? "2026-10-26T10:00:00.000Z" : undefined,
      responseAt: rsvp !== "pending" ? "2026-10-28T12:00:00.000Z" : undefined, responseChannel: rsvp !== "pending" ? "WhatsApp" : undefined,
      adults: 1, children: 0, dietary: index === 10 || index === 11 ? "Vegetarian" : index === 12 ? "No nuts" : index === 13 ? "Halal" : "",
    };
  });
  return { ...base, guests, seatingSeeded: true, tables: [
    { id: "sample-table-family", name: "Table 1 — Family", capacity: 8, space: "Reception", color: "#e89a18", position: { x: 17, y: 24 } },
    { id: "sample-table-friends", name: "Table 2 — College Friends", capacity: 8, space: "Reception", color: "#1cad7e", position: { x: 55, y: 30 } },
    { id: "sample-table-work", name: "Table 3 — Work", capacity: 6, space: "Reception", color: "#6665e8", position: { x: 25, y: 70 } },
    { id: "sample-table-vip", name: "Table 4 — VIP", capacity: 4, space: "Reception", color: "#d94991", position: { x: 55, y: 70 } },
  ], collectorResponses: [
    { id: "sample-collect-1", name: "Bryant Okafor", phone: "+2348095550200", email: "bryant@example.com", adults: 2, children: 1, answers: "Diet: Vegetarian", receivedAt: "2026-11-02T11:00:00.000Z", status: "new" },
    { id: "sample-collect-2", name: "Ngozi Okafor", phone: guests[0].phone, email: "ngozi@example.com", adults: 1, children: 0, answers: "", receivedAt: "2026-11-03T09:00:00.000Z", status: "new", guestId: guests[0].id },
  ], sampleSeeded: true };
}

export function guestWorkspaceData(value?: GuestWorkspaceData): GuestWorkspaceData {
  const fallback = emptyGuestWorkspace();
  const sampleGuests = !value || (!value.sampleSeeded && Array.isArray(value.guests) && value.guests.length === 0)
    ? sampleGuestWorkspace().guests
    : undefined;
  const sampleTables = sampleGuestWorkspace().tables;
  return value ? {
    guests: sampleGuests ?? (Array.isArray(value.guests) ? value.guests : []),
    tables: value.seatingSeeded ? (Array.isArray(value.tables) ? value.tables : []) : (Array.isArray(value.tables) && value.tables.length ? value.tables : sampleTables),
    seatingSeeded: true,
    floorPlans: value.floorPlans ?? {},
    questions: Array.isArray(value.questions) ? value.questions : fallback.questions,
    collectorResponses: Array.isArray(value.collectorResponses) ? value.collectorResponses : value.sampleSeeded ? sampleGuestWorkspace().collectorResponses : [],
    collector: {
      ...fallback.collector,
      ...value.collector,
      sections: Array.isArray(value.collector?.sections) && value.collector.sections.length ? value.collector.sections : fallback.collector.sections,
    },
    messages: Array.isArray(value.messages) ? value.messages : [],
    messageRuns: Array.isArray(value.messageRuns) ? value.messageRuns : [],
    rsvpForm: value.rsvpForm ?? fallback.rsvpForm,
    clientAccessLevel: value.clientAccessLevel === 1 || value.clientAccessLevel === 2 ? value.clientAccessLevel : 3,
    listLocked: Boolean(value.listLocked),
    gateSettings: { ...defaultGateSettings(), ...value.gateSettings, bandRules: value.gateSettings?.bandRules?.length ? value.gateSettings.bandRules : defaultGateSettings().bandRules },
    sampleSeeded: Boolean(value.sampleSeeded || sampleGuests),
  } : sampleGuestWorkspace();
}

export const rsvpLabel: Record<GuestRsvp, string> = { pending: "Pending", coming: "Coming", "not-coming": "Not coming", maybe: "Maybe" };
