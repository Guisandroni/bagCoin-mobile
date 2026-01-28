# BagCoin - Controle Financeiro Pessoal

![React Native](https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![tRPC](https://img.shields.io/badge/tRPC-2596BE?style=for-the-badge&logo=trpc&logoColor=white)

> Um aplicativo mobile completo de controle financeiro pessoal com integração Open Finance, construído com React Native, Expo e uma arquitetura moderna de monorepo.

## 🎯 Visão Geral

O **BagCoin** é uma aplicação financeira mobile que permite aos usuários gerenciar suas finanças pessoais de forma inteligente. Com suporte a **Open Finance**, o app conecta-se diretamente às suas contas bancárias para importar transações automaticamente, oferecendo insights detalhados sobre seus gastos, receitas e padrões financeiros.

### ✨ Características Principais

- **Dashboard Financeiro**: Visão geral do saldo, receitas e despesas
- **Open Finance**: Integração com contas bancárias via Open Finance Brasil
- **Gestão de Transações**: Adicione transações manuais ou sincronize automaticamente
- **Categorização Inteligente**: Organize gastos por categorias personalizadas
- **Relatórios e Insights**: Gráficos e análises detalhadas de gastos mensais
- **Múltiplas Contas**: Gerencie contas bancárias e cartões de crédito
- **Autenticação Social**: Login via Google, Facebook ou e-mail
- **Sincronização na Nuvem**: Dados seguros e sincronizados em tempo real
- **Design Moderno**: Interface limpa com Tailwind CSS v4 e HeroUI Native

## 🛠️ Stack Tecnológica

### Mobile (`apps/native`)
- **React Native** com **Expo SDK 54** - Framework para aplicativos nativos
- **TypeScript** - Tipagem estática e segurança de código
- **Expo Router** - Roteamento baseado em arquivos
- **TailwindCSS v4** via **uniwind** - Estilização utilitária
- **HeroUI Native** - Componentes de UI modernos e acessíveis
- **Better Auth** (@better-auth/expo) - Autenticação de usuários
- **tRPC** - APIs end-to-end type-safe
- **TanStack Query** - Gerenciamento de estado servidor
- **React Native Reanimated** - Animações fluidas
- **React Native Gesture Handler** - Gestos nativos

### Backend (`apps/server`)
- **Bun** - Runtime JavaScript de alta performance
- **Elysia** - Framework web type-safe e rápido
- **tRPC** - Camada de API type-safe
- **Better Auth** - Sistema de autenticação
- **Drizzle ORM** - ORM TypeScript-first
- **SQLite/Turso** - Banco de dados edge-first

### Packages (Monorepo)
- `@bagcoin/api` - Lógica de negócio e rotas tRPC
- `@bagcoin/auth` - Configuração e lógica de autenticação
- `@bagcoin/db` - Schemas e queries do banco de dados
- `@bagcoin/env` - Variáveis de ambiente compartilhadas
- `@bagcoin/config` - Configurações compartilhadas (Biome, TypeScript)

### Ferramentas
- **Turborepo** - Build system otimizado para monorepo
- **Biome** - Linter e formatter ultra-rápido
- **Bun** - Package manager e runtime

## 📂 Estrutura do Projeto

```
bagcoin/
├── apps/
│   ├── native/                # Aplicação React Native/Expo
│   │   ├── app/               # Rotas (Expo Router)
│   │   │   ├── (auth)/        # Telas de login e registro
│   │   │   └── (app)/         # Telas autenticadas
│   │   │       └── (tabs)/    # Navegação em abas
│   │   │           ├── index.tsx       # Home/Dashboard
│   │   │           ├── expenses.tsx    # Despesas
│   │   │           ├── income.tsx      # Receitas
│   │   │           ├── reports.tsx     # Relatórios
│   │   │           └── profile.tsx     # Perfil do usuário
│   │   ├── components/        # Componentes React Native
│   │   │   ├── home/          # Cards do dashboard
│   │   │   ├── transactions/  # Lista de transações
│   │   │   ├── accounts/      # Cartões de contas bancárias
│   │   │   ├── forms/         # Formulários
│   │   │   └── ui/            # Componentes base
│   │   ├── contexts/          # Context API
│   │   └── lib/               # Utilitários e config
│   │
│   └── server/                # Backend API (Elysia + tRPC)
│       └── src/
│           └── index.ts       # Entrada da aplicação
│
├── packages/
│   ├── api/                   # Rotas tRPC e lógica de negócio
│   ├── auth/                  # Better Auth config
│   ├── db/                    # Drizzle schemas e migrations
│   ├── env/                   # Variáveis de ambiente (Zod)
│   └── config/                # Configurações compartilhadas
│
├── package.json               # Scripts do workspace
├── turbo.json                 # Configuração Turborepo
└── biome.json                 # Configuração Biome
```

## 🚀 Como Executar

### Pré-requisitos

- **Bun** 1.3+ ([instalação](https://bun.sh))
- **Node.js** 18+ (para Expo CLI)
- **Expo Go** app no celular ou emulador Android/iOS

### Instalação do Bun

**Linux/macOS:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows:**
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

### Configuração

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Guisandroni/bagcoin.git
   cd bagcoin
   ```

2. **Instale as dependências:**
   ```bash
   bun install
   ```

3. **Configure o banco de dados:**

   Crie um arquivo `.env` em `apps/server/`:
   ```env
   DATABASE_URL="file:./local.db"
   # ou usando Turso (recomendado para produção)
   DATABASE_URL="libsql://[your-database].turso.io"
   DATABASE_AUTH_TOKEN="[your-token]"
   
   BETTER_AUTH_SECRET="[seu-secret-aqui]"
   BETTER_AUTH_URL="http://localhost:3000"
   ```

4. **Execute as migrations:**
   ```bash
   bun run db:push
   ```

### Executando o Projeto

**Opção 1: Tudo de uma vez (recomendado para desenvolvimento)**

```bash
bun run dev
```

Isso iniciará simultaneamente:
- Backend API em `http://localhost:3000`
- Aplicativo mobile (Expo)

**Opção 2: Serviços separados**

Terminal 1 - Backend:
```bash
bun run dev:server
```

Terminal 2 - Mobile:
```bash
bun run dev:native
```

### Acessando o App

- Escaneie o QR code com o **Expo Go** (Android/iOS)
- Ou pressione:
  - `a` - Android emulator
  - `i` - iOS simulator
  - `w` - Web browser

## 📜 Scripts Disponíveis

### Scripts Globais (raiz do projeto)

- `bun run dev` - Inicia todos os apps em modo desenvolvimento
- `bun run build` - Build de todos os apps
- `bun run check-types` - Verifica tipos TypeScript
- `bun run check` - Executa Biome (lint + format)

### Scripts Específicos

- `bun run dev:native` - Apenas o app mobile
- `bun run dev:server` - Apenas o backend
- `bun run dev:web` - Apenas o web app (se disponível)

### Scripts de Banco de Dados

- `bun run db:push` - Aplica schema ao banco
- `bun run db:studio` - Abre Drizzle Studio (UI do banco)
- `bun run db:generate` - Gera migrations
- `bun run db:migrate` - Executa migrations
- `bun run db:local` - Inicia banco SQLite local

## 🎨 Design do App

O aplicativo possui as seguintes telas principais:

### 🏠 Home (Dashboard)
- Card de saldo financeiro com variação percentual
- Resumo de receitas e despesas do mês
- Gráfico de gastos mensais
- Card de Open Finance (contas conectadas)
- Lista de transações recentes

### 💸 Despesas
- Lista filtrada de todas as despesas
- Filtros por categoria e período
- Criação de nova despesa

### 💰 Receitas
- Lista filtrada de todas as receitas
- Categorização de fontes de renda
- Adição manual de receitas

### 📊 Relatórios
- Gráficos detalhados de gastos por categoria
- Análise de tendências mensais
- Comparativos período a período
- Insights financeiros

### 👤 Perfil
- Configurações da conta
- Gerenciamento de contas bancárias vinculadas
- Categorias personalizadas
- Notificações

## 🔐 Autenticação

O BagCoin utiliza **Better Auth** para gerenciar autenticação com suporte a:
- Login social (Google, Facebook)
- E-mail e senha
- Magic links (e-mail sem senha)
- Sessões seguras com tokens JWT

## 🏦 Open Finance

O aplicativo suporta integração com instituições financeiras brasileiras através do **Open Finance Brasil**, permitindo:
- Conexão segura com bancos e fintechs
- Importação automática de transações
- Sincronização de saldo em tempo real
- Atualização de dados bancários

## 📱 Screenshots

> As telas do aplicativo estão disponíveis na pasta `stitch_financial_home_summary/` do projeto, mostrando:
> - Tela de login social
> - Dashboard financeiro
> - Formulário de transações
> - Contas conectadas via Open Finance
> - Relatórios e gráficos

## 🧪 Testes

```bash
# Executar testes (quando disponível)
bun run test
```

## 📦 Build de Produção

### Android
```bash
cd apps/native
bun run android
```

### iOS
```bash
cd apps/native
bun run ios
```

