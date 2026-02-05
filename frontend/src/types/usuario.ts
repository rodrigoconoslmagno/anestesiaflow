import { z } from 'zod';

export const usuarioSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  perfil: z.string().min(1, 'Selecione um perfil'),
  ativo: z.boolean(),
  // Senha é obrigatória apenas no cadastro
  senha: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
});

export type UsuarioFormData = z.infer<typeof usuarioSchema>;