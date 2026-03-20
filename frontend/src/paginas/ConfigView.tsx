import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from 'primereact/button';
import { COMPONENT_MAP } from '@/componentes/ComponentRegistry';
import type { Config, ConfigItem } from '@/types/config';
import { useNavigate } from 'react-router-dom';
import { server } from '@/api/server';
import { BlockUI } from 'primereact/blockui';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAppToast } from '@/context/ToastContext';
import { useAuthStore } from '@/permissoes/authStore';
import { Recurso } from '@/permissoes/recurso';

export const ConfigView = () => {
  const [ configs, setConfigs] = useState<ConfigItem[]>([]);
  const { control, handleSubmit, reset } = useForm<Config>();
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false);
  const { showError } = useAppToast();

  const hasPerm = useAuthStore(state => state.hasPermission);

  const canALTERAR = hasPerm(Recurso.CONFIG, 'ALTERAR');

  useEffect(() => {
    const buscaConfiguracoes = async () => {
        setLoading(true)
        try {
           const dados = await server.api.listarCustomizada<ConfigItem>('/config', '/listar')
           setConfigs(dados)

            const valoresParaFormulario = dados.reduce((acc, item) => {
                acc[item.chave] = item.valor;
                return acc;
            }, {} as any);

            reset(valoresParaFormulario);
        } catch (err: any )  {
            const errorMessage = err.response?.data?.mensagem || "Ocorreu um erro inesperado ao salvar.";
            const errorCodigo = err.response?.data?.codigo;
      
            showError(errorCodigo === 'ACESSO_NEGADO' ? 'Acesso Negado' : 'Erro', errorMessage)
        } finally {
            setLoading(false)
        }
    }

    buscaConfiguracoes();
  }, [reset]);

  const onSubmit = async (data: any) => {
    setLoading(true)
    try{
        const payload = Object.entries(data).map(([chave, valor]) => ( 
            {
                chave: chave,
                valor: valor && ((valor instanceof Date) ? valor.toISOString() : String(valor))
            }
        ));
        await server.api.criar("/config", payload);
        reset(data);
    } finally {
        setLoading(false)
    }
  };

  const loaderTemplate = <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />;

  return (
    <div className="min-h-screen bg-slate-100/50 pb-8">
      <header className="flex items-center justify-between sm:px-6 py-4 px-4 bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4 w-full max-w-7xl mx-auto">
          <Button 
            icon="pi pi-arrow-left" 
            label="Sair"
            text
            severity="danger"
            className="text-red-500 font-bold"
            onClick={() => navigate("/dashboard")} 
          />
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 m-0 whitespace-nowrap">
            Configurações do Sistema
          </h1>
        </div>
      </header>

      <main className="mx-auto mt-2">
        <BlockUI blocked={loading} template={loaderTemplate}>
            <div className="bg-white p-6 md:p-10 rounded-xl shadow-md border border-slate-200">
            
            <div className="mb-8 border-b border-slate-100 pb-4">
                <p className="text-slate-500 text-sm">
                Gerencie as definições globais da sua conta e preferências do sistema.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-12 gap-x-6 gap-y-10">
                {configs.map((config) => {
                    const Component = COMPONENT_MAP[config.componentType];
                    if (!Component) {
                        return null;
                    }

                    return (
                        <Component
                        key={config.chave}
                        name={config.chave}
                        control={control}
                        label={config.label}
                        required={config.required}
                        colSpan={6} 
                        showClear
                        />
                    );
                })}

                <div className="col-span-12 mt-4 pt-6 border-t border-slate-100 flex justify-end">
                    {canALTERAR && <Button 
                        type="submit" 
                        label="Salvar" 
                        icon="pi pi-check" 
                        className="w-full md:w-auto p-3 font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg" 
                    />}
                </div>
            </form>
            </div>
        </BlockUI>
      </main>
    </div>
  );
};