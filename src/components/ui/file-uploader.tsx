"use client";

import { useId, useState, type ChangeEvent, type DragEvent } from "react";
import { FileImage, UploadCloud } from "@/components/ui/icons";

import { cn } from "@/lib/utils/cn";

type FileUploaderProps = {
  id?: string;
  label?: string;
  description?: string;
  accept?: string;
  disabled?: boolean;
  onFileSelect?: (file: File) => void;
};

export function FileUploader({ id, label = "Upload a file", description = "PNG or JPG up to 5 MB", accept = "image/png,image/jpeg", disabled, onFileSelect }: FileUploaderProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [fileName, setFileName] = useState<string>();
  const [dragging, setDragging] = useState(false);

  const selectFile = (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    onFileSelect?.(file);
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => selectFile(event.target.files?.[0]);
  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!disabled) selectFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="grid gap-2">
      <p className="type-label text-text-primary">{label}</p>
      <label htmlFor={inputId} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} className={cn("flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-subtle px-6 py-5 text-center transition-colors hover:border-brand-primary hover:bg-surface-selected", dragging && "border-brand-primary bg-surface-selected", disabled && "pointer-events-none opacity-45")}>
        <input id={inputId} type="file" accept={accept} disabled={disabled} onChange={onChange} className="sr-only" />
        <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-brand-secondary text-brand-primary">
          {fileName ? <FileImage aria-hidden="true" className="size-5" /> : <UploadCloud aria-hidden="true" className="size-5" />}
        </span>
        <span className="type-label text-text-primary">{fileName ?? "Choose a file or drag it here"}</span>
        <span className="type-body-small mt-1 text-text-tertiary">{fileName ? "File ready to upload" : description}</span>
      </label>
    </div>
  );
}
