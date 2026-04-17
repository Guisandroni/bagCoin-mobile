# Agent Chatbot Financeiro via WhatsApp

MVP de um assistente financeiro que utiliza LangGraph e Groq para processar transações via WhatsApp (Green API).

## Tecnologias
- **FastAPI**: Gateway de API.
- **SQLModel (SQLAlchemy + Pydantic)**: Persistência em PostgreSQL.
- **LangGraph**: Orquestração de agentes.
- **Groq (Llama 3)**: Inteligência para extração e roteamento (via Groq Cloud).
- **Green API**: Integração com WhatsApp seguindo o padrão da biblioteca `whatsapp-api-client-python`.

## Setup

1.  **Clone o repositório**
2.  **Instale as dependências**
    ```bash
    uv sync
    ```
3.  **Configure o ambiente**
    Crie um arquivo `.env` baseado no `.env.example`.
4.  **Inicie o banco de dados**
    ```bash
    docker-compose up -d
    ```
5.  **Inicie a aplicação**
    ```bash
    uv run uvicorn src.main:app --reload
    ```
6.  **Exponha localmente (opcional para testes reais)**
    Use `ngrok` ou `zrok` para expor a porta 8000 e configurar o webhook no console da Green API (`/webhook/green-api`).


## Estrutura do Projeto
- `src/main.py`: Entrada da aplicação e webhooks.
- `src/models.py`: Modelos de dados.
- `src/database.py`: Configuração do banco.
- `src/agents/`: Lógica do sistema multi-agente (LangGraph).
  - `state.py`: Definição de estado.
  - `nodes.py`: Implementação dos nós (IA e DB).
  - `graph.py`: Definição do fluxo.
