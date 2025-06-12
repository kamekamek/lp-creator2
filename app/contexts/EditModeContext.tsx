'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface EditModeContextType {
  isEditMode: boolean;
  toggleEditMode: () => void;
  selectedElementId: string | null;
  selectElement: (id: string | null) => void;
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

export const EditModeProvider = ({ children }: { children: ReactNode }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const toggleEditMode = () => {
    setIsEditMode(prev => !prev);
    // モード切替時に選択は解除する
    setSelectedElementId(null);
  };

  const selectElement = (id: string | null) => {
    setSelectedElementId(id);
  };

  return (
    <EditModeContext.Provider value={{ isEditMode, toggleEditMode, selectedElementId, selectElement }}>
      {children}
    </EditModeContext.Provider>
  );
};

export const useEditMode = () => {
  const context = useContext(EditModeContext);
  if (context === undefined) {
    throw new Error('useEditMode must be used within an EditModeProvider');
  }
  return context;
};
