import React from 'react';
import { classNames } from 'primereact/utils';

interface FieldWrapperProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string; // Aqui entra a classe de colSpan
}

export const FieldWrapper = ({ label, error, children, className }: FieldWrapperProps) => {
  return (
    <div className={classNames('flex flex-col gap-1.5 mb-2 w-full', className)}>
      <label className="text-sm font-bold text-gray-700 ml-1">
        {label}
      </label>
      
      <div className="w-full">
        {children}
      </div>

      {error && (
        <small className="text-red-500 text-xs ml-1 flex items-center gap-1">
          <i className="pi pi-exclamation-circle text-[10px]" />
          {error}
        </small>
      )}
    </div>
  );
};