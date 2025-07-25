import { File, FileText, FileJson, Image as ImageIcon, FileCode2 } from 'lucide-react';

export const FileIcon = ({ fileType }: { fileType: string }) => {
    if (fileType.startsWith('image/')) {
        return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    switch (fileType) {
        case 'application/pdf':
            return <FileText className="h-5 w-5 text-red-500" />;
        case 'application/json':
            return <FileJson className="h-5 w-5 text-yellow-500" />;
        case 'text/javascript':
        case 'text/typescript':
             return <FileCode2 className="h-5 w-5 text-indigo-500" />;
        default:
            return <File className="h-5 w-5 text-gray-500" />;
    }
};
