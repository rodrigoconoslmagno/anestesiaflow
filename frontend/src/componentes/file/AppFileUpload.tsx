import { useState } from 'react';
import { FileUpload, type FileUploadHandlerEvent } from 'primereact/fileupload';
import { ProgressBar } from 'primereact/progressbar';
import { server } from '@/api/server';
import { FieldWrapper } from '@/componentes/FieldWrapper';
import { type ColSpan, getColSpanClass } from '@/utils/GridUtils';
import { useAppToast } from '@/context/ToastContext'; // Seu Contexto Padronizado

interface AppFileUploadProps {
    url: string;
    label: string;
    colSpan?: ColSpan;
    onSuccess?: (data: any) => void;
    helpText?: string;
}

export const AppFileUpload = ({ 
    url, 
    label, 
    colSpan = 12, 
    onSuccess, 
    helpText 
}: AppFileUploadProps) => {
    const { showSuccess, showError } = useAppToast(); // Usando seu Hook
    const [isUploading, setIsUploading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

    const onTemplateUpload = async (event: FileUploadHandlerEvent) => {
        const file = event.files[0];
        setFileName(file.name);
        setIsUploading(true);

        try {
            const result = await server.api.upload(url, file);
            
            showSuccess('Sucesso', `Planilha "${file.name}" processada com êxito!`);

            if (onSuccess) onSuccess(result);
            event.options.clear();
            setFileName(null);
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Erro ao processar arquivo.';
            showError('Erro na Importação', msg);
        } finally {
            setIsUploading(false);
        }
    };

    const emptyTemplate = () => (
        <div className="flex flex-col items-center justify-center space-y-2 py-5">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <i className="pi pi-file-excel text-2xl text-green-600"></i>
            </div>
            <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Arraste ou clique para importar a escala</p>
                <p className="text-[11px] text-gray-400 mt-0.5 italic leading-none">Formatos aceitos: .xlsx, .xls</p>
            </div>
        </div>
    );

    return (
        <FieldWrapper 
            label={label} 
            className={getColSpanClass(colSpan)}
        >
            <div className="relative mt-1 group">
                <div className={`border-2 border-dashed rounded-lg transition-all overflow-hidden
                    ${isUploading ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300 hover:border-blue-400 hover:shadow-sm'}`}>
                    
                    <FileUpload
                        name="file"
                        customUpload
                        uploadHandler={onTemplateUpload}
                        accept=".xlsx, .xls"
                        maxFileSize={10000000} // 10MB
                        disabled={isUploading}
                        auto
                        headerClassName="hidden"
                        contentClassName="p-0 border-none bg-transparent"
                        emptyTemplate={emptyTemplate}
                        className="w-full"
                    />

                    {isUploading && (
                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-10">
                            <i className="pi pi-spin pi-spinner text-blue-600 text-xl mb-2"></i>
                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest animate-pulse">
                                Processando: {fileName}
                            </p>
                            <div className="w-full max-w-[140px] mt-3">
                                <ProgressBar mode="indeterminate" style={{ height: '4px' }} showValue={false} />
                            </div>
                        </div>
                    )}
                </div>
                {helpText && !isUploading && <small className="text-gray-400 text-[10px] ml-1">{helpText}</small>}
            </div>
        </FieldWrapper>
    );
};