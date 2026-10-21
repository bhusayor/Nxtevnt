import type { ProductStatus } from "@/components/ui/status-badge";

export type DashboardEvent = {
  slug: string;
  name: string;
  type: string;
  date: string;
  day: string;
  month: string;
  location: string;
  client: string;
  progress: number;
  next: string;
  nextTaskId?: string;
  tasksComplete?: boolean;
  image: string;
  alt: string;
  status: ProductStatus;
  tone: "sage" | "blue" | "lilac";
  initials: string;
  countdown: string;
  tasks: string;
  secondaryValue: string;
  secondaryLabel: string;
  position: string;
};

export const overviewEvents: readonly DashboardEvent[] = [
  { slug: "ada-and-tunde-wedding", name: "Ada & Tunde Wedding", type: "Wedding", date: "October 12, 2026", day: "12", month: "Oct", location: "Victoria Island, Lagos", client: "Ada Okoye", progress: 72, next: "Confirm catering", image: "/images/auth/nigerian-traditional-wedding.jpg", alt: "Nigerian couple celebrating their traditional wedding", status: "upcoming", tone: "sage", initials: "AO", countdown: "3 days to go", tasks: "18 of 25", secondaryValue: "8 of 10", secondaryLabel: "Vendors confirmed", position: "center 45%" },
  { slug: "lagos-tech-summit", name: "Lagos Tech Summit", type: "Conference", date: "October 18, 2026", day: "18", month: "Oct", location: "Landmark Centre, Lagos", client: "Kora Systems", progress: 54, next: "Approve stage design", image: "/images/auth/corporate-conference.jpg", alt: "Conference attendees facing a brightly lit stage", status: "upcoming", tone: "blue", initials: "KS", countdown: "9 days to go", tasks: "13 of 24", secondaryValue: "6 of 9", secondaryLabel: "Vendors confirmed", position: "center 42%" },
  { slug: "chiomas-40th-birthday", name: "Chioma's 40th Birthday", type: "Private party", date: "October 25, 2026", day: "25", month: "Oct", location: "Ikoyi, Lagos", client: "Chioma Eze", progress: 38, next: "Review entertainment", image: "/images/auth/gala-dinner.jpg", alt: "An elegant floral dinner setting for a birthday celebration", status: "prospect", tone: "lilac", initials: "CE", countdown: "16 days to go", tasks: "8 of 21", secondaryValue: "3 of 8", secondaryLabel: "Vendors confirmed", position: "center 52%" },
];
