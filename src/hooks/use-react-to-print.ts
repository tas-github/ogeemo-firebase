'use client';

import { useRef, useCallback } from 'react';

export function useReactToPrint() {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    const node = contentRef.current;
    if (!node) {
      console.error("Print Error: The content to print could not be found.");
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
        console.error("Print Error: Could not access the iframe document.");
        document.body.removeChild(iframe);
        return;
    }
    
    // Copy all stylesheets from the main document to the iframe
    Array.from(document.styleSheets).forEach(styleSheet => {
        try {
            const cssText = Array.from(styleSheet.cssRules)
                .map(rule => rule.cssText)
                .join('');
            const style = iframeDoc.createElement('style');
            style.appendChild(iframeDoc.createTextNode(cssText));
            iframeDoc.head.appendChild(style);
        } catch (e) {
            // This can happen with external stylesheets due to CORS.
            // A link tag is a more robust way to handle this.
             if (styleSheet.href) {
                const link = iframeDoc.createElement('link');
                link.rel = 'stylesheet';
                link.type = styleSheet.type;
                link.href = styleSheet.href;
                iframeDoc.head.appendChild(link);
            }
        }
    });

    iframeDoc.body.innerHTML = node.innerHTML;
    
    // Use a small timeout to ensure styles are loaded, especially linked ones.
    setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // Clean up after print dialog is closed or cancelled.
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 500);
    }, 250);

  }, []);

  return { handlePrint, contentRef };
}
