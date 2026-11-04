export type MissionState = "pending" | "rejected" | "payment" | "assigned" | "revision" | "delivered" | "completed" | "cancelled";

export const MISSION_STEPS = ["applied", "selected", "secured", "delivered", "validated", "paid"] as const;

export const MISSION_TONES: Record<MissionState, string> = {
  pending: "bg-gray-100 text-gray-700",
  rejected: "bg-gray-100 text-gray-500",
  payment: "bg-amber-50 text-amber-700",
  assigned: "bg-violet-50 text-violet-700",
  revision: "bg-rose-50 text-rose-700",
  delivered: "bg-sky-50 text-sky-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const SELECTED_STATES: Record<string, MissionState> = {
  published: "payment",
  assigned: "assigned",
  in_progress: "revision",
  delivered: "delivered",
  completed: "completed",
  cancelled: "cancelled",
};

const REACHED: Record<MissionState, number> = {
  pending: 1,
  rejected: 1,
  cancelled: 1,
  payment: 2,
  assigned: 3,
  revision: 4,
  delivered: 4,
  completed: 5,
};

export function missionState(
  brief: { status: string; selected_creator_id: string | null },
  userId: string,
  application?: { status: string } | null
): MissionState {
  if (brief.selected_creator_id === userId) return SELECTED_STATES[brief.status] || "assigned";
  if (application?.status === "rejected" || brief.selected_creator_id || brief.status !== "published") return "rejected";
  return "pending";
}

export function stepsReached(state: MissionState, paid: boolean) {
  return paid ? MISSION_STEPS.length : REACHED[state];
}

export function needsDelivery(state: MissionState) {
  return state === "assigned" || state === "revision";
}
