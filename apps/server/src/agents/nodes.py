import json
import base64
import io
import re
import structlog
from datetime import date, datetime, timedelta
from typing import Literal, Dict, Any, List, Optional
import pdfplumber
from groq import Groq
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from sqlmodel import Session, select
from ..core.database import engine
from ..models.user import User
from ..models.transaction import Transaction
from .state import AgentState, TransactionExtraction
from .categories import get_category_prompt, CATEGORIES
from ..config import settings
from ..services.report_service import generate_financial_report
from langchain_community.tools.tavily_search import TavilySearchResults
from ..services.statement_service import parse_csv_statement, parse_pdf_statement, parse_ofx_statement
from pydantic import BaseModel

logger = structlog.get_logger()

llm = ChatGroq(
    model="llama-3.3-70b-versatile", 
    groq_api_key=settings.GROQ_API_KEY
)

vision_llm = ChatGroq(
    model="llama-3.2-11b-vision-preview",
    groq_api_key=settings.GROQ_API_KEY
)

groq_client = Groq(api_key=settings.GROQ_API_KEY)

search_tool = None
if settings.TAVILY_API_KEY:
    search_tool = TavilySearchResults(tavily_api_key=settings.TAVILY_API_KEY)

def get_active_user(whatsapp_number: str) -> Optional[User]:
    with Session(engine) as session:
        statement = select(User).where(User.whatsapp_number == whatsapp_number, User.is_active == True)
        return session.exec(statement).first()

