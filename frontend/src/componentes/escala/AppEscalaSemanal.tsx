import { useState, useMemo, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { useWatch, type Control } from 'react-hook-form';
import type { EscalaSemana } from '@/types/escala';
import { getIntervalosEscala } from '@/types/escalaHelper';
import { DateUtils } from '@/utils/DateUtils';

interface AppEscalaSemanalProps {
    control: Control<EscalaSemana[]>;
    onAgendar?: (data: Date) => void;
}

export const AppEscalaSemanal = ({ control, onAgendar }: AppEscalaSemanalProps) => {
    const [dataReferencia, setDataReferencia] = useState(new Date());

    const watchValue = useWatch({ control })

    const semanas = useMemo(() => {
        if (Array.isArray(watchValue)) return watchValue;
        
        // Se vier como objeto (comum no RHF ao usar reset em array raiz), 
        // extraímos os valores que são do tipo objeto/escala
        if (watchValue && typeof watchValue === 'object') {
            return Object.values(watchValue).filter(item => 
                item && typeof item === 'object' && 'dataInicio' in item
            ) as EscalaSemana[];
        }
        return [] as EscalaSemana[];
    }, [watchValue]);
    
    const { medicoId, dataInicioEscala } = useMemo(() => {
        if (semanas.length > 0) {
            // Como todos os itens são do mesmo médico, pegamos do primeiro
            return {
                medicoId: semanas[0].medicoId,
                dataInicioEscala: semanas[0].dataInicio
            };
        }
        return { medicoId: undefined, dataInicioEscala: undefined };
    }, [semanas]); // Só recalcula se a lista de semanas mudar

    const listaDeEscalasVisivel = useMemo(() => {
        const base = new Date(dataReferencia);
        const diaSemana = base.getDay(); 
        const diff = base.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
        const segundaVisivel = new Date(base.setDate(diff));
        const segundaISO = DateUtils.paraISO(segundaVisivel);
    
        // Proteção contra o erro 'find is not a function'
        if (!Array.isArray(semanas)) return [];
    
        // Busca a semana que corresponde à segunda-feira exibida na tela
        const semanaEncontrada = semanas.find(s => s.dataInicio === segundaISO);
        
        // Conforme o seu console, os dias estão dentro de 's.escala'
        return semanaEncontrada ? semanaEncontrada.escala : [];
    }, [dataReferencia, semanas]);

    useEffect(() => {
        // Se houver uma data vinda do banco (Edição), sincroniza o calendário
        if (dataInicioEscala) {
            const novaData = new Date(dataInicioEscala + 'T12:00:00');
            
            // Evita atualização infinita se a data for a mesma
            if (novaData.getTime() !== dataReferencia.getTime()) {
                setDataReferencia(novaData);
            }
        }
        // Se dataInicioEscala for null/undefined, o dataReferencia 
        // permanece como o 'new Date()' definido no useState.
    }, [dataInicioEscala]);

    // --- FUNÇÃO DE CONVERSÃO PARA BASE64 ---
    const formatarIcone = (icone: any): string => {
        if (!icone) {
            return '';
        }
        
        // 1. Se já for string (Base64 pronta)
        if (typeof icone === 'string') {
            if (icone.length < 10) return ''; // String vazia ou inválida
            return icone.startsWith('data:') ? icone : `data:image/png;base64,${icone}`;
        }
        
        // 2. Se for Array de Números (Byte Array)
        if (Array.isArray(icone) || icone instanceof Uint8Array) {
            try {
                // Forma moderna e segura de converter Byte Array para Base64
                const uint8Array = new Uint8Array(icone);
                let binary = '';
                const len = uint8Array.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(uint8Array[i]);
                }
                return `data:image/png;base64,${window.btoa(binary)}`;
            } catch (e) {
                console.error("Erro na conversão do ícone:", e);
                return '';
            }
        }
        
        return '';
    };

    const colunasHoras = useMemo(() => getIntervalosEscala(), []);

    const navegarSemana = (offset: number) => {
        setDataReferencia(prev => {
            const novaData = new Date(prev);
            novaData.setDate(prev.getDate() + offset);
            return novaData;
        });
    };

    const verificarBloqueio = (dataISO: string, horaStr: string) => {
        // 1. Pegamos o momento exato do "agora"
        const agora = new Date();
            
        // 2. Criamos a data de início do intervalo para aquela célula específica
        // Concatenamos a data (YYYY-MM-DD) com a hora (HH:mm)
        const dataInicioIntervalo = new Date(`${dataISO}T${horaStr}:00`);

        // 3. Bloqueio:
        // Se a data de início do intervalo for menor ou igual ao agora, bloqueia.
        // Exemplo: Se são 07:05 e o intervalo começa as 07:00, já está bloqueado.
        return dataInicioIntervalo <= agora;
    };

    const linhasDias = useMemo(() => {
        const base = new Date(dataReferencia);
        // Ajuste para Segunda-feira como dia 1 (ISO 8601)
        // No JS: Dom=0, Seg=1, Ter=2...
        const diaSemana = base.getDay(); 
        const diff = base.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
        
        const segundaRef = new Date(base);
        segundaRef.setDate(diff);
        segundaRef.setHours(0, 0, 0, 0);
    
        return Array.from({ length: 7 }, (_, i) => {
            const dataDia = new Date(segundaRef);
            dataDia.setDate(segundaRef.getDate() + i);
            const dataISO = DateUtils.paraISO(dataDia);
    
            return {
                id: i,
                data: dataISO,
                nomeDia: dataDia.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase(),
                dataExibicao: dataDia.getDate(),
                isHoje: DateUtils.paraISO(new Date()) === dataISO,
                _medicoAtivo: medicoId
            };
        });
    }, [dataReferencia, medicoId]);

    const isSemanaAtual = useMemo(() => {
        const hojeISO = DateUtils.paraISO(new Date());
        return linhasDias.some(dia => dia.data === hojeISO);
    }, [linhasDias]);

    const labelSemana = useMemo(() => {
        const inicio = new Date(linhasDias[0].data + 'T12:00:00');
        const fim = new Date(linhasDias[6].data + 'T12:00:00');
        return `${inicio.getDate()} a ${fim.getDate()} de ${inicio.toLocaleDateString('pt-BR', { month: 'long' })}`;
    }, [linhasDias]);

    // --- RENDERIZADOR DE CÉLULA COM UX MODERNA ---
    const renderCelulaHorario = (rowData: any, hora: string) => {
        const escalaDoDia = listaDeEscalasVisivel?.find((e: any) => e.data === rowData.data);
        const alocacao = escalaDoDia?.itens?.find((item: any) => {
            const hItem = item.hora?.substring(0, 5) || item.hora;
            return hItem === hora;
        });

        const bloqueado = !medicoId || verificarBloqueio(rowData.data, hora);

        if (alocacao) {
            const iconeBase64 = formatarIcone(alocacao.icone);
            return (
                <div className={`flex items-center justify-center h-[30px] min-w-[30px] ${bloqueado ? 'cursor-not-allowed' : ''}`}>
                    <div 
                        className={`w-[30px] h-[30px] rounded-full shadow-md flex items-center justify-center border-2 border-white transition-transform shadow-inne overflow-hidden
                                    ${bloqueado ? 'opacity-65' : 'hover:scale-110 shadow-md'}`}
                        style={{ backgroundColor: alocacao.cor?.startsWith('#') ? alocacao.cor : `#${alocacao.cor}` }}
                    >
                        {iconeBase64 ? (
                            <img src={iconeBase64} className="w-[32px] h-[32px] object-contain" alt="Hosp" />
                        ) : (
                            <i className=" text-white text-[11px]" />
                        )}
                    </div>
                </div>
            );
        }

        if (bloqueado) {
            return (
                <div className="flex items-center justify-center w-full h-full bg-slate-50/50 cursor-not-allowed">
                    <div className="w-[14px] h-[14px] bg-slate-200 rounded-full" />
                </div>
            );
        }

        // Slot Vazio Moderno (Ghost Slot)
        return (
            <div className="flex items-center justify-center w-full h-full group cursor-pointer"
                onClick={() => {
                    // Converte a string YYYY-MM-DD da linha para objeto Date
                    const [ano, mes, dia] = rowData.data.split('-').map(Number);
                    const dataSelecionada = new Date(ano, mes - 1, dia, 12, 0, 0);
                    onAgendar?.(dataSelecionada);
                }}
            >
                {/* Ícone de "vazio" mais visível (sem opacity-20) */}
                {/* {onAgendar && <i className="pi pi-minus-circle text-[14px] text-slate-400 group-hover:hidden animate-fadein"></i>} */}
                
                {/* Ícone de "adicionar" no hover */}
                {/* {onAgendar && <i className="pi pi-plus-circle text-[20px] text-blue-600 hidden group-hover:block font-bold animate-fadein"></i>} */}

                <div className="relative flex items-center justify-center">
                    {onAgendar ? (
                        <>
                            {/* Visual padrão: um "mais" bem discreto ou ponto azulado */}
                            <i className="pi pi-plus text-[10px] text-slate-300 group-hover:hidden transition-all"></i>
                            
                            {/* Visual Hover: Botão de ação completo */}
                            <div className="hidden group-hover:flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full shadow-lg shadow-blue-200 animate-scalein">
                                <i className="pi pi-plus text-white text-[12px] font-bold"></i>
                            </div>
                        </>
                    ) : (
                        // Se for apenas visualização (sem onAgendar), mostra uma tag discreta de "Livre"
                        <div className="w-6 h-1 bg-slate-200 rounded-full group-hover:bg-emerald-100 transition-colors" title="Livre"></div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between bg-slate-50 p-4 border-b border-slate-200">
                <Button icon="pi pi-chevron-left" className="p-button-rounded p-button-text text-slate-400" onClick={() => navegarSemana(-7)} />
                <div className="text-center flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Escala Semanal</span>
                        {isSemanaAtual && <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm uppercase">Semana Atual</span>}
                    </div>
                    <span className="text-lg font-black text-slate-700 capitalize leading-none">{labelSemana}</span>
                </div>
                <Button icon="pi pi-chevron-right" className="p-button-rounded p-button-text text-slate-400" onClick={() => navegarSemana(7)} />
            </div>

            <div className="overflow-auto">
                <DataTable value={linhasDias} 
                           showGridlines 
                           className="p-datatable-sm" 
                           responsiveLayout="scroll"
                           stateStorage="local"
                           scrollable
                >
                    <Column 
                        header="S/D" 
                        className="bg-slate-200 border-r" 
                        style={{ minWidth: '40px' }} 
                        frozen // FIXA A COLUNA
                        alignFrozen="left"
                        body={(rowData) => (
                            <div className={`flex flex-row items-center justify-center gap-2 ${rowData.isHoje ? 'text-blue-600' : 'text-slate-500'}`}>
                                <span className="text-base font-black leading-none">
                                    {rowData.dataExibicao}
                                </span>
                            </div>
                        )}
                    />
                    {colunasHoras.map(hora => (
                        <Column 
                            key={hora.field} 
                            header={(
                                <div className="flex justify-center items-center">
                                    <span className={`text-[12px] font-bold tracking-tight`}>
                                        {hora.header}
                                    </span>
                                </div>
                            )}
                            headerClassName="bg-slate-50 border-b border-slate-100 p-0 min-w-[28px]"
                            headerStyle={{ justifyContent: 'center' }}  
                            pt={{
                                headerContent: { className: 'justify-center' } // Força o alinhamento central no PrimeReact
                            }}
                            className='p-0'
                            body={(rowData) => renderCelulaHorario(rowData, hora.field)}
                        />
                    ))}
                </DataTable>
            </div>
        </div>
    );
};