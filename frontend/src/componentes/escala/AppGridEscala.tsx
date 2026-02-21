import { useState, useEffect, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom'; // Importado para navegação
import { server } from '@/api/server';
import { FieldWrapper } from '@/componentes/FieldWrapper';
import { getColSpanClass, type ColSpan } from '@/utils/GridUtils';
import { useAppToast } from '@/context/ToastContext';

interface AppGridEscalaProps {
    colSpan?: ColSpan;
    label?: string;
    control?: any;     // Novo: ID do médico vindo do formulário
    nomeMedico?: string;   // Novo: Nome do médico para exibir na outra tela
    getNomeMedico: () => string;
    onCellClick?: (dadosDaCelula?: any) => void;
}

export const AppGridEscala = ({ colSpan = 12, label, control, getNomeMedico, onCellClick }: AppGridEscalaProps) => {
    const [estabelecimentos, setEstabelecimentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dataReferencia, setDataReferencia] = useState(new Date());
    const navigate = useNavigate(); // Hook para mudar de página
    const { showError } = useAppToast();

    // Função rigorosa para validar se é HOJE (ignora horas)
    const verificarSeEhHoje = (date: Date) => {
        const hoje = new Date();
        return (
            date.getDate() === hoje.getDate() &&
            date.getMonth() === hoje.getMonth() &&
            date.getFullYear() === hoje.getFullYear()
        );
    };

    // Gera os dias da semana dinamicamente com base na navegação
    const diasComDatas = useMemo(() => {
        const base = new Date(dataReferencia);
        const diaSemanaIndex = base.getDay();
        const domingoRef = new Date(base);
        domingoRef.setDate(base.getDate() - diaSemanaIndex);

        const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const fields = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

        return fields.map((field, index) => {
            const dataDia = new Date(domingoRef);
            dataDia.setDate(domingoRef.getDate() + index);
            return {
                field,
                header: nomesDias[index],
                dataExibicao: dataDia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                fullDate: dataDia 
            };
        });
    }, [dataReferencia]);

    const navegarSemana = (offset: number) => {
        const novaData = new Date(dataReferencia);
        novaData.setDate(dataReferencia.getDate() + offset);
        setDataReferencia(novaData);
    };

    useEffect(() => {
        server.api.listar<any>('/estabelecimento', { ativo: true })
            .then(data => setEstabelecimentos(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const renderIcone = (iconeRaw: any) => {
        if (!iconeRaw) return null;
        const src = iconeRaw.startsWith('data:') ? iconeRaw : `data:image/png;base64,${iconeRaw}`;
        return <img src={src} alt="Icon" className="w-[20px] h-[20px] object-contain flex-shrink-0" />;
    };

    const nomeEstabelecimentoTemplate = (rowData: any) => (
        <div className="flex items-center gap-3">
            {rowData.cor && (
                <span 
                    className="w-[20px] h-[20px] rounded-full border border-gray-300 flex-shrink-0 shadow-sm" 
                    style={{ backgroundColor: "#" + rowData.cor }}
                />
            )}
            {renderIcone(rowData.icone)}
            <span className="font-bold text-gray-800 text-sm truncate">{rowData.nome}</span>
        </div>
    );

    const headerTemplate = (dia: any) => {
        const hoje = verificarSeEhHoje(dia.fullDate);
        return (
            <div className={`inline-flex flex-col items-center p-2 min-w-max transition-all duration-200 ${hoje ? 'bg-blue-50 border-b-2 border-blue-600' : 'bg-gray-50'}`}>
                <span className={`text-sm font-black uppercase tracking-wide ${hoje ? 'text-blue-600' : 'text-gray-700'}`}>
                    {dia.header}
                </span>
                <span className={`text-sm font-bold mt-1 ${hoje ? 'text-blue-500' : 'text-gray-400'}`}>
                    {dia.dataExibicao}
                </span>
            </div>
        );
    };

    const cellTemplate = (rowData: any, dia: any) => {
        const hoje = verificarSeEhHoje(dia.fullDate);
        // Função que dispara a navegação para a nova rota detalhada
        const abrirDetalhe = () => {
            if (onCellClick){
                onCellClick(dia);
                return;
            }

            const idAtual = control._formValues?.medicoId;

            if (!idAtual) {
                showError('Atenção', 'Selecione um médico antes de acessar a escala detalhada.');
                return;
            }

            const nomeMedico = getNomeMedico();

            const dataUrl = dia.fullDate.toISOString().split('T')[0];
            navigate(`/escala/detalhe/${rowData.id}/${dataUrl}`, {
                state: { 
                    editMode: true,
                    medicoId: idAtual,
                    nomeMedico: nomeMedico
                }
            });
        };

        return (
            <div 
                onClick={abrirDetalhe}
                className={`w-full h-full p-1 cursor-pointer transition-all duration-200 ${hoje ? 'bg-blue-50/30' : 'hover:bg-gray-100/50'}`}
            >
                <div className={`min-h-[1px] border border-dashed rounded flex flex-col items-center justify-center
                    ${hoje ? 'border-blue-200 bg-blue-50/20 shadow-inner' : 'border-gray-200 bg-gray-50/30'}`}>
                    <span className={`text-[10px] uppercase tracking-wider ${hoje ? 'text-blue-500 font-black' : 'text-gray-400 italic font-medium'}`}>
                        Livre
                    </span>
                    <i className={`pi pi-plus text-sm] mt-1 ${hoje ? 'text-blue-300' : 'text-gray-300'}`}></i>
                </div>
            </div>
        );
    };

    return (
        <FieldWrapper label={label || ""} className={getColSpanClass(colSpan)}>
            <div className="flex flex-col gap-0 border rounded-lg overflow-hidden shadow-sm bg-white mt-2">
                
                {/* Barra de Navegação Superior */}
                <div className="flex items-center justify-between bg-gray-50 border-b">
                    <div className="flex gap-2">
                        <Button icon="pi pi-chevron-left" onClick={() => navegarSemana(-7)} className="p-button-text p-button-sm p-button-secondary" />
                        <Button label="Hoje" onClick={() => setDataReferencia(new Date())} className="p-button-outlined p-button-secondary p-button-sm font-bold" />
                        <Button icon="pi pi-chevron-right" onClick={() => navegarSemana(7)} className="p-button-text p-button-sm p-button-secondary" />
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-gray-400 uppercase pr-2 tracking-widest">Semana Selecionada</span>
                        <span className="text-lg font-black text-gray-700 pr-2">
                            {diasComDatas[0].dataExibicao} — {diasComDatas[6].dataExibicao}
                        </span>
                    </div>
                </div>

                <DataTable 
                    value={estabelecimentos} 
                    loading={loading} 
                    stripedRows 
                    size="small"
                    className='p-datatable-sm'
                >
                    <Column 
                        header="Clinica/Hospitais/Consultorio" 
                        body={nomeEstabelecimentoTemplate}
                        frozen 
                        className="border-r bg-white" 
                        style={{ width: '100px' }}
                    />
                    
                    {diasComDatas.map(dia => (
                        <Column 
                            key={`${dia.field}`}
                            header={headerTemplate(dia)}
                            // Passamos o rowData do estabelecimento e o objeto dia para a célula
                            body={(rowData) => cellTemplate(rowData, dia)}
                            // headerClassName="p-0 overflow-hidden" 
                            // className="p-0"
                            headerStyle={{ 
                                width: '10%',         // Truque CSS para largura mínima baseada no conteúdo
                                whiteSpace: 'nowrap', // Impede quebra de linha
                                textAlign: 'center' 
                            }}
                            // Centraliza o conteúdo interno que o PrimeReact gera automaticamente
                            pt={{
                                headerContent: { className: 'justify-center' }, 
                                headerCell: { className: 'p-0' } // Remove paddings nativos do <th>
                            }}
                        />
                    ))}
                </DataTable>
            </div>
        </FieldWrapper>
    );
};