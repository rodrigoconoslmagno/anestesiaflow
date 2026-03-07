import React, { useEffect, useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { server } from '@/api/server';
import { type Permissoes } from '@/permissoes/permissoes';
import { getColSpanClass, type ColSpan } from '@/utils/GridUtils';

interface AppUsuarioPermissaoProps {
  colSpan?: ColSpan;
}

type AgrupamentoPermissoes = Record<string, Record<string, Permissoes[]>>;

export const AppUsuarioPermissao: React.FC<AppUsuarioPermissaoProps> = ({ colSpan = 12 }) => {
  const { control, watch } = useFormContext();
  const [permissoesAgrupadas, setPermissoesAgrupadas] = useState<AgrupamentoPermissoes>({});
  const [loading, setLoading] = useState(true);

  // 1. Lógica do Admin: Observamos o login do usuário
  const loginUsuario = watch('login');
  const isAdmin = loginUsuario?.toLowerCase() === 'admin';

  const permissoesSelecionadas: Permissoes[] = watch('permissoes') || [];

  useEffect(() => {
    // Se for admin, nem buscamos as permissões no banco
    if (isAdmin) {
      setLoading(false);
      return;
    }

    server.api.listarCustomizada<Permissoes[]>('/permissoes', '/metadata', {})
      .then(res => {
        const agrupado = res.reduce((acc: any, item: any) => {
          const modulo = item.modulo;
          const recurso = item.id.split('_')[0];
          if (!acc[modulo]) {
            acc[modulo] = {};
          }
          if (!acc[modulo][recurso]) {
            acc[modulo][recurso] = [];
          }
          acc[modulo][recurso].push(item);
          return acc;
        }, {} as AgrupamentoPermissoes);
        setPermissoesAgrupadas(agrupado);
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  // Se for admin, exibe um aviso amigável em vez da lista de permissões
  if (isAdmin) {
    return (
      <div className={`${getColSpanClass(colSpan)} p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-4 animate-fadein`}>
        <div className="bg-blue-600 p-3 rounded-lg text-white">
          <i className="pi pi-shield text-xl"></i>
        </div>
        <div>
          <h4 className="text-blue-900 font-bold m-0 text-sm">Administrador do Sistema</h4>
          <p className="text-blue-700 text-xs m-0">Este utilizador possui permissões totais implícitas. Não é necessário configurar o perfil de acesso.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="col-span-12 p-8 text-center text-gray-400">Carregando permissões...</div>;

  const handleToggle = (perm: Permissoes, isChecked: boolean, field: any, listaDoRecurso: Permissoes[]) => {
    let novaLista = [...permissoesSelecionadas];
    const permAcesso = listaDoRecurso.find(p => p.acao === 'ACESSAR');

    if (isChecked) {
      if (!novaLista.some(p => p.id === perm.id)) novaLista.push(perm);
      if (perm.acao !== 'ACESSAR' && permAcesso && !novaLista.some(p => p.id === permAcesso.id)) {
        novaLista.push(permAcesso);
      }
    } else {
      if (perm.acao === 'ACESSAR') {
        const idsDoRecurso = listaDoRecurso.map(r => r.id);
        novaLista = novaLista.filter(p => !idsDoRecurso.includes(p.id));
      } else {
        novaLista = novaLista.filter(p => p.id !== perm.id);
      }
    }
    field.onChange(novaLista);
  };

  const handleSelectAll = (recursoLista: Permissoes[], field: any) => {
    const idsRecurso = recursoLista.map(p => p.id);
    const outras = permissoesSelecionadas.filter(p => !idsRecurso.includes(p.id));
    const todosMarcados = recursoLista.every(r => permissoesSelecionadas.some(p => p.id === r.id));
    field.onChange(todosMarcados ? outras : [...outras, ...recursoLista]);
  };

  return (
    <div className={getColSpanClass(colSpan)}>
      <h4 className="text-gray-700 mb-4 font-bold border-b pb-2 flex items-center gap-2">
        <i className="pi pi-lock-open text-blue-600"></i>
        Perfil de Acesso do Utilizador
      </h4>
      
      {/* 2. Tabs Fechadas: Alteramos activeIndex para null para vir tudo fechado */}
      <Accordion multiple activeIndex={null} className="w-full">
        {Object.entries(permissoesAgrupadas).map(([modulo, recursos]) => (
          <AccordionTab key={modulo} header={<span className="font-bold uppercase tracking-wider text-xs">{modulo}</span>}>
            <div className="flex flex-col gap-8 py-2">
              {Object.entries(recursos).map(([recurso, lista]) => {
                const idAcesso = lista.find(p => p.acao === 'ACESSAR')?.id;
                const isAcessoMarcado = permissoesSelecionadas.some(p => p.id === idAcesso);
                const todosMarcados = lista.every(r => permissoesSelecionadas.some(p => p.id === r.id));
                
                return (
                  <div key={recurso}>
                    <div className="flex items-center justify-between mb-4 bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3 pl-2">
                        <div className={`h-2 w-2 rounded-full ${isAcessoMarcado ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{recurso}</span>
                      </div>
                      <Controller
                        name="permissoes"
                        control={control}
                        render={({ field }) => (
                          <Button 
                            type="button"
                            label={todosMarcados ? "Limpar Recurso" : "Marcar Tudo"}
                            icon={todosMarcados ? "pi pi-filter-slash" : "pi pi-check"}
                            className="p-button-text p-button-sm text-[9px] font-bold"
                            onClick={() => handleSelectAll(lista, field)}
                          />
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                      {lista.sort((a) => a.acao === 'ACESSAR' ? -1 : 1).map((perm) => (
                        <div key={perm.id} className="col-span-12 md:col-span-4 lg:col-span-3">
                          <Controller
                            name="permissoes"
                            control={control}
                            render={({ field }) => {
                              const isChecked = permissoesSelecionadas.some(p => p.id === perm.id);
                              const desabilitado = perm.acao !== 'ACESSAR' && !isAcessoMarcado;
                              return (
                                <div 
                                  className={`flex items-center p-3 border rounded-xl transition-all duration-200 group relative ${
                                    isChecked ? 'border-blue-200 bg-blue-50/40' : 'border-gray-100 bg-white'
                                  } ${desabilitado ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer hover:border-gray-300'}`}
                                  onClick={() => !desabilitado && handleToggle(perm, !isChecked, field, lista)}
                                >
                                  <Checkbox inputId={perm.id} checked={isChecked} disabled={desabilitado} />
                                  <label htmlFor={perm.id} className="ml-3 flex items-center w-full min-w-0 pointer-events-none">
                                    <div className={`p-2 rounded-lg mr-3 ${isChecked ? 'bg-blue-100 text-blue-600' : 'bg-gray-50'}`}>
                                      <i className={`${perm.icone} text-sm`}></i>
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-xs font-bold truncate text-gray-700">{perm.descricao}</span>
                                      <span className="text-[8px] font-black text-gray-400 uppercase">{perm.acao}</span>
                                    </div>
                                  </label>
                                  {desabilitado && <i className="pi pi-lock absolute top-2 right-2 text-[10px] text-gray-300"></i>}
                                </div>
                              );
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </AccordionTab>
        ))}
      </Accordion>
    </div>
  );
};