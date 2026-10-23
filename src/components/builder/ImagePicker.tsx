"use client";

import { useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/context/LanguageContext";
import MediaLibrary from "./MediaLibrary";

interface ImagePickerProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImagePicker({ value, onChange, label }: ImagePickerProps) {
  const { t } = useTranslation();
  const tr = (key: string) => t(`store_builder.media.${key}`);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}

      {value ? (
        <div className="relative overflow-hidden rounded-lg border">
          <img src={value} alt="" className="aspect-video w-full object-cover" />
          <div className="flex gap-2 border-t bg-card p-2">
            <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => setIsOpen(true)}>
              {tr("change")}
            </Button>
            <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => onChange("")} aria-label={tr("remove")}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" className="flex h-24 w-full flex-col gap-2 border-dashed" onClick={() => setIsOpen(true)}>
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{tr("choose")}</span>
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="flex h-[80vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="px-4 pt-4 text-start">
            <DialogTitle>{tr("title")}</DialogTitle>
            <DialogDescription className="sr-only">{tr("choose")}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1">
            <MediaLibrary
              onSelect={(url) => {
                onChange(url);
                setIsOpen(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
