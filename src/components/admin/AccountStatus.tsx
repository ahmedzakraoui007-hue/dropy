"use client";

import { Ban, CheckCircle, UserCheck, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export type AccountStatusAction = "approved" | "rejected" | "suspended";

const isActive = (status?: string | null) => status === "active" || status === "approved";
const isPending = (status?: string | null) => !status || status === "pending" || status === "email_verified";

export function AccountStatusBadge({ status }: { status?: string | null }) {
  if (isActive(status)) {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Actif</Badge>
    );
  }
  if (status === "suspended") return <Badge variant="destructive">Suspendu</Badge>;
  if (status === "rejected") return <Badge variant="destructive">Refusé</Badge>;
  return (
    <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">En attente</Badge>
  );
}

export function AccountStatusMenuItems({
  status,
  onChange,
}: {
  status?: string | null;
  onChange: (status: AccountStatusAction) => void;
}) {
  if (isPending(status)) {
    return (
      <>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onChange("approved")} className="text-emerald-600 font-bold">
          <UserCheck className="w-4 h-4 mr-2" />
          Accepter la demande
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange("rejected")} className="text-red-600">
          <UserX className="w-4 h-4 mr-2" />
          Refuser la demande
        </DropdownMenuItem>
      </>
    );
  }
  if (isActive(status)) {
    return (
      <>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onChange("suspended")} className="text-red-600">
          <Ban className="w-4 h-4 mr-2" />
          Suspendre le compte
        </DropdownMenuItem>
      </>
    );
  }
  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onChange("approved")} className="text-emerald-600">
        <CheckCircle className="w-4 h-4 mr-2" />
        {status === "rejected" ? "Accepter finalement" : "Réactiver le compte"}
      </DropdownMenuItem>
    </>
  );
}

export async function updateAccountStatus(userId: string, status: AccountStatusAction) {
  const response = await fetch("/api/admin/users/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, status }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Erreur lors de la mise à jour du statut");
  }
  return (await response.json().catch(() => ({}))) as { success: boolean; emailSent?: boolean };
}

export const STATUS_MESSAGES: Record<AccountStatusAction, string> = {
  approved: "Compte approuvé",
  rejected: "Demande refusée",
  suspended: "Compte suspendu",
};
