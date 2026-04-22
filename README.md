# Backcoin - Assistente Financeiro Inteligente (Multi-Agent)

**Backcoin** é um ecossistema de gestão financeira pessoal que transforma o WhatsApp e o Telegram em interfaces conversacionais poderosas. Utilizando uma arquitetura de múltiplos agentes (LangGraph), o sistema é capaz de processar despesas via texto, áudio, imagens e extratos bancários complexos, oferecendo análises profundas e recomendações baseadas em dados reais e pesquisa na web.

---

## 🚀 Funcionalidades Principais

### 1. Captura Inteligente de Dados
- **Texto**: Registro natural de gastos (ex: "Gastei 50 reais em pizza").
- **Áudio (Whisper)**: Transcrição instantânea de mensagens de voz.
- **Visão (OCR - Llama 3.2 Vision)**: Leitura de fotos de comprovantes e recibos.
- **Documentos (PDF/CSV/OFX)**: Processamento em massa de extratos bancários com deduplicação inteligente.

### 2. Análise e Consultoria
- **Text-to-SQL**: Consultas analíticas complexas em linguagem natural (ex: "Qual minha média de gastos com lazer no último mês?").
- **Deep Research (Tavily)**: Pesquisa em tempo real na web para fundamentar dicas de investimento e economia.
- **Relatórios PDF**: Geração de extratos profissionais formatados sob demanda.

### 3. Segurança e Onboarding
- **Ativação via Web**: Fluxo de entrada seguro onde o usuário gera um token único no site e ativa sua conta enviando-o para o bot.
- **Isolamento de Contexto**: Históricos de conversa separados por plataforma, mantendo a privacidade.

---

## 🏗️ Arquitetura do Projeto

O projeto é dividido em uma estrutura monorepo para facilitar o desenvolvimento e deploy:

- **`apps/server`**: Backend em **FastAPI** (Python).
  - Orquestração: **LangGraph**.
  - Inteligência: **Groq (Llama 3.3 / 3.2)**.
  - Banco de Dados: **PostgreSQL** via **SQLModel**.
  - Integração: **Green API** (WhatsApp & Telegram).
- **`apps/web`**: Frontend em **Next.js 16** (React 19).
  - Estilização: **Tailwind CSS v4**.
  - Runtime: **Bun**.
  - Landing page moderna com sistema de pré-registro de tokens.

---

## 🛠️ Tecnologias Utilizadas

- **Linguagens**: Python 3.12+, TypeScript.
- **Agentes**: LangChain / LangGraph.
- **LLMs**: Llama 3.3 70B (Raciocínio), Llama 3.2 11B Vision (OCR), Whisper Large V3 (Voz).
- **Busca**: Tavily Search API.
- **Infra**: Docker & Docker Compose.
- **Mensageria**: Green API.

---

## 📦 Como Executar

### Pré-requisitos
- Docker e Docker Compose instalados.
- Chaves de API (Groq, Tavily, Green API).

### Passo a Passo
1.  **Clone o Repositório**:
    ```bash
    git clone https://github.com/Guisandroni/bagCoin.git
    cd bagCoin
    ```

2.  **Configure as Variáveis de Ambiente**:
    - No diretório `apps/server`, crie um arquivo `.env` baseado no `.env.example`.
    - No diretório `apps/web`, crie um arquivo `.env.local` com a URL da API.

3.  **Inicie os Serviços**:
    ```bash
    docker-compose up -d --build
    ```

4.  **Acesse as Interfaces**:
    - **Web**: [http://localhost:3000](http://localhost:3000)
    - **API (Swagger)**: [http://localhost:8001/docs](http://localhost:8001/docs)

---

## 📜 Licença
Este projeto foi desenvolvido para fins de gestão financeira pessoal e automação inteligente.
© 2026 Backcoin Kinetic. Todos os direitos reservados.