def router_node(state: AgentState) -> Dict[str, Any]:
    whatsapp_number = state["whatsapp_number"]
    last_message = state["messages"][-1].content
    msg_lower = last_message.lower()

    # 1. Identify user
    user = None
    user_id_from_state = state.get("user_id")
    if user_id_from_state:
        user = get_active_user(whatsapp_number)

    if not user:
        user = get_active_user(whatsapp_number)

    # 2. Not authenticated
    if not user:
        if "Activation code:" in last_message or re.search(r"/start\s*([\w-]+)", last_message):
            return {"intent": "auth"}
        else:
            return {"intent": "unauthorized"}

    # 3. Conversational flow controls FIRST
    if state.get("awaiting_budget_month"):
        logger.info("router_follow_up_budget", chat_id=whatsapp_number)
        return {"intent": "budget", "user_id": user.id}

    # 4. Check if we are awaiting file type confirmation
    awaiting_file = state.get("awaiting_file_type")
    pending_file = state.get("pending_file_bytes")

    if awaiting_file and pending_file:
        return {"intent": "awaiting_file_type", "user_id": user.id}

    # 5. Check if current message contains a file
    file_type = state.get("file_type")

    if file_type == "audio":
        return {
            "intent": "audio",
            "user_id": user.id,
            "pending_file_bytes": state.get("file_bytes"),
            "pending_file_type": "audio",
            "awaiting_file_type": True,
        }
    elif file_type == "image":
        return {
            "intent": "image",
            "user_id": user.id,
            "pending_file_bytes": state.get("file_bytes"),
            "pending_file_type": "image",
            "awaiting_file_type": True,
        }
    elif file_type == "pdf":
        return {
            "intent": "pdf",
            "user_id": user.id,
            "pending_file_bytes": state.get("file_bytes"),
            "pending_file_type": "pdf",
            "awaiting_file_type": True,
        }

    # 6. Text messages — fast-path keyword rules
    help_keywords = [
        "aprender", "ensinar", "como faço", "como posso", "como registrar",
        "tutorial", "me explica", "me ensina", "funciona", "ajuda",
        "o que voce faz", "o que você faz", "quem é você", "quem e voce",
        "como usar", "primeira vez", "novo aqui", "guia", "dica",
        "como funciona", "o que voce pode fazer"
    ]
    query_keywords = [
        "quanto gastei", "quanto ja gastei", "meu saldo", "total de gastos",
        "quanto recebi", "balanco", "resumo", "extrato", "historico",
        "mostrar", "ver meus", "consultar", "quanto foi",
        "gastos do mes", "gastos da semana", "receitas do mes",
        "saldo", "gerar relatorio", "resumo mensal"
    ]

    if any(kw in msg_lower for kw in help_keywords):
        return {"intent": "chat", "user_id": user.id}

    if any(kw in msg_lower for kw in query_keywords):
        return {"intent": "query", "user_id": user.id}

    # Short vague messages without numbers should be chat, not record/query
    words = last_message.strip().split()
    if len(words) <= 2:
        has_number = bool(re.search(r'\d', last_message))
        if not has_number:
            return {"intent": "chat", "user_id": user.id}

    # 5. Fallback to LLM with comprehensive few-shot examples for all intents
    system_prompt = """You are a financial assistant intent router. Classify the user message into EXACTLY one of:
- 'record': User is reporting a SPECIFIC expense or income with an amount. Examples: "gastei 50 no mercado", "uber 12 reais", "salario 5000", "paguei 200 de luz".
- 'query': User wants to KNOW something about their existing data. Examples: "quanto gastei esse mes?", "qual meu maior gasto?", "saude nos ultimos 3 meses", "gastos" (when asking about data).
- 'budget': User wants to create or check a budget. Examples: "definir orcamento", "criar limite de gastos", "como esta meu orcamento", "definir 5000 para alimentacao".
- 'fund': User wants to create or manage savings funds/goals. Examples: "criar fundo", "meta de viagem", "reserva de emergencia".
- 'reminder': User wants to create or check reminders. Examples: "me lembra de pagar a luz", "criar lembrete", "proximos vencimentos".
- 'shopping_list': User wants to manage shopping list. Examples: "anota leite e pao", "ver lista de compras".
- 'subscription': User wants to manage subscriptions/fixed expenses. Examples: "assinaturas", "gastos fixos", "mensalidade", "netflix 39 mensal".
- 'custom_category': User wants to manage custom categories. Examples: "nova categoria", "categorias personalizadas".
- 'report': User wants a PDF report or complete statement. Examples: "gerar relatorio", "pdf dos gastos", "extrato completo".
- 'recommendation': User wants financial advice. Examples: "onde investir", "como economizar", "dicas financeiras".
- 'chat': General conversation, onboarding, asking how to use the bot, or unclear intent. Examples: "quero aprender", "como funciona", "oi", "obrigado", "ajuda".

EDGE CASES — classify as follows:
- "quanto gastei esse mes" -> query (asking about data)
- "definir 3000 para transporte" -> budget (allocating money to a category limit)
- "me lembra de pagar a luz dia 10" -> reminder (asking to be reminded)
- "anota leite, pao, ovos" -> shopping_list (adding grocery items)
- "assinatura netflix 39 mensal" -> subscription (managing recurring expense)
- "ajuda" -> chat (asking for help)
- "quero criar um fundo para viagem" -> fund (savings goal)
- "gastei 45 no mercado" -> record (reporting an expense)
- "recebi 2500 de salario" -> record (reporting income)
- "saldo" -> query (asking about balance)

CRITICAL RULES:
- If the message has NO numeric amount, it is NEVER 'record'.
- If the user asks HOW to do something or wants to LEARN, it is ALWAYS 'chat'.
- If the user asks ABOUT their data, it is ALWAYS 'query'.
- If the user allocates a money limit to a category (e.g. "5000 para alimentacao"), it is 'budget', NOT 'record'.
- Return ONLY the intent name in lowercase, nothing else."""

    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=last_message)
    ])

    intent = response.content.strip().lower()
    valid_intents = ["record", "query", "budget", "fund", "reminder", "shopping_list",
                     "subscription", "custom_category", "report", "recommendation", "chat"]
    if intent not in valid_intents:
        intent = "chat"

    return {"intent": intent, "user_id": user.id}

def auth_node(state: AgentState) -> Dict[str, Any]:
    last_message = state["messages"][-1].content
    whatsapp_number = state["whatsapp_number"]
    
    match = re.search(r"(?:Activation code:|/start)\s*([\w-]+)", last_message)
    if not match:
        return {"messages": [AIMessage(content="Código de ativação não encontrado. Por favor, envie o código de ativação, referente ao seu número de WhatsApp, na nossa página web.")]}
    
    token = match.group(1).strip()
    
    with Session(engine) as session:
        statement = select(User).where(User.activation_token == token)
        user = session.exec(statement).first()
        
        if user:
            if user.is_active:
                return {"messages": [AIMessage(content="Este código de ativação é inválido ou já foi utilizado.")]}
            
            user.whatsapp_number = whatsapp_number
            user.is_active = True
            user.activation_token_expires_at = datetime.utcnow() + timedelta(days=7)
            session.add(user)
            session.commit()
            
            user_name = user.name or state.get("pushname") or "usuário"
            return {
                "user_id": user.id,
                "messages": [AIMessage(content=f"Conexão estabelecida com sucesso! Olá {user_name}, agora você pode registrar seus gastos e consultar suas finanças por aqui.")]
            }
        else:
            return {"messages": [AIMessage(content="Código de ativação inválido. Verifique o código na página web e tente novamente.")]}

