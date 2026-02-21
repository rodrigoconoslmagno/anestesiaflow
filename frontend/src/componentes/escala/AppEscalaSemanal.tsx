import { useState, useMemo, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { useWatch, type Control } from 'react-hook-form';
import type { EscalaSemana } from '@/types/escala';
import { getIntervalosEscala } from '@/types/escalaHelper';

interface AppEscalaSemanalProps {
    control: Control<EscalaSemana>;
    onAgendar?: (data: Date) => void;
}

export const AppEscalaSemanal = ({ control, onAgendar }: AppEscalaSemanalProps) => {
    const medicoId = useWatch({ control, name: 'medicoId' });
    const listaDeEscalas = useWatch({ control, name: 'escala' }) || [];
    const [dataReferencia, setDataReferencia] = useState(new Date());
    const dataInicioEscala = useWatch({ control, name: 'dataInicio' });

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
        const diaSemana = base.getDay(); 
        const domingoRef = new Date(base);
        domingoRef.setDate(base.getDate() - diaSemana);
        domingoRef.setHours(0, 0, 0, 0);
    
        return Array.from({ length: 7 }, (_, i) => {
            const dataDia = new Date(domingoRef);
            dataDia.setDate(domingoRef.getDate() + i);
            const dataISO = dataDia.toISOString().split('T')[0];
    
            return {
                id: i,
                data: dataISO,
                nomeDia: dataDia.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase(),
                dataExibicao: dataDia.getDate(),
                isHoje: new Date().toISOString().split('T')[0] === dataISO,
                _medicoAtivo: medicoId
            };
        });
    }, [dataReferencia, medicoId]);

    const isSemanaAtual = useMemo(() => {
        const hojeISO = new Date().toISOString().split('T')[0];
        return linhasDias.some(dia => dia.data === hojeISO);
    }, [linhasDias]);

    const labelSemana = useMemo(() => {
        const inicio = new Date(linhasDias[0].data + 'T12:00:00');
        const fim = new Date(linhasDias[6].data + 'T12:00:00');
        return `${inicio.getDate()} a ${fim.getDate()} de ${inicio.toLocaleDateString('pt-BR', { month: 'long' })}`;
    }, [linhasDias]);

    // --- RENDERIZADOR DE CÉLULA COM UX MODERNA ---
    const renderCelulaHorario = (rowData: any, hora: string) => {
        const escalaDoDia = listaDeEscalas.find((e: any) => e.data === rowData.data);
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
                <i className="pi pi-minus-circle text-[14px] text-slate-400 group-hover:hidden animate-fadein"></i>
                
                {/* Ícone de "adicionar" no hover */}
                <i className="pi pi-plus-circle text-[20px] text-blue-600 hidden group-hover:block font-bold animate-fadein"></i>
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
                        header="Dia" 
                        className="bg-slate-100 border-r" 
                        style={{ minWidth: '100px' }} 
                        frozen // FIXA A COLUNA
                        alignFrozen="left"
                        body={(rowData) => (
                            <div className={`flex flex-row items-center justify-center gap-2 ${rowData.isHoje ? 'text-blue-600' : 'text-slate-500'}`}>
                                <span className="text-base font-black leading-none">
                                    {rowData.nomeDia}
                                </span>
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
                                    <span className={`text-[13px] font-bold tracking-tight`}>
                                        {hora.header}
                                    </span>
                                </div>
                            )}
                            headerClassName="bg-slate-50 border-b border-slate-100 p-0 min-w-[50px]"
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