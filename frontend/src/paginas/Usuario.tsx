import { CrudBase } from '@/componentes/crud/CrudBase';
import { AppInputTextForm } from '@/componentes/inputtext/AppInputTextForm';
import { type Usuario, usuarioSchema } from '@/types/usuario';
import { AppInputPassword } from '@/componentes/inputtext/AppInputPassword';
import { AppUsuarioPermissao } from '@/componentes/usuario/AppUsuarioPermissao';
import { Recurso } from '@/permissoes/recurso';
import { AppSwitchForm } from '@/componentes/switch/AppSwitchForm';
import type { Medico } from '@/types/medico';
import { AppSelectForm } from '@/componentes/select/AppSelectForm';

export const UsuarioView = () => {

    const medicoTemplate = (option: Medico) => {
        if (!option) {
            return "Selecione um médico";
        }
        return option.sigla ? `${option.nome} - ${option.sigla}` : option.nome;
    };

  return (
      <CrudBase<Usuario>
        title="Usuários do Sistema"
        recurso={Recurso.USUARIO}
        // filterContent={<p>Teste de Filtro</p>}
        resourcePath='/usuario'
        schema={usuarioSchema}
        defaultValues={{ 
          nome: '', 
          login: '', 
          ativo: true, 
          senha: '',
          confirmarSenha: '',
          permissoes: []
        }}
        columns={[
          { field: 'nome', header: 'Nome' },
          { field: 'login', header: 'Login' },
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
          const isEditing = !!control._defaultValues.id;

          return (
            <>
              <AppInputTextForm
                name="nome"
                label="Nome" 
                control={control} 
                colSpan={8} 
                required
              />

              <AppSwitchForm
                name="ativo"
                label="Situação"
                control={control}
                colSpan={4}
                labelOn='Ativo'
                labelOff='Inativo'
              />

              <AppInputTextForm
                name="login"
                label="Login" 
                control={control} 
                colSpan={6} 
                required
              />

              <AppSelectForm 
                  label='Anestesista'
                  name='medicoId'
                  control={control} 
                  url="/medico" 
                  filterParams={{ ativo: true,  especialidades: [1] }}
                  optionLabel="nome"
                  optionValue="id"
                  colSpan={6}
                  valueTemplate={medicoTemplate}
                  itemTemplate={medicoTemplate}
              />

              <AppInputPassword
                name="senha"
                label="Senha de Acesso" 
                control={control} 
                required={!isEditing}
                toggleMask 
                feedback={true}
                colSpan={6} 
              />

              <AppInputPassword
                name="confirmarSenha"
                label="Repetir Senha de Acesso" 
                control={control} 
                required={!isEditing}
                toggleMask
                feedback={false}
                colSpan={6} 
              />            

              <AppUsuarioPermissao />
            </>
          );
        }}
      </CrudBase>
  );
};
