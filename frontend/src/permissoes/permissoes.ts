import z from "zod";

export const permissoesSchema = z.object({
    id: z.string(),
    modulo: z.string(),
    descricao: z.string(),
    acao: z.string(),
    icone: z.string(),
    exibirNoMenu: z.boolean(),
    rota: z.string().optional()
  });
  
  export type Permissoes = z.infer<typeof permissoesSchema>;