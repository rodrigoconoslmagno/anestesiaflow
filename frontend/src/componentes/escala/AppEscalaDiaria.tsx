import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useWatch, type Control, useFormContext, type FieldValues, type Path } from 'react-hook-form';
import { server } from '@/api/server';
import { getIntervalosEscala } from '@/types/escalaHelper';
import type { Estabelecimento } from '@/types/estabelecimento';
import type { Escala, EscalaItem, EscalaSemana } from '@/types/escala';

interface AppEscalaDiariaProps<T extends FieldValues> {
    control: Control<T>;
    dataAtivaExterno?: Date | null;
    semanasPath?: Path<T>;
    escalaPath?: Path<T>;
    medicoIdPath?: Path<T>;
}

interface CelulaGridProps {
    marcado: boolean;
    cor?: string;
    icone?: string;
    bloqueado: boolean;
    estId: number;
    hora: string;
    onToggle: (estId: number, hora: string) => void;
}

const CelulaGrid = memo(({ marcado, cor, icone, bloqueado, estId, hora, onToggle }: CelulaGridProps) => {
    return (
        <div
            onClick={!bloqueado ? () => onToggle(estId, hora) : undefined}
            className={`flex items-center justify-center transition-all min-h-[28px] min-w-[28px] border-r border-b  border-slate-300
                ${bloqueado ? 'cursor-not-allowed opacity-40 bg-slate-50/50' : 'cursor-pointer hover:bg-blue-50/50'}`}
        >
            {marcado ? (
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

const getISODate = (data: Date) => {
    const y = data.getFullYear();
    const m = String(data.getMonth() + 1).padStart(2, '0');
    const d = String(data.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};


const normalizarData = (valor: unknown): string => {
    if (valor instanceof Date) {
        return getISODate(valor);
    }

    if (typeof valor === 'string') {
        return valor.substring(0, 10);
    }

    return '';
};


const normalizarSemanas = (valor: unknown): EscalaSemana[] => {
    if (Array.isArray(valor)) {
        return valor as EscalaSemana[];
    }

    if (valor && typeof valor === 'object' && 'escala' in valor) {
        return [valor as EscalaSemana];
    }

    return [];
};

export const AppEscalaDiaria = <T extends FieldValues>({
    control,
    dataAtivaExterno,
    semanasPath,
    escalaPath,
    medicoIdPath,
}: AppEscalaDiariaProps<T>) => {
    const { setValue, getValues } = useFormContext<T>();
    const [dataAtiva, setDataAtiva] = useState(new Date());
    const [estabelecimentos, setEstabelecimentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const dataStr = useMemo(() => getISODate(dataAtiva), [dataAtiva]);
    const isHoje = useMemo(() => new Date().toDateString() === dataAtiva.toDateString(), [dataAtiva]);
    const HORARIOS = useMemo(() => getIntervalosEscala(), []);

    const escalaCampo = escalaPath ?? ('escala' as Path<T>);
    const medicoCampo = medicoIdPath ?? ('medicoId' as Path<T>);
    const semanasCampo = semanasPath ?? escalaCampo;

    const watchEscala = useWatch({ control, name: escalaCampo });
    const watchMedicoId = useWatch({ control, name: medicoCampo });
    const watchSemanas = useWatch({ control, name: semanasCampo });

    const semanas = useMemo(() => {
        if (semanasPath) {
            return normalizarSemanas(watchSemanas);
        }

        const escalaDireta = Array.isArray(watchEscala) ? (watchEscala as Escala[]) : [];
        const medicoId = Number(watchMedicoId) || 0;

        return [{ medicoId, dataInicio: '', dataFim: '', escala: escalaDireta } as EscalaSemana];
    }, [semanasPath, watchEscala, watchMedicoId, watchSemanas]);

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

    const diaAtual = useMemo(() => {
        for (const semana of semanas) {
            const encontrado = semana.escala?.find((dia) => normalizarData(dia.data) === dataStr);
            if (encontrado) {
                return encontrado;
            }
        }

        return undefined;
    }, [dataStr, semanas]);

    const marcacoesPorHora = useMemo(() => {
        const mapa = new Map<string, EscalaItem>();

        diaAtual?.itens?.forEach((item) => {
            const hItem = item.hora?.substring(0, 5) || item.hora;
            mapa.set(hItem, item);
        });

        return mapa;
    }, [diaAtual]);

    const rows = useMemo(() => (
        estabelecimentos.map((est) => ({ ...est }))
    ), [estabelecimentos, marcacoesPorHora]);

    const localizarSemanaDia = useCallback((colecaoSemanas: EscalaSemana[], diaISO: string) => {
        let semanaIndex = colecaoSemanas.findIndex((semana) =>
            semana.escala?.some((dia) => normalizarData(dia.data) === diaISO)
        );

        if (semanaIndex < 0) {
            semanaIndex = colecaoSemanas.findIndex((semana) => {
                if (!semana.dataInicio || !semana.dataFim) return false;
                return diaISO >= semana.dataInicio && diaISO <= semana.dataFim;
            });
        }

        if (semanaIndex < 0) {
            semanaIndex = 0;
        }

        const semana = colecaoSemanas[semanaIndex];
        const diaIndex = semana?.escala?.findIndex((dia) => normalizarData(dia.data) === diaISO) ?? -1;

        return { semanaIndex, diaIndex };
    }, []);

    const handleToggle = useCallback((estId: number, hora: string) => {
        const entidadeEst = estabelecimentos.find(e => Number(e.id) === Number(estId));

        if (semanasPath) {
            const semanasAtuais = normalizarSemanas(getValues(semanasPath));
            if (!semanasAtuais.length) return;

            const novasSemanas = JSON.parse(JSON.stringify(semanasAtuais)) as EscalaSemana[];
            const { semanaIndex, diaIndex } = localizarSemanaDia(novasSemanas, dataStr);

            if (semanaIndex < 0 || !novasSemanas[semanaIndex]) return;

            const semana = novasSemanas[semanaIndex];
            const escalaSemana = semana.escala ?? [];

            if (diaIndex < 0) {
                escalaSemana.push({
                    data: dataStr,
                    medicoId: semana.medicoId,
                    itens: [{ estabelecimentoId: estId, hora, cor: entidadeEst?.cor, icone: entidadeEst?.icone }],
                });
            } else {
                const itens = escalaSemana[diaIndex].itens ?? [];
                const itemExistenteIndex = itens.findIndex((it) => {
                    const hItem = it.hora?.substring(0, 5) || it.hora;
                    return hItem === hora;
                });

                if (itemExistenteIndex > -1) {
                    const itemExistente = itens[itemExistenteIndex];

                    if (Number(itemExistente.estabelecimentoId) === Number(estId)) {
                        itens.splice(itemExistenteIndex, 1);
                    } else {
                        itens.splice(itemExistenteIndex, 1);
                        itens.push({ estabelecimentoId: estId, hora, cor: entidadeEst?.cor, icone: entidadeEst?.icone });
                    }
                } else {
                    itens.push({ estabelecimentoId: estId, hora, cor: entidadeEst?.cor, icone: entidadeEst?.icone });
                }

                escalaSemana[diaIndex].itens = itens;
            }

            semana.escala = escalaSemana;
            setValue(semanasPath, novasSemanas as T[Path<T>], { shouldDirty: true });
            return;
        }

        const valorAtual = (getValues(escalaCampo) as Escala[]) || [];
        const novasEscalas = JSON.parse(JSON.stringify(valorAtual)) as Escala[];

        const diaIndex = novasEscalas.findIndex((e) => normalizarData(e.data) === dataStr);

        if (diaIndex === -1) {
            novasEscalas.push({
                data: dataStr,
                medicoId: Number(getValues(medicoCampo)) || 0,
                itens: [{ estabelecimentoId: estId, hora, cor: entidadeEst?.cor, icone: entidadeEst?.icone }],
            });
        } else {
            const itens = novasEscalas[diaIndex].itens ?? [];
            const itemExistenteIndex = itens.findIndex((it) => {
                const hItem = it.hora?.substring(0, 5) || it.hora;
                return hItem === hora;
            });

            if (itemExistenteIndex > -1) {
                const itemExistente = itens[itemExistenteIndex];

                if (Number(itemExistente.estabelecimentoId) === Number(estId)) {
                    itens.splice(itemExistenteIndex, 1);
                } else {
                    itens.splice(itemExistenteIndex, 1);
                    itens.push({ estabelecimentoId: estId, hora, cor: entidadeEst?.cor, icone: entidadeEst?.icone });
                }
            } else {
                itens.push({ estabelecimentoId: estId, hora, cor: entidadeEst?.cor, icone: entidadeEst?.icone });
            }

            novasEscalas[diaIndex].itens = itens;
        }

        setValue(escalaCampo, novasEscalas as T[Path<T>], { shouldDirty: true });
    }, [dataStr, estabelecimentos, getValues, localizarSemanaDia, medicoCampo, escalaCampo, semanasPath, setValue]);

    const isHoraBloqueada = (horaStr: string) => {
        if (!isHoje) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            return dataAtiva < hoje;
        }

        const agora = new Date();
        const dataInicioIntervalo = new Date(`${dataStr}T${horaStr}:00`);
        return dataInicioIntervalo <= agora;
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

    if (loading) {
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
                                    marcado={estaMarcado}
                                    cor={item?.cor || est.cor}
                                    icone={item?.icone || est.icone}
                                    bloqueado={bloqueado}
                                    estId={est.id}
                                    hora={horario.field}
                                    onToggle={handleToggle}
                                />
                            );
                        }}
                    />);
                })}
            </DataTable>
        </div>
    );
};
