
'use client';

import { useRef } from 'react';

export const useReactToPrint = () => {
    const contentRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const node = contentRef.current;
        if (!node) {
            console.error("Print Error: `contentRef` is not pointing to a valid element.");
            return;
        }

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const printDocument = iframe.contentWindow?.document;
        if (!printDocument) {
            console.error("Could not access iframe document.");
            document.body.removeChild(iframe);
            return;
        }

        printDocument.write('<html><head><title>Print</title>');

        // Copy all stylesheets from the main document to the iframe
        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
        styles.forEach(style => {
            printDocument.write(style.outerHTML);
        });

        printDocument.write('</head><body></body></html>');
        printDocument.close();
        
        // Clone the node to print and append it to the iframe's body
        printDocument.body.appendChild(node.cloneNode(true));
        
        // Use a small timeout to ensure content is fully rendered in the iframe before printing
        setTimeout(() => {
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            }
            document.body.removeChild(iframe);
        }, 500);
    };

    return { handlePrint, contentRef };
};
