"use client";

import { useState, useRef } from "react";
import { Upload, X, File, Image as ImageIcon, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxSize?: number; // MB
  acceptedTypes?: string[];
  maxFiles?: number;
  className?: string;
}

export function FileUpload({
  onFilesSelected,
  maxSize = 50,
  acceptedTypes = ["image/*", "video/*"],
  maxFiles = 5,
  className
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const sizeInMB = file.size / (1024 * 1024);
      if (sizeInMB > maxSize) {
        toast.error(`File ${file.name} is too large (max ${maxSize}MB)`);
        return false;
      }
      return true;
    }).slice(0, maxFiles - selectedFiles.length);

    if (validFiles.length === 0 && files.length > 0) return;

    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          multiple
          accept={acceptedTypes.join(",")}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <p className="font-medium">Click to upload or drag and drop</p>
          <p className="text-sm text-muted-foreground">
            {acceptedTypes.join(", ")} up to {maxSize}MB
          </p>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {selectedFiles.map((file, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-3">
                {file.type.startsWith("image/") ? (
                  <ImageIcon className="w-4 h-4 text-blue-500" />
                ) : file.type.startsWith("video/") ? (
                  <Film className="w-4 h-4 text-purple-500" />
                ) : (
                  <File className="w-4 h-4 text-muted-foreground" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
