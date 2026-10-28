"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QrPreview({ value, color = "#0f172a", fileName, label }: { value: string; color?: string; fileName: string; label: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setDataUrl(null);
      return;
    }
    QRCode.toDataURL(value, { width: 600, margin: 2, errorCorrectionLevel: "M", color: { dark: color, light: "#ffffff" } })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [value, color]);

  if (!dataUrl) return null;
  return (
    <div className="flex flex-col items-center gap-3">
      <img src={dataUrl} alt="QR code" className="h-56 w-56 rounded-2xl border border-slate-100 bg-white p-2" />
      <Button asChild variant="outline" className="rounded-xl">
        <a href={dataUrl} download={fileName}>
          <Download className="me-2 h-4 w-4" />
          {label}
        </a>
      </Button>
    </div>
  );
}
