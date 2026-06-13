import { z } from 'zod';
import { baseEntitySchema } from '@/types/baseEntity';
import { DateUtils } from '@/utils/DateUtils';

export const medicoSchema = baseEntitySchema.extend({
  nome: z.string()
    .min(1, 'Nome é obrigatório')
    .max(60, 'O nome deve ter no máximo 60 caracteres'),
    
  sigla: z.string()
    .length(3, 'A sigla deve ter exatamente 3 dígitos'),
  dataAssociacao: z.date().or(z.string()).optional().nullable().transform((val) => 
    val instanceof Date ? DateUtils.paraISO(val) : val
  ),
  especialidades: z.array(z.number()).min(1, 'Especialidades é obrigatório'),
  especialidadesDescricao: z.string().optional(),
  ativo: z.boolean().default(true),
}).refine((data) => {
  // Verifica se a especialidade '1' (Anestesista) está selecionada
  const isAnestesista = data.especialidades?.includes(1);
  
  // Se for anestesista, a data de associação torna-se obrigatória
  if (isAnestesista) {
    return !!data.dataAssociacao;
  }
  return true;
}, {
  message: 'Data de associação é obrigatória para anestesistas',
  path: ['dataAssociacao'],
});

export type Medico = z.infer<typeof medicoSchema>;