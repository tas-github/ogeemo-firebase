# Ogeemo App Development Guidelines

This document outlines the standard setup and principles for developing the Ogeemo application. Please follow these guidelines to ensure consistency, quality, and a user-centric approach.

## 1. Core Philosophy: Simplicity and Clarity

The primary goal is to create a powerful application that is intuitive and not intimidating for non-technical users.

- **Prioritize User Experience:** Before implementing any feature, consider the user's journey. Reorganize complex hubs (like the Accounting Hub) into logical, task-oriented sections.
- **Guided Actions:** Use clear labels, descriptions, and visual hierarchy (e.g., dropdowns for frequent actions) to guide the user.
- **Avoid Clutter:** Less is more. A clean interface is easier to understand and use.

## 2. Technical Implementation Standards

### Data Handling

- **Robust Data Flow:** Ensure that data fetching, state management, and saving are handled robustly. When implementing an "edit" feature, verify that all existing data (including all related items like invoice line items) is correctly loaded and populated into the form.
- **Correct Data-Type Conversion:** Pay close attention to data types, especially when converting between Firestore Timestamps and JavaScript `Date` objects. This is a common source of runtime errors.
- **State Management:** When a component's state depends on fetched data (e.g., an invoice), ensure the state is correctly initialized and updated. Avoid race conditions and ensure default values are set for optional fields to prevent errors like `cannot read property 'toUpperCase' of undefined`.

### Component & Page Structure

- **Single Responsibility Principle:** Each page or component should have a single, clear purpose. For example, separate the "creation" of an invoice from the "management" of its payment.
- **Consolidate Where Possible:** Avoid creating too many similar pages that can confuse the user. For instance, a single "Accounts Receivable" page is better than separate pages for "Invoices" and "Payments".
- **Use Dynamic Imports for Complex Views:** To improve initial page load times, use `next/dynamic` to lazy-load complex, client-side components.

### Feature Implementation Checklist

When building or modifying a feature, ensure the following are always included:

1.  **Create/Add Functionality:** The core ability to add a new item (e.g., project, invoice, contact).
2.  **Read/View Functionality:** The ability to see a list of existing items and view the details of a single item.
3.  **Update/Edit Functionality:** The ability to open an existing item in an editor, with all its data pre-populated, and save the changes.
4.  **Delete Functionality:** The ability to remove an item, usually with a confirmation step.
5.  **User Feedback:** Use toasts to provide clear feedback for actions like saving, updating, or deleting data.
6.  **Loading & Empty States:** Always handle loading states (e.g., with skeletons or spinners) and empty states (e.g., "No projects found") to create a smooth user experience.
