import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useRef } from 'react';

export const CrudHeader = ({ title, onAdd, filterContent }: any) => {
  const op = useRef<any>(null);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-6 bg-white border-b border-gray-100">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-700 m-0">{title}</h2>
        <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
          Paginação Ativa
        </span>
      </div>
      
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2">
          {/* BOTÃO DE FILTROS: Visível apenas no Desktop */}
          {filterContent && (
            <Button 
              type="button"
              icon="pi pi-filter" 
              label="Filtros" 
              outlined 
              severity="secondary" 
              className="text-gray-600 border-gray-300 hidden md:flex h-11"
              onClick={(e) => op.current.toggle(e)}
            />
          )}

          {/* BOTÃO NOVO: Visível apenas no Desktop */}
          <Button 
            onClick={onAdd} 
            className="hidden md:flex bg-blue-600 hover:bg-blue-700 border-none shadow-md px-6 h-11 min-w-[110px] justify-center"
          >
            <i className="pi pi-plus text-white mr-2"></i>
            <span className="text-white font-bold uppercase text-xs">Novo</span>
          </Button>
        </div>
      </div>

      {/* PAINEL DE FILTROS (Desktop) */}
      <OverlayPanel ref={op} showCloseIcon dismissable className="w-full md:w-80 shadow-2xl border-gray-200">
        <div className="flex flex-col gap-4 p-1">
          <div className="border-b pb-2">
            <span className="font-bold text-gray-700">Filtrar por:</span>
          </div>
          
          <div className="flex flex-col gap-3">
            {filterContent}
          </div>

          <div className="flex justify-end gap-2 mt-2 pt-3 border-t">
             <Button label="Limpar" text severity="secondary"/>
             <Button label="Aplicar" className="bg-blue-600 border-none px-4 text-white" onClick={() => op.current.hide()} />
          </div>
        </div>
      </OverlayPanel>
    </div>
  );
};