import { AppColorPicker } from "@/componentes/color/AppColorPicker";
import { CrudBase } from "@/componentes/crud/CrudBase";
import { AppIconPicker } from "@/componentes/image/AppIconPicker";
import { AppInputText } from "@/componentes/inputtext/AppInputText";
import { AppSwitch } from "@/componentes/switch/AppSwitch";
import { type Estabelecimento, estabelecimentoSchema } from "@/types/estabelecimento";

export const EstabelecimentoView = () => {
    return (
        <CrudBase<Estabelecimento>
            title="Clinicas / Hospitais / Consultório"
            // filterContent={<p>Teste de Filtro</p>}
            resourcePath='/estabelecimento'
            schema={estabelecimentoSchema}
            defaultValues={{ 
                nome: '', 
                cor: '',
                ativo: true
            }}
            columns={[
            { field: 'nome', header: 'Nome' },
            { field: 'cor', header: 'Cor/Icone',
                body: (row: any) => {
                    const hasIcon = row.icone && (Array.isArray(row.icone) || typeof row.icone === 'string') && row.icone.length > 0;
                    const hasColor = !!row.cor;
                    // Converte o ícone para exibição (mesma lógica do AppIconPicker)
                    const getIconSrc = () => {
                        if (typeof row.icone === 'string') {
                        return row.icone.startsWith('data:') ? row.icone : `data:image/png;base64,${row.icone}`;
                        }
                        if (Array.isArray(row.icone)) {
                        // Criar URL a partir do array de bytes enviado pelo Spring
                        const blob = new Blob([new Uint8Array(row.icone)], { type: 'image/png' });
                        return URL.createObjectURL(blob);
                        }
                        return null;
                    };

                    return (
                        // Flexbox para centralização total na célula
                        <div className="flex w-full">
                            {hasIcon ? (
                                <div className="w-[28px] h-[28px] rounded-full border border-gray-200 shadow-sm overflow-hidden bg-gray-50 flex items-center justify-center">
                                    <img 
                                        src={getIconSrc()!} 
                                        alt="Ícone" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : hasColor ? (
                                /* Círculo perfeito para a cor */
                                <div 
                                    className="w-[28px] h-[28px] rounded-full border border-gray-300 shadow-sm transition-transform hover:scale-90"
                                    style={{ 
                                        backgroundColor: row.cor.startsWith('#') ? row.cor : `#${row.cor}` 
                                    }}
                                />
                            ) : null /* Remove qualquer desenho quando não houver dado */}
                        </div>
                    );
                }
            },
            { 
                field: 'ativo', 
                header: 'Status', 
                body: (row: { ativo: any; }) => (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {row.ativo ? 'ATIVO' : 'INATIVO'}
                </span>
                )
            }
            ]}
        >
            {(control) => 
                <>
                    <AppInputText
                        name="nome"
                        label="Nome" 
                        control={control} 
                        colSpan={12} 
                        maxLength={60}
                        required
                    />

                    <AppSwitch
                        name="ativo"
                        label="Situação"
                        control={control}
                        colSpan={4}
                        labelOn='Ativo'
                        labelOff='Inativo'
                    />

                    <AppColorPicker
                        name="cor"
                        label="Cor"
                        control={control}
                        colSpan={4}
                        shape="circle"
                    />

                    <AppIconPicker
                        name="icone"
                        label="Icone"
                        control={control}
                        colSpan={4}
                    />
                </>
                
            }
        </CrudBase>  
    )
}