def unauthorized_node(state: AgentState) -> Dict[str, Any]:
    pushname = state.get("pushname")
    name = pushname or "amigo"
    msg = (
        f"Olá, {name}! Sou seu Assistente Financeiro Pessoal. Estou aqui para ajudar você a organizar seus gastos, "
        f"acompanhar seu orçamento e tomar melhores decisões financeiras.\n\n"
        f"*O que eu posso fazer por você:*\n\n"
        f"1. *Registrar Gastos e Ganhos*\n"
        f"   Basta me enviar uma mensagem simples. Exemplos:\n"
        f"   - \"Gastei 45 no mercado\" → Registro em Alimentação\n"
        f"   - \"Uber pra casa 12 reais\" → Registro em Transporte\n"
        f"   - \"Salário caiu 5000\" → Registro em Receita\n\n"
        f"2. *Consultar Seus Dados*\n"
        f"   Pergunte sobre seus gastos a qualquer momento:\n"
        f"   - \"Quanto gastei esse mês?\"\n"
        f"   - \"Qual meu maior gasto?\"\n"
        f"   - \"Gastos de saúde nos últimos 3 meses\"\n\n"
        f"3. *Importar Extratos*\n"
        f"   Envie um PDF, CSV ou OFX do seu banco que eu extraio automaticamente todos os lançamentos.\n\n"
        f"4. *Análise e Recomendações*\n"
        f"   Posso analisar seus hábitos de consumo e dar dicas personalizadas para economizar.\n\n"
        f"Para começar, você precisa de um código de ativação válido por 7 dias.\n\n"
        f"*Dica:* Quanto mais você registrar, mais precisas serão minhas análises. Vamos começar?"
    )
    return {"messages": [AIMessage(content=msg)]}

def parse_flexible_date(date_str: str) -> date:
    if not date_str:
        return date.today()
    
    formats = ["%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d", "%d-%m-%Y"]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return date.today()

def statement_node(state: AgentState) -> Dict[str, Any]:
    print("Processing bank statement...")
    file_bytes = state.get("file_bytes")
    file_type = state.get("file_type")
    
    raw_content = ""
    if file_type == "csv":
        raw_content = parse_csv_statement(file_bytes)
    elif file_type == "pdf":
        raw_content = parse_pdf_statement(file_bytes)
    elif file_type == "ofx":
        data = parse_ofx_statement(file_bytes)
        raw_content = f"OFX Data: {json.dumps(data)}"
        
    today = date.today().isoformat()
    
    class TransactionList(BaseModel):
        transactions: List[TransactionExtraction]

    category_prompt = get_category_prompt()
    structured_llm = llm.with_structured_output(TransactionList)

    prompt = (
        f"Extract all financial transactions (expenses and income) from this bank statement. "
        f"Ignore balances, transfers between accounts of the same owner, or informational lines. "
        f"Today is {today}. "
        f"\n\n{category_prompt}\n\n"
        f"IMPORTANT: The 'description' should be a short, clean label WITHOUT the amount value. "
        f"\n\nSTATEMENT CONTENT:\n{raw_content[:4000]}"
    )
    
    try:
        extracted = structured_llm.invoke(prompt)
        transaction_list = extracted.transactions
        
        user_id = state.get("user_id")
        
        saved_count = 0
        with Session(engine) as session:
            for txn in transaction_list:
                t_date = parse_flexible_date(txn.date)

                raw_category = (txn.category or "").strip()
                normalized_category = None
                for allowed in CATEGORIES:
                    if allowed.lower() == raw_category.lower():
                        normalized_category = allowed
                        break
                if not normalized_category:
                    normalized_category = "Outros"

                existing = session.exec(
                    select(Transaction).where(
                        Transaction.user_id == user_id,
                        Transaction.amount == txn.amount,
                        Transaction.description == txn.description,
                        Transaction.transaction_date == t_date
                    )
                ).first()

                if not existing:
                    new_txn = Transaction(
                        user_id=user_id,
                        amount=txn.amount,
                        description=txn.description,
                        category=normalized_category,
                        transaction_date=t_date,
                        source_file=file_type
                    )
                    session.add(new_txn)
                    saved_count += 1
            session.commit()
            
        msg = f"Extrato processado! Encontrei {len(transaction_list)} lançamentos e importei {saved_count} novas transações para o seu histórico."
    except Exception as e:
        print(f"Error processing statement: {e}")
        msg = "Desculpe, tive um problema ao processar este formato de extrato."
        
    return {
        "messages": [AIMessage(content=msg)]
    }

