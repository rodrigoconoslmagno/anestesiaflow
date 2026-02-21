import { useState, useEffect, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useWatch, type Control, useFormContext } from 'react-hook-form';
import { server } from '@/api/server';
import type { EscalaSemana } from '@/types/escala';
import { getIntervalosEscala } from '@/types/escalaHelper';

interface AppEscalaDiariaProps {
    control: Control<EscalaSemana>;
    dataAtivaExterno?: Date | null;
}

const CelulaGrid = ({ marcado, cor, icone, onClick, bloqueado }: any) => {
    return (
        <div 
            // Só executa o clique se NÃO estiver bloqueado
            onClick={!bloqueado ? onClick : undefined} 
            className={`flex items-center justify-center transition-all min-h-[44px] min-w-[44px] border-r border-b  border-slate-300
                ${bloqueado ? 'cursor-not-allowed opacity-40 bg-slate-50/50' : 'cursor-pointer hover:bg-blue-50/50'}`}
        >
            {marcado ? (
                <div 
                    className={`w-[32px] h-[32px] rounded-full border border-white shadow-inne flex items-center justify-center animate-fadein overflow-hidden
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
                // Se não estiver marcado e não estiver bloqueado, mostra o pontinho de guia
                !bloqueado && <div className="w-[28px] h-[p28x] bg-slate-200 rounded-full opacity-30"></div>
            )}
        </div>
    );
};

export const AppEscalaDiaria = ({ control, dataAtivaExterno }: AppEscalaDiariaProps) => {
    const { setValue, getValues } = useFormContext();
    const [dataAtiva, setDataAtiva] = useState(new Date());
    const [estabelecimentos, setEstabelecimentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const dataStr = useMemo(() => {
        const y = dataAtiva.getFullYear();
        const m = String(dataAtiva.getMonth() + 1).padStart(2, '0');
        const d = String(dataAtiva.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, [dataAtiva]);

    const isHoje = useMemo(() => new Date().toDateString() === dataAtiva.toDateString(), [dataAtiva]);

    const HORARIOS = useMemo(() => getIntervalosEscala(), []);

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
    
    const escalas = useWatch({ 
        control, 
        name: 'escala',
        defaultValue: [] 
    });

    const rows = useMemo(() => {
        return estabelecimentos.map(est => ({
            ...est,
            // Injetamos um carimbo de tempo ou a própria escala para mudar a referência do objeto
            _lastUpdate: {  escalas, dataStr }
        }));
    }, [estabelecimentos, escalas, dataStr]);

    // 2. Memorizamos a lógica de busca para não recomputar desnecessariamente, 
    // mas ela DEPENDE de 'escalas'
    const verificarMarcacao = (estId: number, hora: string) => {
        const diaAtual = escalas.find((e: any) => e.data === dataStr);
        if (!diaAtual) return null;

        return diaAtual.itens?.find((it: any) => {
            const hItem = it.hora?.substring(0, 5) || it.hora;
            return hItem === hora && Number(it.estabelecimentoId) === Number(estId);
        });
    };

    const handleToggle = (estId: number, hora: string) => {
        const valorAtual = getValues('escala') || [];
        const novasEscalas = JSON.parse(JSON.stringify(valorAtual));
        
        const diaIndex = novasEscalas.findIndex((e: any) => e.data === dataStr);
        const entidadeEst = estabelecimentos.find(e => Number(e.id) === Number(estId));
    
        if (diaIndex === -1) {
            // Se o dia não existe, criamos um novo com o item
            novasEscalas.push({
                data: dataStr,
                medicoId: getValues('medicoId') || 0,
                itens: [{ estabelecimentoId: estId, hora, cor: entidadeEst?.cor, icone: entidadeEst?.icone }]
            });
        } else {
            const itens = novasEscalas[diaIndex].itens || [];
            
            // 1. Procuramos se JÁ EXISTE uma marcação para ESTA HORA (em qualquer estabelecimento)
            const itemExistenteIndex = itens.findIndex((it: any) => {
                const hItem = it.hora?.substring(0, 5) || it.hora;
                return hItem === hora;
            });
    
            if (itemExistenteIndex > -1) {
                const itemExistente = itens[itemExistenteIndex];
                
                // 2. Se o clique foi no MESMO estabelecimento que já estava marcado, REMOVEMOS (Toggle off)
                if (Number(itemExistente.estabelecimentoId) === Number(estId)) {
                    itens.splice(itemExistenteIndex, 1);
                } else {
                    // 3. Se o clique foi em um estabelecimento DIFERENTE para a mesma hora:
                    // Removemos a marcação antiga e adicionamos a nova (Substituição)
                    itens.splice(itemExistenteIndex, 1);
                    itens.push({ 
                        estabelecimentoId: estId, 
                        hora, 
                        cor: entidadeEst?.cor, 
                        icone: entidadeEst?.icone 
                    });
                }
            } else {
                // 4. Se não havia nada marcado nessa hora, apenas adicionamos
                itens.push({ 
                    estabelecimentoId: estId, 
                    hora, 
                    cor: entidadeEst?.cor, 
                    icone: entidadeEst?.icone 
                });
            }
            
            novasEscalas[diaIndex].itens = itens;
        }
    
        // Atualiza o formulário e dispara a reatividade do grid
        setValue('escala', novasEscalas, { shouldDirty: true });
    };

    const isHoraBloqueada = (horaStr: string) => {
        if (!isHoje) {
            // Se a data ativa for anterior a hoje, bloqueia tudo
            const hoje = new Date();
            hoje.setHours(0,0,0,0);
            return dataAtiva < hoje;
        }
        
        const agora = new Date();
        // Criamos a data de início do intervalo para hoje
        const dataInicioIntervalo = new Date(`${dataStr}T${horaStr}:00`);
        
        // Bloqueia se o início do intervalo já passou
        return dataInicioIntervalo <= agora;
    };

    if (loading) {
        return <div className="flex justify-center p-8"><ProgressSpinner style={{ width: '40px' }} /></div>;
    }

    console.log("analise", escalas)

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
                value={rows} 
                stateStorage="local"
                showGridlines 
                className="p-datatable-sm" 
                scrollable 
                dataKey="id" 
                scrollHeight="450px">
                <Column 
                    header="Clinica / Hospitais" 
                    frozen 
                    style={{ minWidth: '70px' }} 
                    className="bg-slate-100 font-bold border-r border-b border-t border-slate-300 "
                    headerClassName='border-r border-b border-t border-slate-300 '
                    body={(est) => (
                        <div className="flex items-center gap-3">
                            {/* Círculo de cor com suporte a ícone */}
                            <div 
                                className="w-[28px] h-[28px] rounded-full shadow-inner border-b border-black/5 flex items-center justify-center overflow-hidden" 
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
                            <span className="truncate text-[11px] uppercase tracking-wide">{est.nome}</span>
                        </div>
                    )}
                />

                {HORARIOS.map(horario => {
                    const bloqueado = isHoraBloqueada(horario.field);
                    return (<Column 
                        key={horario.field} 
                        header={(
                            <div className="flex justify-center items-center">
                                <span className={`text-[13px] font-bold tracking-tight ${bloqueado ? 'text-slate-400' : 'text-blue-600'}`}>
                                    {horario.header}
                                </span>
                            </div>
                        )}
                        headerClassName="bg-slate-50 border-b border-r border-slate-300 p-0 min-w-[50px]"
                        headerStyle={{ justifyContent: 'center' }} 
                        pt={{
                            headerContent: { className: 'justify-center' } // Força o alinhamento central no PrimeReac
                        }}
                        className='p-0'
                        body={(est) => {
                            const item = verificarMarcacao(est.id, horario.field);
                            return (
                                <CelulaGrid 
                                    marcado={!!item}
                                    cor={item?.cor || est.cor}
                                    icone={item?.icone || est.icone}
                                    onClick={() => handleToggle(est.id, horario.field)}
                                    bloqueado={bloqueado}
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