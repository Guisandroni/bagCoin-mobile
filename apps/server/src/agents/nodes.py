import json
import base64
import io
import re
from datetime import date, datetime
from typing import Literal, Dict, Any, List, Optional
import pdfplumber
from groq import Groq
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from sqlmodel import Session, select
from ..database import engine
from ..models import User, Transaction
from .state import AgentState, TransactionExtraction
from .categories import get_category_prompt, CATEGORIES
from ..config import settings
from ..services.report_service import generate_financial_report
from langchain_community.tools.tavily_search import TavilySearchResults
from ..services.statement_service import parse_csv_statement, parse_pdf_statement, parse_ofx_statement
from pydantic import BaseModel

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
    
    user_id_from_state = state.get("user_id")
    if user_id_from_state:
        user = get_active_user(whatsapp_number)
        if user:
            file_type = state.get("file_type")
            
            is_statement = False
            if file_type in ["pdf", "csv", "ofx"]:
                keywords = ["extrato", "lançamentos", "conta", "fatura", "statement", "nubank", "bradesco", "itau", "lista", "relatorio"]
                if any(kw in last_message.lower() for kw in keywords):
                    is_statement = True
                    
            if is_statement:
                return {"intent": "statement", "user_id": user.id}
            
            if file_type == "audio": return {"intent": "audio", "user_id": user.id}
            elif file_type == "image": return {"intent": "image", "user_id": user.id}
            elif file_type == "pdf": return {"intent": "pdf", "user_id": user.id}

            system_prompt = """You are a financial assistant router. 
            Classify the user intent into one of:
            - 'record': User wants to log a new expense or income.
            - 'query': User wants to know their balance, spending history, or financial summary.
            - 'report': User wants a PDF report or complete statement.
            - 'recommendation': User wants financial advice, investment tips, or ways to save money.
            - 'chat': General conversation or unclear intent.
            
            Return ONLY the intent name in lowercase."""
            
            response = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=last_message)
            ])
            
            intent = response.content.strip().lower()
            if intent not in ["record", "query", "report", "recommendation", "chat"]:
                intent = "chat"
                
            return {"intent": intent, "user_id": user.id}
    
    user = get_active_user(whatsapp_number)
    
    if not user:
        if "Activation code:" in last_message or re.search(r"/start\s*([\w-]+)", last_message):
            return {"intent": "auth"}
        else:
            return {"intent": "unauthorized"}

    file_type = state.get("file_type")
    
    is_statement = False
    if file_type in ["pdf", "csv", "ofx"]:
        keywords = ["extrato", "lançamentos", "conta", "fatura", "statement", "nubank", "bradesco", "itau", "lista", "relatorio"]
        if any(kw in last_message.lower() for kw in keywords):
            is_statement = True
            
    if is_statement:
        return {"intent": "statement", "user_id": user.id}
    
    if file_type == "audio": return {"intent": "audio", "user_id": user.id}
    elif file_type == "image": return {"intent": "image", "user_id": user.id}
    elif file_type == "pdf": return {"intent": "pdf", "user_id": user.id}

    system_prompt = """You are a financial assistant router. 
    Classify the user intent into one of:
    - 'record': User wants to log a new expense or income.
    - 'query': User wants to know their balance, spending history, or financial summary.
    - 'report': User wants a PDF report or complete statement.
    - 'recommendation': User wants financial advice, investment tips, or ways to save money.
    - 'chat': General conversation or unclear intent.
    
    Return ONLY the intent name in lowercase."""
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=last_message)
    ])
    
    intent = response.content.strip().lower()
    if intent not in ["record", "query", "report", "recommendation", "chat"]:
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

    structured_llm = llm.with_structured_output(TransactionExtraction)

    category_prompt = get_category_prompt()
    prompt = (
        f"Extract transaction details from the following message. "
        f"Today is {today}. "
        f"\n\n{category_prompt}\n\n"
        f"IMPORTANT: The 'description' should be a short, clean label WITHOUT the amount value. "
        f"For example, if the user says 'gastei 50 no mercado', description must be 'Mercado', not 'Mercado 50'. "
        f"\n\nMessage: {last_message}"
    )

    extracted = structured_llm.invoke(prompt)

    # Normalize category to the allowed list (case-insensitive)
    raw_category = extracted.category.strip()
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

    response = llm.invoke([
        SystemMessage(content="You are a helpful financial assistant. Keep it concise and friendly. ALWAYS respond in Brazilian Portuguese (pt-BR)."),
        HumanMessage(content=last_message)
    ])

    return {"messages": [AIMessage(content=response.content)]}
