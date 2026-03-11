import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useWatch, type Control, useFormContext, type FieldValues, type Path } from 'react-hook-form';
import { server } from '@/api/server';
import { getIntervalosEscala } from '@/types/escalaHelper';
import type { Estabelecimento } from '@/types/estabelecimento';
import { type EscalaItem, type EscalaSemana } from '@/types/escala';
import { DateUtils } from '@/utils/DateUtils';

interface CelulaGridProps {
    cor?: string;
    icone?: string;
    bloqueado: boolean;
    estId: number;
    hora: string;
    marcado: boolean;
    onToggle: (estId: number, hora: string) => void;
}

interface AppEscalaDiariaProps<T extends FieldValues> {
    control: Control<T>;
    dataAtivaExterno?: Date | null;
    medicoId: number;
}

const CelulaGrid = memo(({ marcado, cor, icone, bloqueado, estId, hora, onToggle }: CelulaGridProps) => {
    const [localSelected, setLocalSelected] = useState(marcado);

    useEffect(() => {
        setLocalSelected(marcado);
    }, [marcado]);

    useEffect(() => {
        const handleExclusividade = (e: any) => {
            const { hora: horaEvento, estId: idEvento } = e.detail;
            if (horaEvento === hora && idEvento !== estId) {
                setLocalSelected(false);
            }
        };

        window.addEventListener('escala-exclusividade', handleExclusividade);
        return () => window.removeEventListener('escala-exclusividade', handleExclusividade);
    }, [hora, estId]);

    const handleInternalToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        if (bloqueado) return;
        
        const novoEstado = !localSelected;
        setLocalSelected(novoEstado); 

        if (novoEstado) {
            window.dispatchEvent(new CustomEvent('escala-exclusividade', { 
                detail: { hora, estId } 
            }));
        }

        onToggle(estId, hora);
    };

    return (
        <div
            onClick={handleInternalToggle}
            className={`flex items-center justify-center transition-all min-h-[28px] min-w-[28px] border-r border-b  border-slate-300
                ${bloqueado ? 'cursor-not-allowed opacity-40 bg-slate-50/50' : 'cursor-pointer hover:bg-blue-50/50'}`}
        >
            {localSelected ? (
                <div
                    className={`w-[28px] h-[28px] rounded-full border border-white shadow-inne flex items-center justify-center animate-fadein overflow-hidden
                        ${bloqueado ? 'grayscale' : ''}`}
                    style={{ backgroundColor: cor?.startsWith('#') ? cor : `#${cor}` }}
                >
                    {icone ? (
                        <img 
                            src={icone.startsWith('data:') ? icone : `data:image/png;base64,${icone}`}
                            className="object-contain"
                        />
                    ) : <i className=" text-white text-[11px]" />}
                </div>
            ) : (
                !bloqueado && <div className="w-[28px] h-[p28x] bg-slate-200 rounded-full opacity-30"></div>
            )}
        </div>
    );
});

CelulaGrid.displayName = 'CelulaGrid';

const normalizarSemanas = (valor: unknown): EscalaSemana[] => {
    if (!valor) {
        return [];
    }
    if (Array.isArray(valor)) {
        return valor as EscalaSemana[];
    }
    
    if (typeof valor === 'object') {
        const data = (valor as any).semana || (valor as any).semanas || (valor as any).escala;
        if (Array.isArray(data)) {
            return data;
        }
        if ('escala' in valor) {
            return [valor as EscalaSemana];
        }
    }
    return [];
};
const normalizarData = (valor: unknown): string => {
    if (!valor) return '';

    if (typeof valor === 'string') {
        return valor.split('T')[0];
    }

    return DateUtils.paraISO(valor as Date);
};