def research_node(state: AgentState) -> Dict[str, Any]:
    if not search_tool:
        return {"query_result": "Search tool not configured."}
        
    last_message = state["messages"][-1].content
    print(f"Researching context for: {last_message}")
    
    results = search_tool.invoke({"query": f"melhores investimentos e dicas de economia 2024 brasil: {last_message}"})
    links = [r["url"] for r in results[:2]]
    context = "\n".join([r["content"] for r in results])
    
    return {
        "query_result": context,
        "sources": links
    }

def recommendation_node(state: AgentState) -> Dict[str, Any]:
    print("Generating recommendations with sources...")
    user_id = state.get("user_id")
    external_context = state.get("query_result") or ""
    sources = state.get("sources") or []
    
    with Session(engine) as session:
        statement = select(Transaction).where(Transaction.user_id == user_id).order_by(Transaction.transaction_date.desc()).limit(50)
        transactions = session.exec(statement).all()
        
    spending_summary = "Nenhum gasto registrado ainda."
    if transactions:
        cats = {}
        for t in transactions:
            cats[t.category] = cats.get(t.category, 0) + t.amount
        spending_summary = "\n".join([f"- {cat}: R$ {amt:.2f}" for cat, amt in cats.items()])

    source_text = "\n".join([f"- {url}" for url in sources])
    
    prompt = f"""Com base no perfil de gastos do usuário e no contexto externo, forneça 3 recomendações personalizadas.
    
    GASTOS DO USUÁRIO:
    {spending_summary}
    
    CONTEXTO DE MERCADO:
    {external_context}
    
    FONTES DE REFERÊNCIA:
    {source_text}
    
    IMPORTANTE: No final da sua resposta, adicione uma seção chamada "Fontes consultadas:" e liste os links fornecidos. 
    Responda em português de forma amigável."""
    
    response = llm.invoke([
        SystemMessage(content="Você é um consultor financeiro pessoal inteligente."),
        HumanMessage(content=prompt)
    ])
    
    return {"messages": [AIMessage(content=response.content)]}

def report_node(state: AgentState) -> Dict[str, Any]:
    print("Generating report...")
    user_id = state.get("user_id")
    
    with Session(engine) as session:
        user = session.get(User, user_id)
        statement = select(Transaction).where(Transaction.user_id == user_id).order_by(Transaction.transaction_date.desc()).limit(100)
        transactions = session.exec(statement).all()
        
    if not transactions:
        return {"messages": [AIMessage(content="Você não possui transações para gerar um relatório.")]}
        
    user_name = user.name or state.get("pushname") or state["whatsapp_number"]
    pdf_bytes = generate_financial_report(user_name, transactions)
    
    return {
        "report_pdf_bytes": pdf_bytes,
        "messages": [AIMessage(content="Relatório gerado com sucesso!")]
    }

def audio_node(state: AgentState) -> Dict[str, Any]:
    print("Transcribing audio...")
    file_bytes = state.get("file_bytes")
    audio_file = ("audio.ogg", file_bytes)
    
    transcription = groq_client.audio.transcriptions.create(
        file=audio_file,
        model="whisper-large-v3",
        response_format="text"
    )
    
    print(f"Transcription: {transcription}")
    
    return {
        "messages": [HumanMessage(content=transcription)],
        "intent": "record"
    }

