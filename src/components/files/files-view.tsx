
"use client";

import React from 'react';
import { Folder } from 'lucide-react';
import { FilesViewContent } from './files-view-content';

export function FilesView() {
  return (
    <FilesViewContent 
      rootFolderId={null}
      headerIcon={Folder}
      headerTitle="Ogeemo File Manager"
      headerDescription="A new foundation for managing your files and folders."
    />
  );
}
