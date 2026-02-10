import { CrudBase } from '@/componentes/crud/CrudBase';
import { AppInputText } from '@/componentes/inputtext/AppInputText';
import { AppSwitch } from '@/componentes/switch/AppSwitch';
import { type Medico, medicoSchema } from '@/types/medico';

export const MedicoView = () => {
    return (
        <CrudBase<Medico>
            title="Médico"
            // filterContent={<p>Teste de Filtro</p>}
            resourcePath='/medico'
            schema={medicoSchema}
            defaultValues={{ 
            nome: '', 
            sigla: ''
            }}
            columns={[
            { field: 'nome', header: 'Nome' },
            { field: 'sigla', header: 'Sigla' },
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
                    <AppInputText<Medico> 
                        name="nome"
                        label="Nome" 
                        control={control} 
                        colSpan={12} 
                        maxLength={60}
                        required
                    />

                    <AppInputText<Medico> 
                        name="sigla"
                        label="Sigla" 
                        control={control} 
                        colSpan={6} 
                        maxLength={3}
                        minLength={3}
                        required
                    />

                    <AppSwitch<Medico>
                        name="ativo"
                        label="Situação"
                        control={control}
                        colSpan={6}
                        labelOn='Ativo'
                        labelOff='Inativo'
                    />
                </>
                
            }
        </CrudBase>  
    )
}