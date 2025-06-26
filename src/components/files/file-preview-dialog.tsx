"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileIcon } from "./file-icon";
import { type FileItem, REPORT_TEMPLATE_MIMETYPE } from "@/data/files";
import { format } from "date-fns";
import Image from 'next/image';

interface FilePreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  file: FileItem | null;
}

const PreviewContent = ({ file }: { file: FileItem }) => {
    if (file.type.startsWith('image/')) {
        return (
            <div className="flex justify-center items-center bg-muted rounded-lg p-4 h-64">
                <Image
                    src={`https://placehold.co/400x300.png`}
                    alt={file.name}
                    width={400}
                    height={300}
                    className="max-w-full max-h-full object-contain"
                    data-ai-hint="abstract photo"
                />
            </div>
        );
    }
    if (file.type === REPORT_TEMPLATE_MIMETYPE) {
        return (
            <div className="bg-muted rounded-lg p-4 h-64 overflow-auto">
                <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: file.content || '' }}
                />
            </div>
        )
    }
    if (file.type === 'application/pdf') {
        return (
             <div className="flex flex-col justify-center items-center bg-muted rounded-lg p-4 h-64 text-center">
                <FileIcon fileType={file.type} className="h-16 w-16" />
                <p className="mt-4 font-semibold">PDF Preview</p>
                <p className="text-sm text-muted-foreground">PDF preview is not available in this prototype.</p>
            </div>
        )
    }
    if (file.type.startsWith('text/') || file.type.includes('javascript') || file.type.includes('json')) {
        return (
            <div className="bg-muted rounded-lg p-4 h-64 overflow-auto">
                <pre className="text-sm">
                    <code>
{`// Simulated content for ${file.name}
function helloWorld() {
  console.log("Hello, World!");
}

// This is just a placeholder to demonstrate the file preview feature.
// In a real application, the actual file content would be displayed here.

const sampleData = {
  id: "${file.id}",
  size: ${file.size},
  modified: "${file.modifiedAt.toISOString()}"
};
`}
                    </code>
                </pre>
            </div>
        )
    }

    return (
        <div className="flex flex-col justify-center items-center bg-muted rounded-lg p-4 h-64 text-center">
            <FileIcon fileType={file.type} className="h-16 w-16" />
            <p className="mt-4 font-semibold">No Preview Available</p>
            <p className="text-sm text-muted-foreground">A preview for this file type is not supported.</p>
        </div>
    );
}


export default function FilePreviewDialog({
  isOpen,
  onOpenChange,
  file,
}: FilePreviewDialogProps) {
  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileIcon fileType={file.type} className="h-5 w-5" />
            <span>{file.name}</span>
          </DialogTitle>
          <DialogDescription>
            File Preview
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <PreviewContent file={file} />
        </div>
        <DialogFooter className="text-sm text-muted-foreground justify-between w-full sm:justify-between flex-row">
            <span>Size: {(file.size / 1024).toFixed(2)} KB</span>
            <span>Modified: {format(file.modifiedAt, 'PPp')}</span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
