"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface DisputeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  briefId: string;
  onSuccess?: () => void;
}

export function DisputeDialog({ isOpen, onClose, briefId, onSuccess }: DisputeDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the dispute");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/content/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief_id: briefId,
          reason
        })
      });

      if (response.ok) {
        toast.success("Dispute opened successfully. Our team will review it.");
        onSuccess?.();
        onClose();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to open dispute");
      }
    } catch (error) {
      toast.error("An error occurred while opening the dispute");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="w-5 h-5" />
            Open a Dispute
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to open a dispute for this mission? 
            An administrator will review the case and the escrowed funds will be frozen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 flex gap-3 text-sm text-yellow-800 dark:text-yellow-200">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>
              Please provide clear details about why you are opening this dispute. 
              Our team may contact you for further evidence.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Dispute</label>
            <Textarea 
              placeholder="Explain the issue in detail..." 
              className="min-h-[120px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Opening..." : "Open Dispute"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
