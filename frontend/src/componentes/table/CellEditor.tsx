import React from 'react';
import { FormRenderProvider } from '@/context/FormRenderContext';

interface CellEditorProps {
  children: React.ReactNode;
}

export const CellEditor = ({ children }: CellEditorProps) => {
  return (
    <FormRenderProvider mode="cell">
      <div className="w-full h-full m-0 p-0">
        {children}
      </div>
    </FormRenderProvider>
  );
};