def vision_node(state: AgentState) -> Dict[str, Any]:
    print("Processing image OCR...")
    file_bytes = state.get("file_bytes")
    base64_image = base64.b64encode(file_bytes).decode('utf-8')
    
    prompt = "Identify if this is a receipt or financial document. If so, extract the total value, items, date, and description. If not, just describe the image."
    
    message = HumanMessage(
        content=[
            {"type": "text", "text": prompt},
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"},
            },
        ]
    )
    
    response = vision_llm.invoke([message])
    print(f"Vision response: {response.content}")
    
    return {
        "messages": [HumanMessage(content=f"OCR Result: {response.content}")],
        "intent": "record"
    }

def document_node(state: AgentState) -> Dict[str, Any]:
    print("Processing PDF...")
    file_bytes = state.get("file_bytes")
    text = ""
    
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
            
    print(f"PDF Text extracted: {text[:100]}...")
    
    return {
        "messages": [HumanMessage(content=f"Extracted from PDF: {text}")],
        "intent": "record"
    }

def extraction_node(state: AgentState) -> Dict[str, Any]:
    last_message = state["messages"][-1].content
    today = date.today().isoformat()

    # Pre-validation: check if message actually contains a numeric amount
    import re as _re
    has_amount = bool(_re.search(r'\d+[.,]?\d*', last_message))
    if not has_amount:
        return {
            "messages": [AIMessage(content="Não entendi como um registro financeiro. Para registrar um gasto ou receita, envie algo como: 'Gastei 45 no mercado' ou 'Salario 5000'. Quer que eu te explique como funciona?")]
        }

    structured_llm = llm.with_structured_output(TransactionExtraction)

    category_prompt = get_category_prompt()
    prompt = (
        f"Extract transaction details from the following message. "
        f"Today is {today}. "
        f"\n\n{category_prompt}\n\n"
        f"IMPORTANT: The 'description' should be a short, clean label WITHOUT the amount value. "
        f"For example, if the user says 'gastei 50 no mercado', description must be 'Mercado', not 'Mercado 50'. "
        f"If the message does not contain a real financial transaction, return amount=0 and description=''. "
        f"\n\nMessage: {last_message}"
    )

    extracted = structured_llm.invoke(prompt)

    # Post-validation: reject invalid extractions
    if extracted.amount == 0 or not extracted.description or extracted.description.strip() == "":
        return {
            "messages": [AIMessage(content="Não consegui identificar um valor ou descrição válidos para registrar. Tente algo como: 'Gastei 50 no mercado' ou 'Uber 12 reais'.")]
        }

    # Normalize category to the allowed list (case-insensitive)
    raw_category = (extracted.category or "").strip()
    normalized_category = None
    for allowed in CATEGORIES:
        if allowed.lower() == raw_category.lower():
            normalized_category = allowed
            break
    if not normalized_category:
        normalized_category = "Outros"

    user_id = state.get("user_id")

    with Session(engine) as session:
        transaction = Transaction(
            user_id=user_id,
            amount=extracted.amount,
            description=extracted.description,
            category=normalized_category,
            transaction_date=parse_flexible_date(extracted.date),
            source_file="manual"
        )
        session.add(transaction)
        session.commit()

    return {
        "extracted_data": extracted,
        "messages": [AIMessage(content=f"Registrado: R$ {extracted.amount:.2f} em {extracted.description}.")]
    }