export const AppEscalaDiaria = <T extends FieldValues>({
    control,
    dataAtivaExterno,
    medicoId,
}: AppEscalaDiariaProps<T>) => {
    const { setValue, getValues } = useFormContext<T>();
    const [dataAtiva, setDataAtiva] = useState(new Date());
    const [estabelecimentos, setEstabelecimentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [ arquivada, setArquivada] = useState(false);
    const dataStr = useMemo(() => DateUtils.paraISO(dataAtiva), [dataAtiva]);

    const isHoje = useMemo(() => {
        const hojeStr = DateUtils.paraISO(new Date());
        return hojeStr === dataStr;
    }, [dataStr]);

    const HORARIOS = useMemo(() => getIntervalosEscala(), []);
    const watchSemanas = useWatch({ control, name: 'semana' as Path<T>});

    const semanas = useMemo(() => {
        return normalizarSemanas(watchSemanas);
    }, [watchSemanas]);

    useEffect(() => {
        setLoading(true);
        server.api.listar<any>('/estabelecimento', { ativo: true })
            .then(res => setEstabelecimentos(res))
            .catch(() => setEstabelecimentos([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (dataAtivaExterno instanceof Date) {
            setDataAtiva(dataAtivaExterno);
        }
    }, [dataAtivaExterno]);

    const atualizarStatusBloqueio = useCallback(async (data: any) => {
        try {
          const jaArquivado = await server.api.postCustomizada<boolean>(
            '/sudoku', 
            '/arquivado', 
            { data: DateUtils.paraISO(data), medicoId: medicoId }
          );
          setArquivada(String(jaArquivado) === 'true');
        } catch (e) {
          setArquivada(false);
        }
    }, []);

    useEffect(() => {
        const consultaStatus = async () => {
            await atualizarStatusBloqueio(dataAtiva);
        }
        consultaStatus();
    }, [dataAtiva])

    const diaAtual = useMemo(() => {
        if (!semanas.length) {
            return undefined;
        }
    
        for (const semana of semanas) {
            if (!semana.escala) {
                continue;
            }
            
            const encontrado = semana.escala.find((dia) => {
                const dataBanco = normalizarData(dia.data);
                return dataBanco === dataStr; 
            });
    
            if (encontrado) {
                return encontrado;
            }
        }
        return undefined;
    }, [dataStr, semanas]);

    const marcacoesPorHora = useMemo(() => {
        const mapa = new Map<string, EscalaItem>();
    
        if (diaAtual?.itens) {
            diaAtual.itens.forEach((item) => {
                const hItem = item.hora?.substring(0, 5) || item.hora;
                mapa.set(hItem, {
                    ...item,
                    estabelecimentoId: Number(item.estabelecimentoId) 
                });
            });
        }
        return mapa;
    }, [diaAtual]);
 
    const rows = useMemo(() => (
        estabelecimentos.map((est) => ({ ...est }))
    ), [estabelecimentos, marcacoesPorHora]);

    const handleToggle = useCallback((estId: number, hora: string) => {
        const valorAtual = getValues('semana' as Path<T>);
        const semanasAtuais = JSON.parse(JSON.stringify(valorAtual || []));
        
        const dataClicada = new Date(dataStr + 'T12:00:00');
        const diaSemana = dataClicada.getDay();
        const diffSegunda = dataClicada.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
        
        const segundaFeira = new Date(new Date(dataClicada).setDate(diffSegunda));
        const domingo = new Date(new Date(segundaFeira).setDate(segundaFeira.getDate() + 6));
        
        const dataInicioISO = DateUtils.paraISO(segundaFeira);
        const dataFimISO = DateUtils.paraISO(domingo);
    
        let semanaIndex = semanasAtuais.findIndex((s: EscalaSemana) => s.dataInicio === dataInicioISO);

        if (semanaIndex === -1) {
            const novaSemana: EscalaSemana = {
                dataInicio: dataInicioISO,
                dataFim: dataFimISO,
                medicoId: medicoId,
                escala: []
            };
            semanasAtuais.push(novaSemana);
            semanaIndex = semanasAtuais.length - 1;
        }
    
        const semana = semanasAtuais[semanaIndex];
        if (!semana.escala) semana.escala = [];
    
        const diaIndex = semana.escala.findIndex((d: any) => normalizarData(d.data) === dataStr);
        const horaAlvo = hora.substring(0, 5);
    
        if (diaIndex === -1) {
            semana.escala.push({
                data: dataStr,
                medicoId: medicoId,
                itens: [{ 
                    estabelecimentoId: estId, 
                    hora, 
                    cor: estabelecimentos.find(e => e.id === estId)?.cor,
                    icone: estabelecimentos.find(e => e.id === estId)?.icone
                }]
            });
        } else {
            const dia = semana.escala[diaIndex];
            const jaMarcado = dia.itens?.some((it: any) => 
                (it.hora?.substring(0, 5) || it.hora) === horaAlvo && 
                Number(it.estabelecimentoId) === Number(estId)
            );

            dia.itens = (dia.itens || []).filter((it: any) => 
                (it.hora?.substring(0, 5) || it.hora) !== horaAlvo
            );
    
            if (!jaMarcado) {
                const ent = estabelecimentos.find(e => Number(e.id) === Number(estId));
                dia.itens.push({ estabelecimentoId: estId, hora, cor: ent?.cor, icone: ent?.icone });
            }
        }
        const novoEstadoArray = [...semanasAtuais];
        setValue('semana'  as Path<T>, novoEstadoArray as T[Path<T>], { shouldDirty: true, shouldValidate: true });
    }, [getValues, setValue, dataStr, estabelecimentos, medicoId]);

    const isHoraBloqueada = (horaStr: string, dataStr: string) => {
        const agora = new Date();
        const hojeStr = DateUtils.paraISO(agora.toISOString());
    
        if (dataStr < hojeStr) {
            return true; 
        }
        if (dataStr > hojeStr) {
            return false; 
        }

        const [h, m] = horaStr.split(':').map(Number);
        const limite = new Date();
        limite.setHours(h, m, 0, 0);
    
        return limite <= agora;
    };

    const getNomeEstabelecimento = (estabelecimento: Estabelecimento): string => {
        if (estabelecimento.sigla) {
            return estabelecimento.sigla;
        }

        if (estabelecimento.nome?.length <= 5) {
            return estabelecimento.nome;
        }

        return estabelecimento.nome?.substring(0, 5);
    };

    if (loading || !estabelecimentos.length) {
        return <div className="flex justify-center p-8"><ProgressSpinner style={{ width: '40px' }} /></div>;
    }

    return (
        <div className="flex flex-col gap-0 overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
            <div className="flex items-center justify-between bg-slate-50 p-4 border-b border-slate-200">
              <Button
                    icon="pi pi-chevron-left"
                    className="p-button-rounded p-button-text text-slate-400"
                    onClick={() => { const d = new Date(dataAtiva); d.setDate(d.getDate() - 1); setDataAtiva(d); }}
                    disabled={isHoje}
                />
                <div className="text-center flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                            Escala Diária
                        </span>
                        {isHoje && (
                            <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm uppercase tracking-tighter">
                                Hoje
                            </span>
                        )}
                        {arquivada && 
                            <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm uppercase tracking-tighter">
                                    Arquivada
                            </span>
                        }
                    </div>
                    <span className="text-lg font-black text-slate-700 capitalize leading-none">
                        {dataAtiva.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </span>
                </div>
                <Button
                    icon="pi pi-chevron-right"
                    className="p-button-rounded p-button-text text-slate-400"
                    onClick={() => { const d = new Date(dataAtiva); d.setDate(d.getDate() + 1); setDataAtiva(d); }}
                />
            </div>

            <DataTable
                key={dataStr}
                value={rows} 
                showGridlines
                className="p-datatable-sm"
                scrollable
                dataKey="id"
                scrollHeight="450px">
                <Column
                    header="Clinica / Hospitais"
                    frozen
                    style={{ minWidth: '70px' }}
                    className="bg-slate-100 font-bold border-r border-b border-t border-slate-300 p-0"
                    headerClassName='border-r border-b border-t border-slate-300 '

                    headerStyle={{ justifyContent: 'center' }}  
                    pt={{
                        headerContent: { className: 'justify-center' }
                    }}
                    body={(est) => (
                        <div className="flex items-center gap-1">
                            <div 
                                className="w-[29px] h-[29px] pl-1 rounded-full shadow-inner border-b border-black/5 flex items-center justify-center overflow-hidden" 
                                style={{ backgroundColor: est.cor?.startsWith('#') ? est.cor : `#${est.cor}` }}
                            >
                                {est.icone ? (
                                    <img 
                                        src={est.icone.startsWith('data:') ? est.icone : `data:image/png;base64,${est.icone}`} 
                                        className="object-contain"
                                        alt={est.nome}
                                    />
                                ) : null}
                            </div>
                            <span className="truncate text-[10px] uppercase tracking-wide">{getNomeEstabelecimento(est)}</span>
                        </div>
                    )}
                />

                {HORARIOS.map(horario => {
                    const estaBloqueado = isHoraBloqueada(horario.field, dataStr); 
                    return (<Column
                        key={`${dataStr}-${horario.field}`}
                        header={(
                            <div className="flex justify-center items-center">
                                <span className={`text-[13px] font-bold tracking-tight ${estaBloqueado ? 'text-slate-400' : 'text-blue-600'}`}>
                                    {horario.header}
                                </span>
                            </div>
                        )}
                        headerClassName="bg-slate-50 border-b border-slate-300 p-0 min-w-[24px]"
                        headerStyle={{ justifyContent: 'center' }}
                        pt={{
                            headerContent: { className: 'justify-center' }
                        }}
                        className='p-0'
                        body={(est) => {
                            const item = marcacoesPorHora.get(horario.field);
                            const estaMarcado = Number(item?.estabelecimentoId) === Number(est.id);

                            return (
                                <CelulaGrid
                                    key={`${dataStr}-${horario.field}-${est.id}-${item?.estabelecimentoId}`}
                                    cor={estaMarcado ? (item?.cor || est.cor) : est.cor}
                                    icone={estaMarcado ? (item?.icone || est.icone) : est.icone}
                                    bloqueado={estaBloqueado}
                                    estId={est.id}
                                    hora={horario.field}
                                    marcado={estaMarcado}
                                    onToggle={handleToggle}
                                />
                            );
                        }}
                    />
                )}
                )}
            </DataTable>
        </div>
    );
};