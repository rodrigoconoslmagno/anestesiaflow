import { Button } from 'primereact/button';
import { Sidebar } from 'primereact/sidebar';

export const CrudForm = ({ visible, onHide, title, onSave, loading, children }: any) => {
  return (
    <Sidebar
      visible={visible}
      onHide={onHide}
      position="right"
      className="w-full md:w-30rem lg:w-35rem"
      blockScroll
      header={<span className="text-xl font-bold text-gray-700">{title}</span>}
    >
      <div className="flex flex-col h-full bg-white">
        {/* Área de Inputs com scroll independente */}
        <div className="flex-grow overflow-y-auto py-4 px-1">
          {children}
        </div>

        {/* Footer com Sombra e Contraste */}
        <div className="flex justify-end gap-3 pt-6 pb-2 border-t border-gray-100 bg-white">
          <Button 
            label="Cancelar" 
            icon="pi pi-times" 
            outlined 
            severity="secondary" 
            onClick={onHide} 
            disabled={loading}
            className="border-gray-300 text-gray-600"
          />
          <Button 
            label="Salvar" 
            icon="pi pi-check" 
            severity="info" 
            onClick={onSave} 
            loading={loading}
            className="bg-blue-600 border-none shadow-md hover:bg-blue-700"
          />
        </div>
      </div>
    </Sidebar>
  );
};