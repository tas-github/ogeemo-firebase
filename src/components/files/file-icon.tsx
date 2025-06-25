
import { File, FileText, FileImage, FileArchive, FileVideo, FileAudio, FileCode, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileIconProps {
  fileType: string;
  className?: string;
}

export function FileIcon({ fileType, className }: FileIconProps) {
  const commonClass = "h-5 w-5 text-muted-foreground";
  const finalClassName = cn(commonClass, className);

  if (fileType.startsWith('image/')) {
    return <FileImage className={finalClassName} />;
  }
  if (fileType.startsWith('video/')) {
    return <FileVideo className={finalClassName} />;
  }
  if (fileType.startsWith('audio/')) {
    return <FileAudio className={finalClassName} />;
  }
  if (fileType.startsWith('application/zip') || fileType.startsWith('application/x-rar-compressed')) {
    return <FileArchive className={finalClassName} />;
  }

  switch (fileType) {
    case 'application/pdf':
      return <FileText className={cn(finalClassName, "text-red-500")} />;
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return <FileText className={cn(finalClassName, "text-blue-500")} />;
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'application/vnd.ms-excel':
      return <FileText className={cn(finalClassName, "text-green-500")} />;
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    case 'application/vnd.ms-powerpoint':
      return <FileText className={cn(finalClassName, "text-orange-500")} />;
    case 'text/plain':
      return <FileText className={finalClassName} />;
    case 'text/html':
    case 'application/json':
    case 'text/css':
    case 'text/javascript':
      return <FileCode className={finalClassName} />;
    default:
      return <File className={finalClassName} />;
  }
}

    