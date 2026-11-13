export type SellerBriefState = "draft" | "open" | "pay" | "checking" | "working" | "revision" | "review" | "done" | "cancelled";

export const SELLER_BRIEF_TONES: Record<SellerBriefState, string> = {
  draft: "bg-gray-100 text-gray-600",
  open: "bg-sky-50 text-sky-700",
  pay: "bg-amber-50 text-amber-700",
  checking: "bg-amber-50 text-amber-700",
  working: "bg-indigo-50 text-indigo-700",
  revision: "bg-rose-50 text-rose-700",
  review: "bg-emerald-50 text-emerald-700",
  done: "bg-gray-100 text-gray-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export const SELLER_STEPS = ["published", "chosen", "secured", "delivered", "validated"] as const;

const REACHED: Record<SellerBriefState, number> = {
  draft: 0,
  open: 1,
  pay: 2,
  checking: 2,
  working: 3,
  revision: 3,
  review: 4,
  done: 5,
  cancelled: 1,
};

export function sellerBriefState(brief: { status: string; selected_creator_id: string | null }, hasPayment: boolean): SellerBriefState {
  switch (brief.status) {
    case "draft": return "draft";
    case "published": return brief.selected_creator_id ? (hasPayment ? "checking" : "pay") : "open";
    case "assigned": return "working";
    case "in_progress": return "revision";
    case "delivered": return "review";
    case "completed": return "done";
    default: return "cancelled";
  }
}

export function sellerStepsReached(state: SellerBriefState) {
  return REACHED[state];
}

export function sellerNeedsAction(state: SellerBriefState, pendingApplications: number) {
  return state === "pay" || state === "review" || (state === "open" && pendingApplications > 0);
}
