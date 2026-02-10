import { CrudBase } from '@/componentes/crud/CrudBase';
import { AppInputText } from '@/componentes/inputtext/AppInputText';
import { type Usuario, usuarioSchema } from '@/types/usuario';
import { AppInputPassword } from '@/componentes/inputtext/AppInputPassword';
import { AppSwitch } from '@/componentes/switch/AppSwitch';

export const UsuarioView = () => {
  return (
      <CrudBase<Usuario>
        title="Usuários do Sistema"
        // filterContent={<p>Teste de Filtro</p>}
        resourcePath='/usuario'
        schema={usuarioSchema}
        defaultValues={{ 
          nome: '', 
          login: '', 
          ativo: true, 
          senha: '',
          confirmarSenha: ''
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
              <AppInputText<Usuario> 
                name="nome"
                label="Nome" 
                control={control} 
                colSpan={8} 
                required
              />

              <AppSwitch<Usuario>
                name="ativo"
                label="Situação"
                control={control}
                colSpan={4}
                labelOn='Ativo'
                labelOff='Inativo'
              />

              <AppInputText<Usuario> 
                name="login"
                label="Login" 
                control={control} 
                colSpan={12} 
                required
              />

              <AppInputPassword<Usuario> 
                name="senha"
                label="Senha de Acesso" 
                control={control} 
                required={!isEditing}
                toggleMask // Exibe o ícone para ver a senha
                feedback={true} // Se quiser mostrar a força da senha (opcional)
                colSpan={6} 
              />

              <AppInputPassword<Usuario> 
                name="confirmarSenha"
                label="Repetir Senha de Acesso" 
                control={control} 
                required={!isEditing}
                toggleMask // Exibe o ícone para ver a senha
                feedback={false} // Se quiser mostrar a força da senha (opcional)
                colSpan={6} 
              />            

            </>
          );
        }}
      </CrudBase>
  );
};