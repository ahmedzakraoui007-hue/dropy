"use client";

import Link from "next/link";
import { AlertCircle, ArrowUpCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface QuotaAlertProps {
  title: string;
  description: string;
  plan: string;
}

export function QuotaAlert({ title, description, plan }: QuotaAlertProps) {
  return (
    <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="font-bold">{title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-4">
        <p>{description}</p>
        <div className="flex items-center gap-3">
          <Link href="/seller/subscription">
            <Button variant="default" size="sm" className="bg-destructive hover:bg-destructive/90 text-white">
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Passer au plan supérieur
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground italic">
            Plan actuel : <span className="capitalize font-semibold">{plan}</span>
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
