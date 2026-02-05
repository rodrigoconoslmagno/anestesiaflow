import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Sidebar } from 'primereact/sidebar';
import { CrudHeader } from './CrudHeader';
import { useNavigate } from 'react-router-dom';

interface CrudBaseProps<T> {
  title: string;
  data: T[];
  columns: { field: string; header: string; body?: (item: T) => React.ReactNode }[];
  loading?: boolean;
  onEdit: (item: T) => void;
  onAdd: () => void;
  onDelete: (item: T) => void;
  formVisible: boolean;
  onHideForm: () => void;
  onSaveForm: () => void;
  isEditMode: boolean;
  filterContent?: React.ReactNode;
  children: React.ReactNode;
}

export const CrudBase = <T extends { id?: any }>({
  title, data, columns, loading, onEdit, onAdd, onDelete,
  formVisible, onHideForm, onSaveForm, isEditMode, filterContent, children
}: CrudBaseProps<T>) => {
  const [mobileFiltersVisible, setMobileFiltersVisible] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full bg-[#f8fafc] p-2 lg:p-1 flex flex-col overflow-hidden">
      <div className="max-w-full mx-auto w-full flex-grow flex flex-col min-h-0">
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col flex-grow min-h-0 overflow-hidden">
          
          {!formVisible ? (
            /* --- VISÃO DA LISTAGEM --- */
            <div className="flex flex-col h-full animate-fadein relative">
              <div className="shrink-0">
                <CrudHeader 
                  title={title} 
                  onAdd={onAdd} 
                  filterContent={filterContent}
                />
              </div>

              <div className="flex-grow overflow-auto custom-scrollbar">
                <DataTable 
                  value={data} 
                  loading={loading} 
                  paginator 
                  rows={10} 
                  className="p-datatable-sm"
                  responsiveLayout="stack" 
                  breakpoint="960px"
                  emptyMessage={
                    <div className="flex flex-col items-center justify-center py-10">
                      <i className="pi pi-search text-gray-300 text-4xl mb-3"></i>
                      <span className="text-gray-500 font-medium text-lg">
                        Nenhum registro encontrado.
                      </span>
                      <p className="text-gray-400 text-sm">
                        Tente ajustar seus filtros ou adicionar um novo item.
                      </p>
                    </div>
                  }
                >
                  {columns.map((col) => (
                    <Column key={col.field} field={col.field} header={col.header} body={col.body} sortable />
                  ))}
                  <Column header="Ações" body={(rowData: T) => (
                    <div className="flex gap-2 md:justify-end px-2 py-2">
                      <Button icon="pi pi-pencil" text rounded onClick={() => onEdit(rowData)} className="bg-blue-50 md:bg-transparent" />
                      <Button icon="pi pi-trash" text rounded severity="danger" onClick={() => onDelete(rowData)} className="bg-red-50 md:bg-transparent" />
                    </div>
                  )} />
                </DataTable>
              </div>

              {/* --- UX MOBILE: BOTÕES FLUTUANTES (FAB) --- */}
              <div className="fixed bottom-6 right-6 md:hidden z-50 flex flex-col gap-3 items-end">
                {/* Botão Sair */}
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="w-12 h-12 rounded-full bg-gray-500 text-white shadow-lg flex items-center justify-center border-none"
                >
                  <i className="pi pi-sign-out"></i>
                </button>
                
                {/* Botão Filtrar (Laranja) */}
                {filterContent && (
                  <button 
                    onClick={() => setMobileFiltersVisible(true)}
                    className="w-14 h-14 rounded-full bg-orange-500 text-white shadow-lg flex items-center justify-center border-none"
                  >
                    <i className="pi pi-filter"></i>
                  </button>
                )}
                
                {/* Botão Novo (Principal - Azul) */}
                <button 
                  onClick={onAdd}
                  className="w-16 h-16 rounded-full bg-blue-600 text-white shadow-2xl flex items-center justify-center border-none transition-transform active:scale-90"
                >
                  <i className="pi pi-plus text-xl"></i>
                </button>
              </div>

              {/* SIDEBAR DE FILTROS MOBILE */}
              <Sidebar 
                visible={mobileFiltersVisible} 
                onHide={() => setMobileFiltersVisible(false)} 
                position="bottom" 
                className="h-auto rounded-t-3xl p-4"
                header={<span className="font-bold text-gray-700">Filtros Avançados</span>}
              >
                <div className="flex flex-col gap-5 pb-8 pt-2">
                  {filterContent}
                  <Button 
                    label="Aplicar Filtros" 
                    icon="pi pi-check" 
                    className="w-full bg-blue-600 border-none py-3.5 shadow-md font-bold mt-2 text-white" 
                    onClick={() => setMobileFiltersVisible(false)} 
                  />
                </div>
              </Sidebar>
            </div>
          ) : (
            /* --- VISÃO DO FORMULÁRIO --- */
            <div className="flex flex-col h-full animate-fadein">
              <div className="flex items-center justify-between py-3 px-6 border-b bg-white shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{isEditMode ? `Editar ${title}` : `Novo ${title}`}</h3>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider">Formulário</p>
                </div>
                <Button icon="pi pi-times" rounded text severity="secondary" onClick={onHideForm} />
              </div>

              <div className="flex-grow overflow-y-auto p-4 md:p-8 bg-white custom-scrollbar">
                <div className="max-w-5xl mx-auto pb-10">
                    {children}
                </div>
              </div>

              {/* RODAPÉ DESKTOP: Botões à Direita */}
              <div className="flex flex-row justify-end items-center gap-3 py-4 px-6 border-t bg-gray-50 shrink-0 z-10">
                <Button 
                  label="Cancelar" 
                  outlined 
                  severity="secondary" 
                  onClick={onHideForm} 
                  className="flex-1 md:flex-none md:px-6 py-3 md:py-2.5 font-bold text-sm bg-white border-gray-300 text-gray-600"
                />
                <Button 
                  label="Salvar Registro" 
                  icon="pi pi-check" 
                  className="flex-1 md:flex-none md:px-10 py-3 md:py-2.5 bg-blue-600 border-none text-white font-bold text-sm shadow-md" 
                  onClick={onSaveForm}
                  loading={loading}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};