def query_node(state: AgentState) -> Dict[str, Any]:
    last_message = state["messages"][-1].content
    user_id = state.get("user_id")
    
    schema = """
    Table 'user': id (int), whatsapp_number (str), name (str)
    Table 'transaction': id (int), user_id (int), amount (float), description (str), category (str), transaction_date (date)
    """
    
    system_prompt = f"""You are a Text-to-SQL expert. Given the schema below, generate a PostgreSQL query to answer the user's question.
    Schema: {schema}
    IMPORTANT:
    - Always filter by user_id = {user_id}.
    - ALWAYS quote the table name "transaction" like this: SELECT * FROM "transaction" (because it is a reserved word).
    - Amounts are ALWAYS positive. Category 'Receita' means income; ALL other categories mean expenses.
    - Do NOT use amount < 0 for expenses. Use category != 'Receita' or category = 'Receita' instead.
    - Return ONLY the SQL query.
    - User questions are in Portuguese.
    """
    
    sql_response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=last_message)
    ])
    
    sql_query = sql_response.content.strip().replace("```sql", "").replace("```", "")
    print(f"Generated SQL: {sql_query}")
    
    try:
        with Session(engine) as session:
            from sqlalchemy import text
            results = session.execute(text(sql_query)).mappings().all()
            
        format_prompt = f"""Transcreva os dados brutos abaixo em uma resposta natural em português para o usuário.
        Pergunta: {last_message}
        Dados: {results}
        """
        
        final_response = llm.invoke([
            SystemMessage(content="Você é um assistente financeiro prestativo."),
            HumanMessage(content=format_prompt)
        ])
        msg = final_response.content
        
    except Exception as e:
        print(f"SQL Error: {e}")
        msg = "Desculpe, tive dificuldade em consultar esses dados específicos."
        
    return {
        "query_result": msg,
        "messages": [AIMessage(content=msg)]
    }

def chat_node(state: AgentState) -> Dict[str, Any]:
    last_message = state["messages"][-1].content
    user_id = state.get("user_id")

    system_prompt = """You are Bagcoin, a helpful Brazilian Portuguese financial assistant running inside WhatsApp.

Your main capabilities:
1. REGISTER transactions: user sends "gastei 45 no mercado" and you log it.
2. QUERY data: user asks "quanto gastei esse mes?" and you search their history.
3. IMPORT statements: user sends PDF/CSV/OFX bank files.
4. REPORTS: user asks for a PDF report.
5. RECOMMENDATIONS: user asks for financial advice.

When the user asks HOW to do something (onboarding/tutorial), give clear, concise instructions with examples.

EXAMPLES OF HOW TO REGISTER:
- "Gastei 45 no mercado" -> Alimentacao
- "Uber pra casa 12 reais" -> Transporte
- "Salario caiu 5000" -> Receita
- "Paguei 200 de luz" -> Luz
- "Netflix 39,90" -> Assinaturas

EXAMPLES OF QUERIES:
- "Quanto gastei esse mes?"
- "Qual meu maior gasto?"
- "Gastos de saude nos ultimos 3 meses"
- "Orcamento"

Keep responses short (WhatsApp style), friendly, and ALWAYS in Brazilian Portuguese (pt-BR)."""

    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=last_message)
    ])

    return {"messages": [AIMessage(content=response.content)]}


def file_type_confirmation_node(state: AgentState) -> Dict[str, Any]:
    """Processa a resposta do usuário sobre o tipo de arquivo enviado."""
    last_message = state["messages"][-1].content.lower()
    pending_type = state.get("pending_file_type")

    # Palavras-chave para identificar o tipo escolhido pelo usuário
    extrato_keywords = ["extrato", "banco", "fatura", "cartão", "conta", "lançamentos", "2"]
    nota_keywords = ["nota", "recibo", "cupom", "comprovante", "despesa", "receita", "1"]

    is_extrato = any(kw in last_message for kw in extrato_keywords)
    is_nota = any(kw in last_message for kw in nota_keywords)

    if is_extrato:
        # Recupera o arquivo pendente e processa como extrato
        return {
            "intent": "statement",
            "file_bytes": state.get("pending_file_bytes"),
            "file_type": pending_type,
            "awaiting_file_type": False,
            "pending_file_bytes": None,
            "pending_file_type": None,
        }
    elif is_nota:
        # Recupera o arquivo pendente e processa como nota fiscal / PDF
        return {
            "intent": "pdf",
            "file_bytes": state.get("pending_file_bytes"),
            "file_type": pending_type,
            "awaiting_file_type": False,
            "pending_file_bytes": None,
            "pending_file_type": None,
        }
    else:
        # Não entendeu — pede novamente
        return {
            "messages": [AIMessage(content=(
                "Não entendi bem. Esse arquivo é:\n\n"
                "1️⃣ *Nota fiscal / Recibo / Comprovante* (despesa ou receita)\n"
                "2️⃣ *Extrato bancário / Fatura* (vários lançamentos)\n\n"
                "Responda com *1* ou *2* para eu saber como processar."
            ))],
            "awaiting_file_type": True,
        }
