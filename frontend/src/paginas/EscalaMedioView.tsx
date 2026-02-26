import { AppSelect } from "@/componentes/select/AppSelect";
import clsx from "clsx"
import { Button } from "primereact/button"
import {  useNavigate, useParams } from "react-router-dom";
import { FormProvider, useForm } from 'react-hook-form';
import { getColSpanClass } from "@/utils/GridUtils";
import type { Medico } from "@/types/medico";
import { AppEscalaSemanal } from "@/componentes/escala/AppEscalaSemanal";
import type { EscalaSemana } from "@/types/escala";
import { server } from "@/api/server";
import { DateUtils } from "@/utils/DateUtils";
import { useEffect, useState } from "react";

export const EscalaMedicoView = () => {
    const navigate = useNavigate();
    const { sigla } = useParams();
    const isPublicRoute = location.pathname.startsWith('/view/escala');
    const [loading, setLoading] = useState(false);
    const [exibirGrid, setExibirGrid] = useState(false);
    const [ inicio, setInicio ] = useState<boolean>(true);

    const methods = useForm<EscalaSemana[]>({    
    });
    const [ medicoId, setMedicoId] = useState<Number | undefined>(undefined);
    const { control } = methods;

    useEffect(() => {
        if (sigla && medicoId && inicio) {
            handleSearch();
            setInicio(false);
        }
    }, [medicoId, sigla]);

    const medicoTemplate = (option: Medico) => {
        if (!option) {
            return "Selecione um médico";
        }
        return option.sigla ? `${option.nome} - ${option.sigla}` : option.nome;
    };

    const minhaRegraDeFiltro = (medico: Medico) => {
        if (!sigla) {
            return false;
        } // Se não tem sigla na URL, mostra todos (não filtra nada)
        return medico.sigla.toLowerCase() === sigla.toLowerCase(); // Se tem sigla, só retorna o médico que der 'match'
    };

    const handleSearch = async () => {
        if (!medicoId) {
            return;
        }
        
        setLoading(true);
        try {
            const escalasSemanas = await server.api_public.listar<EscalaSemana[]>(
                '/api/public/escala/escalassemanais', 
                { medicoId, data: DateUtils.paraISO(new Date()) }
            );
            methods.reset(escalasSemanas as any);
            setExibirGrid(true); // Exibe o grid apenas após o sucesso da busca
        } finally {
            setLoading(false);
        }
    }

    return (
        <FormProvider {...methods}>
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm z-20">
                    {/* {(isSyncing || hasChangesToSave) && <div className="sync-glow-bar" />} */}
                    <div className="flex items-center gap-3">
                        {/* O botão sair sai do FAB e vem para o padrão mobile/tablet: Canto superior esquerdo */}
                        {!isPublicRoute && (
                            <>
                            <Button 
                                icon="pi pi-times" 
                                label="Sair"
                                text
                                severity="danger" // Vermelho para indicar saída/fechamento
                                className="hidden md:flex h-11 px-4 border-red-200 text-red-500 hover:bg-red-50"
                                onClick={() => navigate(-1)} 
                            />
                            <Button 
                                icon="pi pi-arrow-left" 
                                className="p-button-rounded p-button-text p-button-secondary md:hidden border-red-200 text-red-500" 
                                onClick={() => navigate(-1)} 
                            />
                            </> 
                        )}
                        <h1 className="text-lg md:text-xl font-black text-slate-700 m-0">
                            Escala Semana Médicos
                        </h1>
                    </div>
                </header>

                <div className="bg-indigo-50 border-b border-indigo-100 pt-7 px-4 shadow-inner transition-all z-10 animate-fadein">
                {/* Container das clínicas - Com scroll horizontal suave nativo */}
                <div className="grid grid-cols-12 gap-4">
                    <div className={getColSpanClass(10)}>
                        {/* Substitua isso pelo seu componente <ClinicasPanel clinicas={clinicas} /> se ele suportar scroll horizontal flex */}
                        <AppSelect
                            name='medicoId'
                            value={medicoId}
                            label='Médico'
                            url="/api/public/escala/medicos"
                            filterParams={{ ativo: true }}
                            optionLabel="nome"
                            optionValue="id"
                            itemTemplate={medicoTemplate}
                            valueTemplate={medicoTemplate}
                            public_back
                            onChange={(e) => {
                                setMedicoId(e.value);
                                setExibirGrid(false);
                                methods.reset();
                            }}
                            filterFn={isPublicRoute ? minhaRegraDeFiltro : undefined}
                        />
                    </div>
                    <div className={getColSpanClass(2)}>
                        <Button 
                            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-search"}
                            label={loading ? "Pesquisando..." : "Abrir Escalas"}
                            className={clsx(
                                "flex flex-center w-full h-[38px] mt-1.5 p-button-sm shadow-sm transition-all p-1",
                                "bg-blue-600 border-blue-600 text-white",
                            )}
                            disabled={!medicoId || loading} 
                            onClick={handleSearch} // Variável hipotética para controlar a UI
                        />
                    </div>
                </div>
            </div>

            <main className="flex-grow p-4 overflow-y-auto">
                {!exibirGrid ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <i className="pi pi-search text-5xl mb-4"></i>
                        <p className="font-medium">Selecione um médico para visualizar a escala</p>
                    </div>
                ) : (
                    <div className="animate-fadein">
                        {/* Aqui você pode colocar uma DataTable ou o Grid de Sudoku filtrado */}
                        <AppEscalaSemanal 
                            control={control} 
                        />
                    </div>
                )}
            </main>
        </div>
        </FormProvider>
    )
}