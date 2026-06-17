import { CrudBase } from "@/componentes/crud/CrudBase";
import { AppInputTextAreaForm } from "@/componentes/inputtext/AppInputTextAreaForm";
import { AppSwitchForm } from "@/componentes/switch/AppSwitchForm";
import { Recurso } from "@/permissoes/recurso";
import { procedimentoSchema, type Procedimento } from "@/types/procedimento";

export const ProcedimentoView = () => {

    return (
        <CrudBase<Procedimento>
            title="Procedimento"
            recurso={Recurso.PROCEDIMENTO}
            // filterContent={<p>Teste de Filtro</p>}
            resourcePath='/procedimento'
            schema={procedimentoSchema}
            defaultValues={{ 
                descricao: '', 
                ativo: true,
            }}
            columns={[
            { field: 'descricao', header: 'Descrição' },
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
        {(control) => {
            return (
                <>
                    <AppInputTextAreaForm
                        name="descricao"
                        label="Descrição"
                        control={control}
                        colSpan={12} 
                        maxLength={255}
                        required
                    />
                    <AppSwitchForm
                        name="ativo"
                        label="Situação"
                        control={control}
                        colSpan={12}
                        labelOn='Ativo'
                        labelOff='Inativo'
                    />
                    
                </>
            )
        }}
        </CrudBase>
    )
}