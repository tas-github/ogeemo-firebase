
"use client";

import { useCallback, useRef } from 'react';

// This is a custom hook inspired by the 'react-to-print' library.
// It simplifies the process of printing a specific component from a React application.
export const useReactToPrint = () => {
  // This ref will be attached to the component we want to print.
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    // Check if the ref is attached to a component.
    if (!contentRef.current) {
      console.error("Print Error: contentRef is not attached to a component.");
      return;
    }

    // Create a new window to host the print content. This avoids disrupting the main app.
    const printWindow = window.open('', '', 'height=800,width=1000');

    if (printWindow) {
        // Write the basic HTML structure.
        printWindow.document.write('<html><head><title>Print</title>');

        // Find all <style> and <link rel="stylesheet"> tags from the main document and copy them.
        // This ensures the printed content has the same styling as the on-screen component.
        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
        styles.forEach(style => {
            printWindow.document.write(style.outerHTML);
        });

        printWindow.document.write('</head><body>');
        // Write the HTML content of our target component into the new window.
        printWindow.document.write(contentRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        
        printWindow.document.close();
        printWindow.focus();
        
        // Use a timeout to ensure all content and styles are loaded before triggering the print dialog.
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }
  }, []);

  return {
    contentRef,
    handlePrint,
  };
};

    