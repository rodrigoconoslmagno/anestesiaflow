import React, { useCallback, useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Sidebar } from 'primereact/sidebar';
import { CrudHeader } from './CrudHeader';
import { useLocation, useNavigate } from 'react-router-dom';
import { type BaseEntity } from '@/types/baseEntity';
import { useForm, type DefaultValues, type Resolver, type Control, type FieldErrors, FormProvider } from 'react-hook-form';
import type z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAppToast } from '@/context/ToastContext';
import { server } from '@/api/server';
import { confirmDialog } from 'primereact/confirmdialog';
import { CrudFooter } from './CrudFooter';
import { useCrudStore } from '@/store/crudStore';

interface CrudBaseProps<T extends BaseEntity> {
  title: string;
  resourcePath: string; // Ex: '/usuarios'
  schema: z.ZodObject<any>;
  defaultValues: DefaultValues<T>;
  columns: { field: string; header: string; body?: (item: any) => React.ReactNode }[];
  filterContent?: React.ReactNode;
  children: (control: Control<T>, errors: FieldErrors<T>) => React.ReactNode;
  initialValues?: Partial<T> | null;
}

export const CrudBase = <T extends { id?: any }>({
  title, resourcePath, schema, defaultValues, columns, filterContent, children, initialValues
}: CrudBaseProps<T>) => {
  const { setFormData, getFormData, clearFormData } = useCrudStore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [mobileFiltersVisible, setMobileFiltersVisible] = useState(false);

  const navigate = useNavigate();
  const { showSuccess, showError } = useAppToast();
  const location = useLocation();

  const methods = useForm<T>({ // 1. Guardamos o retorno completo do useForm em 'methods'
    resolver: zodResolver(schema) as Resolver<T>,
    defaultValues
  });

  const { 
    control, 
    reset,
    watch,
    getValues,
    setValue,
    formState: { isDirty, dirtyFields,  errors } 
  } = methods;

  useEffect(() => {
    const deveAbrirForm = location.state?.openModal;
    // 2. Se NÃO houver instrução para abrir, garantimos que comece fechado
    if (!deveAbrirForm) {
      setFormVisible(false);
    } else {
      setFormVisible(true);
    }
    
    // 1. Tenta buscar rascunho salvo no Zustand (Cache)
    const cached = getFormData<T>(resourcePath);
    if (cached) {
      // Se existe cache, o usuário estava preenchendo e voltou. 
      // Restauramos o estado anterior.
      reset(cached);
    } 
    else if (initialValues) {
      // Se NÃO tem cache, mas recebemos initialValues (ex: vindo de outra tela com médicoId)
      // Mesclamos os valores padrão com os valores iniciais forçados.
      reset({ ...defaultValues, ...initialValues } as any);
    }
    // Se não houver nenhum dos dois, o CrudBase permanece na listagem (formVisible = false)
  }, [location.pathname, resourcePath]);  

  useEffect(() => {
    // SÓ entra aqui se o formulário estiver visível E
    // se houver algum campo "sujo" (alterado pelo usuário)
    if (formVisible && isDirty && Object.keys(dirtyFields).length > 0) {
      
      // getValues() busca os dados atuais sem disparar re-renders ou loops
      const currentValues = getValues();
      
      setFormData(resourcePath, currentValues);
    }
    // O segredo: dirtyFields só muda quando o usuário interage.
    // O reset() de inicialização limpa o dirtyFields, bloqueando o loop.
  }, [dirtyFields, isDirty, formVisible, resourcePath, getValues, setFormData]);

  useEffect(() => {
    // Criamos uma subscrição que ouve TODAS as mudanças do formulário
    // Isso é disparado sempre que field.onChange é chamado em qualquer lugar
    const subscription = watch((value, { type }) => {
      // 1. O 'type' nos diz se a mudança veio de um 'change' (usuário) 
      // ou de um 'reset' (sistema). Isso mata o loop na fonte!
      if (formVisible && type === 'change') {
        // O 'value' aqui já é o objeto completo e atualizado
        setFormData(resourcePath, value as T);
      }
    });
  
    // Limpamos a subscrição ao desmontar para evitar vazamento de memória
    return () => subscription.unsubscribe();
  }, [watch, formVisible, resourcePath, setFormData]);

  // Capture os valores de auditoria (ajuste os nomes dos campos conforme seu backend)
  const auditValues = {
    criacao: watch('dataCriacao' as any),
    alteracao: watch('dataAtualizacao' as any)
  };

  // --- MÉTODOS DE BACKEND IMPLÍCITOS ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Chamada via POST para o endpoint de listagem
      // Enviamos um objeto vazio {} como filtros iniciais
      const result = await server.api.listar<T>(resourcePath, {}); 
      setData(result);
    } catch (err) {
      showError('Erro', 'Erro ao carregar lista de registros.');
    } finally {
      setLoading(false);
    }
  }, [resourcePath, showError]);

  useEffect(() => { loadData(); }, [loadData]);

  const onSave = async (formData: T) => {
    setLoading(true);
    try {
      if (formData.id) {
        // PUT /recurso/id
        await server.api.atualizar(resourcePath, formData.id, formData);
        showSuccess('Sucesso', 'Registro atualizado.');
      } else {
        // POST /recurso
        await server.api.criar(resourcePath, formData);
        showSuccess('Sucesso', 'Registro criado.');
      }
      clearFormData(resourcePath);
      setFormVisible(false);
      loadData();
    } catch (err: any )  {
      const errorMessage = err.response?.data?.message || "Ocorreu um erro inesperado";
      showError('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (item: T) => {
    confirmDialog({
      header: 'Confirmação de Exclusão',
      // Customizamos a mensagem para ter uma hierarquia visual clara
      message: (
        <div className="flex flex-col items-center gap-3">
          <i className="pi pi-exclamation-triangle text-red-500 text-5xl"></i>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-700 m-0">
              Você está prestes a excluir este registro.
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Esta ação não poderá ser desfeita. Tem certeza que deseja continuar?
            </p>
          </div>
        </div>
      ),
      icon: 'hidden', // Ocultamos o ícone padrão para usar o nosso customizado acima
      acceptLabel: 'Sim, Excluir',
      rejectLabel: 'Não, Cancelar',
      
      // Classes de Estilo para os Botões
      // 'p-button-danger' é a classe padrão do Prime para vermelho
      acceptClassName: 'bg-red-600 hover:bg-red-700 text-white border-none px-6 py-2.5 font-bold shadow-md transition-all',
      rejectClassName: 'p-button-text p-button-secondary text-gray-600 hover:text-gray-800 px-6 py-2.5 font-bold',
      
      // Estilo do container do Diálogo
      className: 'max-w-[480px] rounded-2xl border-none shadow-2xl',
      
      accept: async () => {
        try {
          await server.api.excluir(resourcePath, item.id);
          showSuccess('Excluído', 'Registro removido com sucesso.');
          loadData();
        } catch (err: any) {
          const errorMessage = err.response?.data?.message || "Ocorreu um erro inesperado";
          showError('Erro', errorMessage);
        }
      }
    });
  };

  // 2. Tenta recuperar o cache ao abrir o formulário
  const handleAdd = () => {
    setIsEditMode(true);
    
    // Se houver rascunho, usa ele, senão usa o defaultValues
    reset(defaultValues);
    setFormVisible(true);
  };

  const handleEdit = async (item: T) => {
    setIsEditMode(true);
    try {
      // Busca o objeto FULL (com listas, itens, etc) pelo ID
      const fullItem = await server.api.buscarId<T>(resourcePath, item.id);
      
      // Agora o reset preenche o formulário com TODOS os dados (incluindo itens)
      reset(fullItem as any);
      setFormVisible(true);
    } catch (err) {
      showError('Erro', 'Não foi possível carregar os detalhes do registro.' + err);
    } finally {
      setLoading(false);
    }
  };

  const onValidationError = (errors: FieldErrors<T>) => {
    // Log para o desenvolvedor
    const extrairMensagemParaToast = (errs: any): string | null => {
      for (const key in errs) {
          const error = errs[key];
          // console.log("analise detalhada", error, key)
          if (!error) continue;

          // Se o erro está na raiz do campo (comum em refinamentos de listas/objetos)
          // e esse campo é um objeto complexo (como sua array de escala), 
          // mostramos o Toast.
          if (error.message && (key === 'root' || Array.isArray(error.ref) || !error.ref)) {
            console.log("analise detalhada", error, key)
              return error.message;
          }

          // Se for um erro aninhado em um objeto/array (recursão)
          if (typeof error === 'object' && !error.message) {
              const subMsg = extrairMensagemParaToast(error);
              if (subMsg) return subMsg;
          }
      }
      return null;
    };

    const mensagemGlobal = extrairMensagemParaToast(errors);

    // 2. Só exibe o Toast se a mensagem for de um erro "global" ou de estrutura
    if (mensagemGlobal) {
        showError('Atenção', mensagemGlobal);
    }

  };

  return (
    <div className="h-full w-full bg-[#f8fafc] p-2 lg:p-1 flex flex-col overflow-hidden">
      <div className="max-w-full mx-auto w-full flex-grow flex flex-col min-h-0">
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col flex-grow min-h-0 overflow-hidden">
          
          {!formVisible ? (
            /* --- VISÃO DA LISTAGEM --- */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
              <div className="shrink-0">
                <CrudHeader 
                  title={title} 
                  onAdd={handleAdd} 
                  filterContent={filterContent}
                  onClose={() => {
                    clearFormData(resourcePath); // Limpa o rascunho do Zustand
                    navigate('/dashboard');      // Navega para a home
                  }}
                />
              </div>

              <div className="flex-grow overflow-auto custom-scrollbar p-4"> {/* Adicionado padding para o grid respirar */}
                <DataTable 
                  value={data} 
                  loading={loading} 
                  paginator 
                  rows={10} 
                  className="p-datatable-modern pb-4"
                  rowHover // Ativa o destaque da linha ao passar o mouse
                  stripedRows={false} // Desative as listras para um look mais clean
                  responsiveLayout="stack" 
                  breakpoint="960px"
                  paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                  currentPageReportTemplate="{first}-{last} de {totalRecords}"
                  emptyMessage={`Nenhuma ${title} encontrado.`}
                  // Estilo da Tabela
                  pt={{
                    header: { className: 'bg-white border-none' },
                    thead: { className: 'bg-gray-50/50' },
                    column: {
                        headerCell: { className: 'bg-gray-50/50 text-gray-400 uppercase text-[11px] tracking-widest font-bold py-4 border-b border-gray-100' },
                        bodyCell: { className: 'py-1 border-b border-gray-50 text-gray-600' }
                    }
                  }}
                >
                  {columns.map((col) => (
                    <Column key={col.field} 
                            field={col.field} 
                            header={col.header} 
                            body={col.body} 
                            sortable={true} />
                  ))}
                    <Column 
                      header="Ações" 
                      headerClassName="flex justify-end pr-10"
                      body={(rowData: T): React.ReactElement => (
                        <div className="flex gap-1 justify-end pr-4">
                          <Button 
                            icon="pi pi-pencil" 
                            tooltip="Editar" 
                            tooltipOptions={{ position: 'top' }}
                            text rounded 
                            className="text-blue-500 hover:bg-blue-50 transition-all duration-200" 
                            onClick={() => handleEdit(rowData)} 
                          />
                          <Button 
                            icon="pi pi-trash" 
                            tooltip="Excluir"
                            tooltipOptions={{ position: 'top' }}
                            text rounded 
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200" 
                            onClick={() => confirmDelete(rowData)} 
                          />
                        </div>
                      )} 
                    />
                </DataTable>
              </div>

              {/* --- UX MOBILE: BOTÕES FLUTUANTES (FAB) --- */}
              <div className="fixed bottom-12 right-2 md:hidden z-50 flex flex-col gap-3 items-end">
                {/* Botão Sair */}
                <button 
                  onClick={() => {
                    setFormVisible(false);
                    clearFormData(resourcePath);
                    navigate(location.pathname, { replace: true, state: {} });
                    navigate('/dashboard')
                  }}
                  className="w-12 h-12 rounded-full bg-gray-500 text-white shadow-lg flex items-center justify-center border-none"
                >
                  <i className="pi pi-sign-out"></i>
                </button>
                
                {/* Botão Filtrar (Laranja) */}
                {filterContent && (
                  <button 
                    onClick={() => setMobileFiltersVisible(true)}
                    className="w-14 h-14 rounded-full bg-orange-500 text-white shadow-lg flex items-center justify-center border-none"
                  >
                    <i className="pi pi-filter"></i>
                  </button>
                )}
                
                {/* Botão Novo (Principal - Azul) */}
                <button 
                  onClick={handleAdd}
                  className="w-16 h-16 rounded-full bg-blue-600 text-white shadow-2xl flex items-center justify-center border-none transition-transform active:scale-90"
                >
                  <i className="pi pi-plus text-xl"></i>
                </button>
              </div>

              {/* SIDEBAR DE FILTROS MOBILE */}
              <Sidebar 
                visible={mobileFiltersVisible} 
                onHide={() => setMobileFiltersVisible(false)} 
                position="bottom" 
                className="h-auto rounded-t-3xl p-4"
                header={<span className="font-bold text-gray-700">Filtros Avançados</span>}
              >
                <div className="flex flex-col gap-5 pb-8 pt-2">
                  {filterContent}
                  <Button 
                    label="Aplicar Filtros" 
                    icon="pi pi-check" 
                    className="w-full bg-blue-600 border-none py-3.5 shadow-md font-bold mt-2 text-white" 
                    onClick={() => setMobileFiltersVisible(false)} 
                  />
                </div>
              </Sidebar>
            </div>
          ) : (
            /* --- VISÃO DO FORMULÁRIO --- */
            <div className="flex flex-col h-full animate-fadein">
              <div className="flex items-center justify-between py-3 px-6 border-b bg-white shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{isEditMode ? `Editar ${title}` : `Novo ${title}`}</h3>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider">Formulário</p>
                </div>
                <Button icon="pi pi-times" rounded text severity="secondary" onClick={() => {
                    clearFormData(resourcePath);
                    setFormVisible(false)
                  }
                }/>
              </div>

              <div className="flex-grow overflow-y-auto p-4 md:p-8 bg-white custom-scrollbar">
                <div className="max-w-1xl mx-auto pb-10 grid grid-cols-12 gap-4">
                  <FormProvider {...methods}>
                    {children(Object.assign(control, { setValue, watch }), errors)}
                  </FormProvider>
                </div>
              </div>

              {/* RODAPÉ DESKTOP: Botões à Direita */}
              <CrudFooter 
                onCancel={() => {
                  clearFormData(resourcePath);
                  setFormVisible(false);
                }}
                onSave={methods.handleSubmit(onSave, onValidationError)}
                loading={loading}
                auditData={isEditMode ? auditValues : undefined} // Só mostra auditoria na edição
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}