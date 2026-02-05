import React, { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

import { CrudBase } from '@/componentes/crud/CrudBase';

// Schema alinhado com o formulário para evitar erros de tipagem
const usuarioSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  perfil: z.string().min(1, 'Selecione um perfil de acesso'),
  ativo: z.boolean(),
  senha: z.string().optional().or(z.literal('')),
});

type UsuarioFormData = z.infer<typeof usuarioSchema>;

export const Usuario = () => {
  const [usuarios, setUsuarios] = useState<UsuarioFormData[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const toast = useRef<Toast>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: { 
      nome: '', 
      email: '', 
      perfil: '', 
      ativo: true, 
      senha: '' 
    }
  });

  // --- Lógica de Ações ---
  const handleAdd = () => {
    setEditMode(false);
    reset({ nome: '', email: '', perfil: '', ativo: true, senha: '' });
    setVisible(true);
  };

  const handleEdit = (user: UsuarioFormData) => {
    setEditMode(true);
    reset(user);
    setVisible(true);
  };

  const handleDelete = (user: UsuarioFormData) => {
    confirmDialog({
      message: `Tem certeza que deseja remover o usuário ${user.nome}?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: () => {
        setUsuarios(prev => prev.filter(u => u.email !== user.email));
        toast.current?.show({ severity: 'success', summary: 'Removido', detail: 'Usuário excluído com sucesso.' });
      }
    });
  };

  const onSubmit = (data: UsuarioFormData) => {
    setLoading(true);
    // Simulação de chamada ao backend Java
    setTimeout(() => {
      if (editMode) {
        setUsuarios(prev => prev.map(u => u.email === data.email ? data : u));
      } else {
        setUsuarios(prev => [...prev, data]);
      }
      setLoading(false);
      setVisible(false);
      toast.current?.show({ severity: 'success', summary: 'Salvo', detail: 'As informações foram guardadas.' });
    }, 800);
  };

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <CrudBase
        title="Usuários do Sistema"
        // filterContent={<p>Teste de Filtro</p>}
        data={usuarios}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        formVisible={visible}
        onHideForm={() => setVisible(false)}
        onSaveForm={handleSubmit(onSubmit)}
        isEditMode={editMode}
        columns={[
          { field: 'nome', header: 'Nome Completo' },
          { field: 'email', header: 'E-mail' },
          { field: 'perfil', header: 'Perfil' },
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
        {/* CONTEÚDO DO FORMULÁRIO (Inputs) */}
        <div className="flex flex-col gap-5 p-fluid">
          
          <div className="field">
            <label className="text-sm font-semibold text-gray-600">Nome Completo</label>
            <Controller name="nome" control={control} render={({ field }) => (
              <InputText {...field} placeholder="Ex: João Silva" className={errors.nome ? 'p-invalid' : ''} />
            )} />
            {errors.nome && <small className="p-error">{errors.nome.message}</small>}
          </div>

          <div className="field">
            <label className="text-sm font-semibold text-gray-600">E-mail Corporativo</label>
            <Controller name="email" control={control} render={({ field }) => (
              <InputText {...field} placeholder="email@clinica.com.br" />
            )} />
            {errors.email && <small className="p-error">{errors.email.message}</small>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="field">
              <label className="text-sm font-semibold text-gray-600">Perfil de Acesso</label>
              <Controller name="perfil" control={control} render={({ field }) => (
                <Dropdown 
                  {...field} 
                  options={['ADMIN', 'MEDICO', 'RECEPCAO']} 
                  placeholder="Selecione..." 
                />
              )} />
            </div>

            <div className="field">
              <label className="text-sm font-semibold text-gray-600">Senha</label>
              <Controller name="senha" control={control} render={({ field }) => (
                <Password {...field} toggleMask feedback={false} placeholder="******" />
              )} />
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <Controller name="ativo" control={control} render={({ field }) => (
              <InputSwitch checked={field.value} onChange={(e) => field.onChange(e.value)} />
            )} />
            <span className="text-sm font-medium text-gray-700">O usuário está habilitado para acessar o sistema?</span>
          </div>

        </div>
      </CrudBase>
    </>
  );
};