import { Button } from 'primereact/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { classNames } from 'primereact/utils';
import { useAuthStore } from '@/permissoes/authStore';
import type { Recurso } from '@/permissoes/recurso';

interface CrudHeaderProps {
  title: string;
  onAdd?: () => void;
  resurso: Recurso;
  filterContent?: React.ReactNode;
  onClose?: () => void;
  onApplyFilters?: () => void;
  onClearFilters?: () => void;
}

export const CrudHeader = ({ title, onAdd, resurso, filterContent, 
                             onClose, onApplyFilters, onClearFilters }: CrudHeaderProps) => {
  const [showDesktopFilters, setShowDesktopFilters] = useState(false);
  const navigate = useNavigate();

  const hasPermission = useAuthStore(state => state.hasPermission(resurso, 'NOVO'));
  
  const handleClose = onClose || (() => navigate('/dashboard'));

  return (
    <div className="flex flex-col bg-white border-b border-gray-100 shadow-sm relative w-full">
      <div className="flex flex-row items-center justify-between gap-4 p-4 w-full">
        
        <div className="flex items-center min-w-0">
          <h2 className="text-lg md:text-xl font-bold text-gray-700 m-0 truncate">
            {title}
          </h2>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {filterContent && (
            <Button 
              type="button" icon="pi pi-filter" label="Filtros" outlined severity="secondary" 
              className="hidden md:flex h-11 px-4"
              onClick={() => setShowDesktopFilters(!showDesktopFilters)}
            />
          )}

          {onAdd && hasPermission && (
            <Button 
              onClick={onAdd} 
              className="hidden md:flex bg-blue-600 border-none shadow-md h-11 px-6 justify-center text-white"
            >
              <i className="pi pi-plus mr-2"></i>
              <span className="font-bold uppercase text-xs">Novo</span>
            </Button>
          )}

          <Button 
            icon="pi pi-times" 
            outlined 
            severity="danger" 
            className="hidden md:flex h-11 px-4 items-center justify-center" 
            onClick={handleClose} 
          />

          <Button 
            icon="pi pi-times" 
            text 
            severity="secondary" 
            className="md:hidden h-10 w-10 p-0 flex items-center justify-center" 
            onClick={handleClose} 
          />
        </div>
      </div>

      {/* PAINEL DESKTOP (Inline Collapsible) */}
      {filterContent && (
        <div className={classNames(
          "hidden md:block overflow-hidden transition-all duration-300 ease-in-out bg-slate-50 border-t",
          { "max-h-0": !showDesktopFilters, "max-h-[500px] p-4": showDesktopFilters }
        )}>
          <div className="flex items-end gap-4 max-w-7xl mx-auto">
            <div className="flex-grow">{filterContent}</div>
            <div className="flex gap-2">
              <Button label="Aplicar" icon="pi pi-check" className="text-white bg-blue-600 border-none h-11 px-4" onClick={onApplyFilters} />
              <Button icon="pi pi-trash" outlined severity="secondary" className="h-11" onClick={onClearFilters} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};