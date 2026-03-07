import { Button } from 'primereact/button';
import { useAuthStore } from '@/permissoes/authStore';
import type { Recurso } from '@/permissoes/recurso';

interface CrudFooterProps {
  onCancel: () => void;
  onSave: () => void;
  recurso: Recurso;
  isEditMode: boolean;
  loading?: boolean;
  auditData?: {
    criacao?: string;
    alteracao?: string;
  };
}

export const CrudFooter = ({ onCancel, onSave, recurso, isEditMode, loading, auditData }: CrudFooterProps) => {
  const permissionSuffix = isEditMode ? 'ALTERAR' : 'NOVO';
  const canSave = useAuthStore(state => 
    state.hasPermission(recurso, `${permissionSuffix}`)
  );

  const formatarData = (dataIso?: string) => {
    if (!dataIso) return '';
    try {
      const data = new Date(dataIso);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(data);
    } catch (e) {
      return dataIso;
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-4 px-6 border-t bg-gray-50 shrink-0 z-10">
      
      <div className="flex flex-row md:flex-col gap-4 md:gap-1 w-full md:w-auto text-[10px] text-gray-500 uppercase tracking-tight font-medium">
        {auditData?.criacao && (
          <div className="flex gap-1.5 items-center">
            <span className="font-bold text-gray-400">Criado:</span>
            <span className="bg-gray-200/50 px-1.5 rounded">
              {formatarData(auditData.criacao)}
            </span>
          </div>
        )}
        
        {auditData?.alteracao && (
          <div className="flex gap-1.5 items-center">
            <span className="font-bold text-gray-400">Alterado:</span>
            <span className="bg-gray-200/50 px-1.5 rounded">
              {formatarData(auditData.alteracao)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-row gap-3 w-full md:w-auto">
        <Button 
          label="Cancelar" 
          outlined 
          severity="secondary" 
          onClick={onCancel} 
          className="flex-1 md:flex-none md:px-6 py-3 md:py-2.5 font-bold text-sm bg-white border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
        />
        {canSave && (
          <Button 
            label="Salvar" 
            icon="pi pi-check" 
            className="flex-1 md:flex-none md:px-10 py-3 md:py-2.5 bg-blue-600 border-none text-white font-bold text-sm shadow-md hover:bg-blue-700 transition-all" 
            onClick={onSave}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};