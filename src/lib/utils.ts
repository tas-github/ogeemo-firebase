import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function triggerBrowserDownload(url: string, fileName: string) {
    try {
        // Fetching the blob directly is more reliable than creating a temporary link
        // for some browser security policies.
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch file for download: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const blob = await response.blob();

        const blobUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = fileName;
        
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(blobUrl);
        a.remove();
    } catch (error) {
        console.error("Download failed:", error);
        // Re-throw the error so the caller can handle it (e.g., show a toast)
        throw error;
    }
}
