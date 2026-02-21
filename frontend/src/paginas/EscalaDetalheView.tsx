import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // useLocation adicionado
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { server } from '@/api/server';

import { 
    DndContext, 
    TouchSensor, 
    PointerSensor,
    useSensor, 
    useSensors, 
    useDraggable, 
    useDroppable,
    DragOverlay,
    pointerWithin 
} from '@dnd-kit/core';
import { useWatch, type Control } from 'react-hook-form';
import type { Escala, EscalaSemana } from '@/types/escala';

// --- COMPONENTE: Célula de Horário ---
const DroppableCell = ({ estId, hora, marcada, cor, iconeRaw, onToggle }: any) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `TRG|${estId}|${hora}`, 
        data: { estId, hora }
    });

    const renderConteudo = () => {
        if (!marcada) return null;
        if (iconeRaw) {
            const src = iconeRaw.startsWith('data:') ? iconeRaw : `data:image/png;base64,${iconeRaw}`;
            return <img src={src} alt="Icon" className="w-6 h-6 object-contain" />;
        }
        return <i className="pi pi-check text-white text-[10px] font-bold"></i>;
    };

    return (
        <div 
            ref={setNodeRef}
            onClick={onToggle}
            className={`flex justify-center items-center h-full w-full py-3 transition-colors cursor-pointer ${isOver ? 'bg-blue-100/60' : ''}`}
            style={{ minHeight: '52px', minWidth: '70px' }}
        >
            <div 
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 pointer-events-none
                    ${marcada ? 'shadow-md scale-110 border-white' : 'border-gray-200 bg-gray-50/30'}`}
                style={{ 
                    backgroundColor: marcada ? "#" + cor : 'transparent',
                    borderColor: marcada ? "#" + cor : isOver ? '#3b82f6' : '#f3f4f6'
                }}
            >
                {renderConteudo()}
            </div>
        </div>
    );
};

// --- COMPONENTE: DraggableBall ---
const DraggableBall = ({ id, cor, icone }: { id: string, cor: string, icone: any }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `SRC-${id}`, 
        data: { estId: id, cor, icone }
    });

    const renderIconeInterno = () => {
        if (!icone) return null;
        const src = icone.startsWith('data:') ? icone : `data:image/png;base64,${icone}`;
        return <img src={src} alt="" className="w-full h-full object-contain p-1" />;
    };

    return (
        <div 
            ref={setNodeRef} 
            {...listeners} 
            {...attributes}
            className={`w-7 h-7 rounded-full border border-gray-300 shadow-sm cursor-grab active:cursor-grabbing touch-none transition-transform flex items-center justify-center overflow-hidden ${isDragging ? 'opacity-20' : 'hover:scale-110'}`}
            style={{ backgroundColor: "#" + cor }}
        >
            {renderIconeInterno()}
        </div>
    );
};

interface EscalaDetalheProps {
    disableHeader?: boolean;
    control?: Control<EscalaSemana>;
}

export const EscalaDetalheView = ({disableHeader, control} : EscalaDetalheProps) => {
    const data  = useWatch({ control, name: 'dataInicio' });
    const navigate = useNavigate();
    const location = useLocation(); // Para capturar o estado vindo da tela anterior
    const [estabelecimentos, setEstabelecimentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [marcacoes, setMarcacoes] = useState<Record<string, { cor: string, icone: any }>>({});
    const [activeDrag, setActiveDrag] = useState<any>(null);

    const nomeMedico = location.state?.nomeMedico;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    const horarios = useMemo(() => Array.from({ length: 13 }, (_, i) => {
        const h = (i + 7).toString().padStart(2, '0');
        return { field: `${h}:00`, header: `${h}h` };
    }), []);

    useEffect(() => {
        server.api.listar<any>('/estabelecimento', { ativo: true })
            .then(res => setEstabelecimentos(res))
            .finally(() => setLoading(false));
    }, []);

    // LOGICA DE VOLTAR CORRIGIDA
    const handleVoltar = () => {
        const stateParaEnviar = { 
            openModal: true, 
            timestamp: Date.now(),
        };
        
        // Navega de volta para a listagem
        navigate('/escala', { 
            state: stateParaEnviar
        });
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        setActiveDrag(null);
        if (!over) return;

        const bolinhaDados = active.data.current;
        const targetEstId = over.data.current.estId;
        const targetHora = over.data.current.hora;
        const key = `${targetEstId}-${targetHora}`;

        setMarcacoes(prev => ({
            ...prev,
            [key]: { cor: bolinhaDados.cor, icone: bolinhaDados.icone }
        }));
    };

    const dataFormatada = data ? new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { 
        weekday: 'long', day: '2-digit', month: '2-digit' 
    }) : '';

    console.log("datas escala detalhe", data, dataFormatada)

    return (
        <DndContext 
            sensors={sensors} 
            collisionDetection={pointerWithin} 
            onDragStart={(e) => setActiveDrag(e.active.data.current)} 
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col flex-1 h-full w-full overflow-hidden">
                {!disableHeader && (
                    <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-20 shadow-sm">
                        <div className="flex items-center gap-4">
                            <Button 
                                icon="pi pi-arrow-left" 
                                onClick={handleVoltar} 
                                className="p-button-rounded p-button-text p-button-secondary hover:bg-gray-100" 
                            />
                            
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">
                                        Escala Individual
                                    </h1>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                        {dataFormatada}
                                    </span>
                                </div>
                                
                                {/* EXIBIÇÃO DO NOME DO MÉDICO COM UX APRIMORADA */}
                                {nomeMedico && (
                                    <div className="flex items-center gap-1.5 mt-1.5 text-gray-500">
                                        <i className="pi pi-user text-[11px]"></i>
                                        <span className="text-sm font-semibold uppercase tracking-wide">
                                            {nomeMedico}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button 
                                label="Limpar" 
                                icon="pi pi-trash" 
                                className="p-button-text p-button-danger font-bold text-sm"
                                onClick={() => setMarcacoes({})}
                            />
                            <Button 
                                label="Salvar Escala" 
                                icon="pi pi-check" 
                                className="bg-blue-600 hover:bg-blue-700 border-none font-bold px-6 shadow-lg shadow-blue-200 transition-all active:scale-95 text-white" 
                            />
                        </div>
                    </div>
                )}

                <div className="flex-1 min-h-0 w-full h-full bg-white rounded-lg shadow-sm border">
                    <DataTable 
                        key={`grid-refresh-${Object.keys(marcacoes).length}`}
                        value={estabelecimentos} 
                        loading={loading}
                        className="p-datatable-sm h-full border rounded-xl overflow-hidden shadow-sm"
                        showGridlines
                        scrollHeight="flex"
                    >
                        <Column 
                            header="LOCAL" 
                            frozen 
                            style={{ width: '220px' }}
                            body={(rowData) => (
                                <div className="flex items-center gap-3 py-1 px-2">
                                    <DraggableBall id={rowData.id} cor={rowData.cor} icone={rowData.icone} />
                                    <span className="font-bold text-gray-800 text-[11px] uppercase truncate">
                                        {rowData.nome}
                                    </span>
                                </div>
                            )}
                        />
                        
                        {horarios.map(h => (
                            <Column 
                                key={h.field} 
                                header={h.header}
                                className="text-center p-0"
                                body={(rowData) => {
                                    const key = `${rowData.id}-${h.field}`;
                                    const marcacao = marcacoes[key];
                                    return (
                                        <DroppableCell 
                                            estId={rowData.id} 
                                            hora={h.field} 
                                            cor={marcacao ? marcacao.cor : rowData.cor}
                                            iconeRaw={marcacao ? marcacao.icone : null}
                                            marcada={!!marcacao}
                                            onToggle={() => {
                                                setMarcacoes(prev => {
                                                    const novo = { ...prev };
                                                    if (novo[key]) delete novo[key];
                                                    else novo[key] = { cor: rowData.cor, icone: rowData.icone };
                                                    return novo;
                                                });
                                            }}
                                        />
                                    );
                                }}
                            />
                        ))}
                    </DataTable>
                </div>

                <DragOverlay zIndex={1000} style={{ pointerEvents: 'none' }}>
                    {activeDrag ? (
                        <div 
                            className="w-9 h-9 rounded-full border-2 border-white shadow-2xl scale-125" 
                            style={{ backgroundColor: "#" + activeDrag.cor }} 
                        />
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};