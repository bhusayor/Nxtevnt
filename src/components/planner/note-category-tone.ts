/** Shared pastel treatments for the planner notebook categories. */
const categoryTones: Record<string, { badge: string; control: string }> = {
  General: {
    badge: "border-[#d9e5e9] bg-[#edf4f6] text-[#496775]",
    control: "border-[#d9e5e9] bg-[#f3f8f9] text-[#385b68]",
  },
  Call: {
    badge: "border-[#cce9db] bg-[#e8f6ee] text-[#2d7354]",
    control: "border-[#cce9db] bg-[#f0faf4] text-[#286747]",
  },
  Ideas: {
    badge: "border-[#e4d9f3] bg-[#f3edfa] text-[#70528c]",
    control: "border-[#e4d9f3] bg-[#f8f4fc] text-[#674781]",
  },
  "Follow-up": {
    badge: "border-[#f1dfba] bg-[#fff4df] text-[#895f25]",
    control: "border-[#f1dfba] bg-[#fff9ed] text-[#7e551e]",
  },
  Meeting: {
    badge: "border-[#d4e4f5] bg-[#eaf3fc] text-[#396f9b]",
    control: "border-[#d4e4f5] bg-[#f2f8fd] text-[#32658f]",
  },
  Decision: {
    badge: "border-[#f0d7df] bg-[#fbeef2] text-[#98566b]",
    control: "border-[#f0d7df] bg-[#fdf5f7] text-[#8b4b61]",
  },
  Lead: {
    badge: "border-[#f2ddce] bg-[#fff0e6] text-[#9a603a]",
    control: "border-[#f2ddce] bg-[#fff6ef] text-[#8b5330]",
  },
};

export function noteCategoryTone(category: string) {
  return categoryTones[category];
}
