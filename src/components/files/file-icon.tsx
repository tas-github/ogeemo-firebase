
import { File, FileText, FileImage, FileCode, FileVideo, FileAudio, FileArchive } from 'lucide-react';

interface FileIconProps {
  fileType: string;
  className?: string;
}

export function FileIcon({ fileType, className }: FileIconProps) {
  const commonClass = "h-5 w-5 text-muted-foreground";
  const finalClassName = `${commonClass} ${className || ''}`;

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
      return <FileText className={finalClassName} color="#e53e3e" />;
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return <FileText className={finalClassName} color="#4285f4" />;
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'application/vnd.ms-excel':
      return <FileText className={finalClassName} color="#34a853" />;
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    case 'application/vnd.ms-powerpoint':
      return <FileText className={finalClassName} color="#fbbc05" />;
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
