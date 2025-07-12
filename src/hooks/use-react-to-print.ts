
"use client";

import { useCallback, useRef } from 'react';

export const useReactToPrint = () => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (!contentRef.current) {
      return;
    }

    const printableContent = contentRef.current.innerHTML;
    const originalContent = document.body.innerHTML;

    // Create a new window or an iframe to print from
    const printWindow = window.open('', '', 'height=600,width=800');
    
    if (printWindow) {
        printWindow.document.write('<html><head><title>Print</title>');
        // It's important to link to the same stylesheet for consistent styling
        const styles = Array.from(document.styleSheets)
            .map(s => s.href ? `<link rel="stylesheet" href="${s.href}">` : '')
            .join('');
        const inlineStyles = Array.from(document.querySelectorAll('style'))
            .map(s => s.outerHTML)
            .join('');
            
        printWindow.document.write(styles);
        printWindow.document.write(inlineStyles);
        printWindow.document.write('</head><body >');
        printWindow.document.write(printableContent);
        printWindow.document.write('</body></html>');
        
        printWindow.document.close();
        printWindow.focus();
        
        // Use a timeout to ensure content is loaded before printing
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    } else {
        // Fallback for browsers with popup blockers
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (doc) {
            doc.write(printableContent);
            doc.close();
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        }

        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 500);
    }
    
  }, []);

  return {
    contentRef,
    triggerRef,
    handlePrint,
  };
};
