import React, { useState, useMemo } from 'react';
import { CrudBase } from '@/componentes/crud/CrudBase';
import { PlanilhaMedicaSchema, type PlanilhaMedicaType } from '@/types/planilhamedicaschema';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Controller } from 'react-hook-form';

export const TelaPlanilhaMedica = () => {
  const [dataBase, setDataBase] = useState(() => {
    const hoje = new Date();
    const diaDaSemana = hoje.getDay(); 
    const diff = hoje.getDate() - diaDaSemana + (diaDaSemana === 0 ? -6 : 1); 
    return new Date(hoje.setDate(diff));
  });

  const agendaSemana = useMemo(() => {
    const dias = ['segunda-feira', 'terca-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sabado', 'domingo'];
    return dias.map((dia, index) => {
      const data = new Date(dataBase);
      data.setDate(dataBase.getDate() + index);
      return {
        field: dia,
        label: dia.toUpperCase(),
        formatada: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      };
    });
  }, [dataBase]);

  const navegarSemana = (offset: number) => {
    const novaData = new Date(dataBase);
    novaData.setDate(dataBase.getDate() + offset);
    setDataBase(novaData);
  };

  const gerarLinhasIniciais = () => {
    const rows = [];
    const mapaB: Record<number, string> = {
      0: "Hospital Unimed", 1: "HMD/ IMG", 2: "PCA", 3: "Dra. Keila", 
      4: "Consultório Pré", 5: "15h", 15: "Hospital Unimed", 
      16: "HMD/ IMG", 17: "Consultório Pré", 18: "PCA",
      24: "Santa Casa", 25: "C.O", 26: "UNIMED", 27: "Sobre Aviso HU"
    };

    for (let i = 0; i <= 27; i++) {
      let a = '';
      let b = mapaB[i] || '';
      if (i >= 0 && i <= 14) {
        const cicloManha = ["", "M", "A", "N", "H", "A", ""];
        a = cicloManha[i % 7] || '';
      } else if (i >= 15 && i <= 23) {
        if (i === 15) a = "  "; else 
        if (i === 16) a = "   "; else
        if (i === 17) a = 'T'; else 
        if (i === 18) a = 'A'; else 
        if (i === 19) a = 'R'; else 
        if (i === 20) a = 'D'; else 
        if (i === 21) a = 'E'; else
        if (i === 22) a = '  '; else
        if (i === 23) a = "   ";
      } else if (i >= 24) {
        const noite = ["N", "O", "I", "T", "E"];
        a = noite[i - 24] || '';
      }
      if (i >= 6 && i <= 10) b = "13h"; 
      if (i >= 11 && i <= 14) b = "11h";
      if (i >= 19 && i <= 23) b = " "; 
      rows.push({
        colA: a, colB: b,
        'segunda-feira': '', 'terca-feira': '', 'quarta-feira': '', 'quinta-feira': '', 'sexta-feira': '', 'sabado': '', 'domingo': ''
      });
    }
    return rows;
  };

  const headerTemplate = (label: string, dataStr: string) => (
    <div className="flex flex-col items-center justify-center w-full text-center">
      <span className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">{label}</span>
      <span className="text-[12px] font-black text-blue-700 leading-none">{dataStr}</span>
    </div>
  );

  return (
    <CrudBase<PlanilhaMedicaType>
      title="Planilha Médica"
      resourcePath="/planilhas-medicas"
      schema={PlanilhaMedicaSchema}
      defaultValues={{ titulo: 'Escala 2026', linhas: gerarLinhasIniciais() } as any}
      columns={[{ field: 'titulo', header: 'Planilha' }]}
    >
      {(control, errors) => (
        <div className="col-span-12">
          
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-t-lg border border-slate-300">
            <div className="flex gap-2">
              <Button icon="pi pi-chevron-left" className="p-button-sm p-button-rounded p-button-text" onClick={() => navegarSemana(-7)} />
              <Button label="HOJE" className="p-button-sm p-button-outlined font-bold" onClick={() => setDataBase(new Date())} />
              <Button icon="pi pi-chevron-right" className="p-button-sm p-button-rounded p-button-text" onClick={() => navegarSemana(7)} />
            </div>
            <span className="font-black text-lg text-slate-800 pr-4">
              {dataBase.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
            </span>
          </div>

          <style>{`
  /* 1. Força o colapso das bordas para eliminar vãos e alinhar alturas */
  .excel-grid .p-datatable-wrapper {
      border-collapse: collapse !important;
      border: 1px solid #d1d5db !important;
  }

  /* 2. Garante altura padrão em todas as células, inclusive as mescladas */
  .excel-grid .p-datatable-tbody > tr > td {
      border: 1px solid #d1d5db !important;
      height: 35px !important; /* Altura fixa para manter consistência */
      padding: 0 !important;
      background-clip: padding-box;
  }

  /* 3. Colunas Congeladas: Posicionamento absoluto via Sticky */
  .excel-grid .p-frozen-column {
      position: sticky !important;
      z-index: 10 !important;
      background-color: #f8fafc !important;
  }

  /* Coluna A (P) - Fixa no zero */
  .excel-grid .p-datatable-tbody > tr > td:nth-child(1),
  .excel-grid .p-datatable-thead > tr > th:nth-child(1) {
      left: 0 !important;
      min-width: 40px !important;
      max-width: 40px !important;
      border-right: 1px solid #d1d5db !important;
  }

  /* Coluna B (Setor) - Fixa exatamente após os 40px da A */
  .excel-grid .p-datatable-tbody > tr > td:nth-child(2),
  .excel-grid .p-datatable-thead > tr > th:nth-child(2) {
      left: 40px !important;
      min-width: 170px !important;
      max-width: 170px !important;
      border-right: 2px solid #cbd5e1 !important; /* Borda levemente mais escura para separar do scroll */
  }

  /* 4. Cabeçalho sempre acima */
  .excel-grid .p-datatable-thead > tr > th {
      position: sticky !important;
      top: 0;
      z-index: 20 !important;
      background-color: #f1f5f9 !important;
      border: 1px solid #cbd5e1 !important;
  }

  /* 5. Estilos de Texto e Edição */
  .col-vertical { font-weight: 900 !important; text-align: center !important; }
  .col-setor-horario { font-weight: 800 !important; text-align: center !important; }
  
  .excel-grid .p-inputtext {
    padding: 0 4px !important;
    text-align: center !important;
    text-transform: uppercase !important;
    font-weight: bold !important;
    width: 100% !important;
    height: 100% !important;
    border: none !important;
    background: transparent !important;
  }
`}</style>

          <div className="border rounded-b shadow-lg bg-white overflow-hidden">
            <Controller
              name="linhas"
              control={control}
              render={({ field }) => (
                <DataTable
                  value={field.value || []}
                  editMode="cell"
                  showGridlines
                  rowGroupMode="rowspan"
                  groupRowsBy={['colA', 'colB']} 
                  className="excel-grid p-datatable-sm"
                  scrollable 
                  scrollHeight="600px" 
                  // tableStyle={{ minWidth: '1200px' }}
                  // Removemos o showGridlines daqui porque o CSS acima já gerencia as bordas de forma mais precisa
                  tableStyle={{ minWidth: '1200px', borderCollapse: 'collapse' }}
                >
                  <Column field="colA" header="P" frozen alignFrozen="left" style={{ width: '40px', minWidth: '40px' }} className="col-vertical select-none" />
                  <Column field="colB" header="Setor / Horário" frozen alignFrozen="left" style={{ width: '170px', minWidth: '170px' }} className="col-setor-horario select-none" />

                  {agendaSemana.map((dia) => (
                    <Column
                      key={dia.field}
                      field={dia.field}
                      header={headerTemplate(dia.label, dia.formatada)}
                      style={{ width: '150px', minWidth: '150px' }}
                      onCellEditComplete={(e: any) => {
                        const { rowData, newValue, field: columnField, rowIndex } = e;
                        if (rowIndex === undefined || !field.value) return;
                        const novasLinhas = [...field.value];
                        novasLinhas[rowIndex] = { ...rowData, [columnField]: newValue.toUpperCase() };
                        field.onChange(novasLinhas);
                      }}
                      editor={(options) => (
                        <InputText 
                          value={options.value ?? ''} 
                          onChange={(e: any) => options.editorCallback(e.target.value)} 
                          autoFocus 
                        />
                      )}
                      className="text-center cursor-pointer hover:bg-blue-50 transition-colors font-bold"
                    />
                  ))}
                </DataTable>
              )}
            />
          </div>
        </div>
      )}
    </CrudBase>
  );
};