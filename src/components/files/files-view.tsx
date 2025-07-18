
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Folder, LoaderCircle } from 'lucide-react';
import { FilesViewContent } from './files-view-content';

export function FilesView() {
  return (
    <DndProvider backend={HTML5Backend}>
      <FilesViewContent 
        rootFolderId={null}
        headerIcon={Folder}
        headerTitle="Ogeemo File Manager"
        headerDescription="A new foundation for managing your files and folders."
      />
    </DndProvider>
  );
}
