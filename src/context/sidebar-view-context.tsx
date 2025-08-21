
'use client';

import React, { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction } from 'react';

export type SidebarViewType = 'fullMenu' | 'grouped' | 'dashboard';

interface SidebarViewContextType {
  view: SidebarViewType;
  setView: Dispatch<SetStateAction<SidebarViewType>>;
}

const SidebarViewContext = createContext<SidebarViewContextType | undefined>(undefined);

export function SidebarViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<SidebarViewType>('grouped');

  const value = { view, setView };

  return (
    <SidebarViewContext.Provider value={value}>
      {children}
    </SidebarViewContext.Provider>
  );
}

export function useSidebarView() {
  const context = useContext(SidebarViewContext);
  if (context === undefined) {
    throw new Error('useSidebarView must be used within a SidebarViewProvider');
  }
  return context;
}
