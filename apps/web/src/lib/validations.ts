import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
})

export const registerSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
    email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(128, "Senha muito longa"),
    confirmPassword: z.string().min(1, "Confirme a senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  })

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  })

export const budgetSchema = z.object({
  category: z.string().min(1, "Categoria é obrigatória"),
  total_limit: z.number().positive("Limite deve ser maior que zero"),
  period: z.enum(["weekly", "monthly", "yearly"], { message: "Período inválido" }),
})

export const goalSchema = z.object({
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres").max(100, "Título muito longo"),
  target_amount: z.number().positive("Valor deve ser maior que zero"),
  current_amount: z.number().min(0, "Valor não pode ser negativo"),
  deadline: z.string().optional(),
})

export const transactionSchema = z.object({
  name: z.string().min(1, "Descrição é obrigatória").max(200, "Descrição muito longa"),
  amount: z.number().refine((v) => v !== 0, "Valor não pode ser zero"),
  category: z.string().min(1, "Categoria é obrigatória"),
  date: z.string().min(1, "Data é obrigatória"),
  type: z.enum(["INCOME", "EXPENSE"], { message: "Tipo inválido" }),
})

export const accountSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  bank: z.string().min(1, "Banco é obrigatório"),
  balance: z.number(),
})

export const creditCardSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  issuer: z.string().min(1, "Emissor é obrigatório"),
  limit: z.number().positive("Limite deve ser maior que zero"),
  closing_day: z.number().int().min(1).max(31, "Dia inválido"),
  due_day: z.number().int().min(1).max(31, "Dia inválido"),
})

export const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type BudgetInput = z.infer<typeof budgetSchema>
export type GoalInput = z.infer<typeof goalSchema>
export type TransactionInput = z.infer<typeof transactionSchema>
export type AccountInput = z.infer<typeof accountSchema>
export type CreditCardInput = z.infer<typeof creditCardSchema>
export type ProfileInput = z.infer<typeof profileSchema>
