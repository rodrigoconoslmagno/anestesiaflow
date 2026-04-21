import React from 'react';
import { classNames } from 'primereact/utils';
import { useRenderMode } from '@/context/FormRenderContext';

interface FieldWrapperProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string; // Aqui entra a classe de colSpan
}

export const FieldWrapper = ({ label, error, children, className }: FieldWrapperProps) => {
  const { mode } = useRenderMode();

  const isCell = mode === 'cell';

  return (
    <div className={classNames(
        'w-full',
        isCell ? 'flex flex-col gap-0 mb-0 h-full' :
          'flex flex-col gap-1.5 mb-2', className)}>
      {!isCell && label && (
        <label className="text-sm font-bold text-gray-700 ml-1">
          {label}
        </label>
      )}
      
      <div className={classNames('w-full', isCell && 'h-full')}>
        {children}
      </div>

      {!isCell && error && (
        <small className="text-red-500 text-xs ml-1 flex items-center gap-1">
          <i className="pi pi-exclamation-circle text-[10px]" />
          {error}
        </small>
      )}
    </div>
  );
};