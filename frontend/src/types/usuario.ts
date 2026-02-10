import { z } from 'zod';
import { baseEntitySchema } from '@/types/baseEntity'

export const usuarioSchema = baseEntitySchema.extend({
  nome: z.string().min(1, 'Nome é obrigatório'),
  login: z.string().min(1, 'Login é obrigatório'),
  ativo: z.boolean().default(true),
  senha: z.string().optional().or(z.literal('')),
  confirmarSenha: z.string().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  // Se NÃO tem ID (Novo Usuário), a senha DEVE ter ao menos 6 caracteres
  if (!data.id) {
    if (!data.senha || data.senha.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A senha é obrigatória para novos usuários",
        path: ["senha"],
      });
    }
  }

  // Validação de igualdade (apenas se algum dos campos for preenchido)
  if (data.senha || data.confirmarSenha) {
    if (data.senha !== data.confirmarSenha) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "As senhas não conferem",
        path: ["confirmarSenha"],
      });
    }
  }
});

export type Usuario = z.infer<typeof usuarioSchema>;