"use client";

import { useState } from "react";
import { ImageIcon, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import MediaLibrary from "./MediaLibrary";

interface ImagePickerProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImagePicker({ value, onChange, label }: ImagePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      
      {value ? (
        <div className="relative group aspect-video rounded-lg overflow-hidden border border-border">
          <img 
            src={value} 
            alt="Selected" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setIsOpen(true)}>
              Modifier
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onChange("")}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button 
          variant="outline" 
          className="w-full h-24 border-dashed flex flex-col gap-2"
          onClick={() => setIsOpen(true)}
        >
          <ImageIcon className="w-6 h-6 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Choisir une image</span>
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0 h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Choisir une image</DialogTitle>
            <DialogDescription>
              Sélectionnez une image depuis Unsplash ou uploadez la vôtre.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <MediaLibrary 
              onSelect={(url) => {
                onChange(url);
                setIsOpen(false);
              }} 
              onClose={() => setIsOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
