"""Statement parser agent — detects and parses bank statement formats.

Supports Nubank CSV, generic Brazilian CSV, OFX, and PDF text extraction.
Pure logic — no database access needed.
"""

import base64
import csv
import io
import logging
import re
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)

# Categorização heurística baseada em palavras-chave do extrato
CATEGORY_MAP = {
    "uber": "Transporte",
    "99": "Transporte",
    "taxi": "Transporte",
    "combustivel": "Transporte",
    "gasolina": "Transporte",
    "posto": "Transporte",
    "estacionamento": "Transporte",
    "mercado": "Alimentação",
    "supermercado": "Alimentação",
    "sup": "Alimentação",
    "padaria": "Alimentação",
    "restaurante": "Alimentação",
    "lanche": "Alimentação",
    "ifood": "Alimentação",
    "rappi": "Alimentação",
    "uber eats": "Alimentação",
    "farmacia": "Saúde",
    "droga": "Saúde",
    "remedio": "Saúde",
    "consulta": "Saúde",
    "medico": "Saúde",
    "plano de saude": "Saúde",
    "netflix": "Entretenimento",
    "spotify": "Entretenimento",
    "prime video": "Entretenimento",
    "disney": "Entretenimento",
    "cinema": "Entretenimento",
    "jogo": "Entretenimento",
    "steam": "Entretenimento",
    "luz": "Moradia",
    "energia": "Moradia",
    "eletrica": "Moradia",
    "agua": "Moradia",
    "sabesp": "Moradia",
    "gas": "Moradia",
    "internet": "Moradia",
    "telefone": "Moradia",
    "aluguel": "Moradia",
    "condominio": "Moradia",
    "escola": "Educação",
    "curso": "Educação",
    "faculdade": "Educação",
    "universidade": "Educação",
    "udemy": "Educação",
    "coursera": "Educação",
    "seguro": "Seguros",
    "pix": "Transferência",
    "transferencia": "Transferência",
    "ted": "Transferência",
    "doc": "Transferência",
    "saque": "Saque",
    "rendimento": "Investimentos",
    "rdb": "Investimentos",
    "aplicacao": "Investimentos",
    "salario": "Renda",
    "pagamento": "Renda",
    "recebido": "Renda",
    "inss": "Renda",
}


def _guess_category(description: str) -> str:
    """Tenta inferir a categoria a partir da descrição da transação."""
    desc_lower = description.lower()
    for keyword, category in CATEGORY_MAP.items():
        if keyword in desc_lower:
            return category
    return "Outros"


def _parse_brazilian_date(date_str: str) -> str | None:
    """Converte datas brasileiras (DD/MM/YYYY) para ISO (YYYY-MM-DD)."""
    try:
        dt = datetime.strptime(date_str.strip(), "%d/%m/%Y")
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        try:
            dt = datetime.strptime(date_str.strip(), "%Y-%m-%d")
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            return None


def _parse_brazilian_value(value_str: str) -> float | None:
    """Converte valores brasileiros (1.234,56 ou 1234,56) para float."""
    if not value_str or not value_str.strip():
        return None
    try:
        # Remove espaços e troca separadores
        val = value_str.strip().replace(" ", "")
        # Se tem ponto e vírgula: 1.234,56 -> remove ponto, troca vírgula
        if "," in val:
            val = val.replace(".", "").replace(",", ".")
        return float(val)
    except ValueError:
        return None


def _is_statement_csv(content: str) -> bool:
    """Heurística para detectar se um CSV é extrato bancário."""
    content_lower = content.lower()
    keywords = ["data", "valor", "descrição", "saldo", "débito", "crédito", "histórico", "extrato"]
    return sum(1 for k in keywords if k in content_lower) >= 3


def _is_statement_ofx(content: str) -> bool:
    """Heurística para detectar OFX."""
    return "<ofx>" in content.lower() or "<stmttrn>" in content.lower()


def _is_statement_text(content: str) -> bool:
    """Heurística para detectar extrato em texto puro (após extração de PDF)."""
    lines = content.strip().split("\n")
    date_patterns = 0
    value_patterns = 0
    for line in lines[:30]:
        if re.search(r"\d{2}/\d{2}/\d{4}", line):
            date_patterns += 1
        if re.search(r"[\d\.,]+\s*(?:R\$|BRL)?", line):
            value_patterns += 1
    return date_patterns >= 5 and value_patterns >= 5


def parse_nubank_csv(content: str) -> list[dict[str, Any]]:
    """Parse de CSV do Nubank: Data,Valor,Identificador,Descrição."""
    transactions = []
    reader = csv.DictReader(io.StringIO(content))
    for row in reader:
        try:
            date_str = row.get("Data", "").strip()
            value_str = row.get("Valor", "").strip()
            desc = row.get("Descrição", "").strip()
            if not date_str or not value_str:
                continue
            date = _parse_brazilian_date(date_str)
            amount = _parse_brazilian_value(value_str)
            if date is None or amount is None:
                continue
            tx_type = "INCOME" if amount > 0 else "EXPENSE"
            transactions.append(
                {
                    "date": date,
                    "amount": abs(amount),
                    "type": tx_type,
                    "description": desc,
                    "category": _guess_category(desc),
                    "raw": f"{date_str} | {value_str} | {desc}",
                }
            )
        except Exception as e:
            logger.warning(f"Erro ao parsear linha Nubank: {e}")
            continue
    return transactions


def _preprocess_csv(content: str) -> str:
    """Limpa CSVs malformados (ex: linha de título antes do header)."""
    lines = content.strip().split("\n")
    if not lines:
        return content
    # Se a primeira linha não parece um header válido (não contém 'Data'),
    # remove-a e usa a próxima como header
    first_line_lower = lines[0].lower()
    if "data" not in first_line_lower and len(lines) > 1:
        # Verifica se a segunda linha é um header válido
        second_line_lower = lines[1].lower()
        if "data" in second_line_lower:
            lines = lines[1:]
    return "\n".join(lines)


def parse_generic_csv(content: str) -> list[dict[str, Any]]:
    """Parse de CSV genérico de banco brasileiro.

    Tenta detectar colunas comuns: Data/Histórico/Docto./Crédito/Débito/Saldo
    """
    transactions = []
    content = _preprocess_csv(content)
    # Detecta delimitador
    first_lines = "\n".join(content.strip().split("\n")[:5])
    delimiter = ";" if ";" in first_lines else ","
    reader = csv.DictReader(io.StringIO(content), delimiter=delimiter)
    for row in reader:
        try:
            # Tenta mapear colunas comuns (com variações de case e acentos)
            date_str = ""
            desc = ""
            credit = ""
            debit = ""
            for k, v in row.items():
                if not k:
                    continue
                k_lower = k.lower().strip()
                v_stripped = v.strip() if v else ""
                if "data" in k_lower and not date_str:
                    date_str = v_stripped
                elif (
                    any(x in k_lower for x in ["histórico", "historico", "descrição", "descricao"])
                    and not desc
                ):
                    desc = v_stripped
                elif any(x in k_lower for x in ["crédito", "credito", "entrada"]) and not credit:
                    credit = v_stripped
                elif (
                    any(x in k_lower for x in ["débito", "debito", "saída", "saida"]) and not debit
                ):
                    debit = v_stripped

            # Validações básicas
            if not date_str:
                continue
            date = _parse_brazilian_date(date_str)
            if date is None:
                continue
            # Evita linhas de metadados
            if not desc or any(
                x in desc.lower() for x in ["filtro", "resultados", "últimos", "ultimos"]
            ):
                continue
            # Deve ter pelo menos um valor em crédito ou débito
            if not (credit and credit.strip()) and not (debit and debit.strip()):
                continue

            amount = None
            tx_type = "EXPENSE"
            if credit and credit.strip():
                amount = _parse_brazilian_value(credit)
                if amount and amount > 0:
                    tx_type = "INCOME"
            if amount is None and debit and debit.strip():
                amount = _parse_brazilian_value(debit)
                if amount and amount > 0:
                    tx_type = "EXPENSE"
            if amount is None or amount <= 0:
                continue
            transactions.append(
                {
                    "date": date,
                    "amount": amount,
                    "type": tx_type,
                    "description": desc or "Transação bancária",
                    "category": _guess_category(desc),
                    "raw": f"{date_str} | {desc} | {credit or debit}",
                }
            )
        except Exception as e:
            logger.warning(f"Erro ao parsear linha genérica: {e}")
            continue
    return transactions


def parse_ofx(content: str) -> list[dict[str, Any]]:
    """Parse de OFX usando regex (evita dependência de bibliotecas pesadas).

    Extrai transações <STMTTRN>... </STMTTRN>
    """
    transactions = []
    # Encontra todos os blocos STMTTRN
    stmt_blocks = re.findall(r"<STMTTRN>(.*?)</STMTTRN>", content, re.DOTALL | re.IGNORECASE)
    for block in stmt_blocks:
        try:
            trntype = re.search(r"<TRNTYPE>(.*?)(?:<|$)", block, re.IGNORECASE)
            dtposted = re.search(r"<DTPOSTED>(\d{8})", block, re.IGNORECASE)
            trnamt = re.search(r"<TRNAMT>(.*?)(?:<|$)", block, re.IGNORECASE)
            memo = re.search(r"<MEMO>(.*?)(?:<|$)", block, re.IGNORECASE)
            fitid = re.search(r"<FITID>(.*?)(?:<|$)", block, re.IGNORECASE)
            if not dtposted or not trnamt:
                continue
            date_str = dtposted.group(1)
            date = datetime.strptime(date_str, "%Y%m%d").strftime("%Y-%m-%d")
            amount = float(trnamt.group(1).strip())
            desc = (
                memo.group(1).strip()
                if memo
                else (fitid.group(1).strip() if fitid else "Transação OFX")
            )
            trn_type = trntype.group(1).strip().upper() if trntype else ""
            if trn_type == "CREDIT" or trn_type == "DEP":
                tx_type = "INCOME"
            elif trn_type == "DEBIT" or trn_type == "XFER" or trn_type == "PAYMENT":
                tx_type = "EXPENSE" if amount < 0 else "INCOME"
            else:
                tx_type = "INCOME" if amount > 0 else "EXPENSE"
            transactions.append(
                {
                    "date": date,
                    "amount": abs(amount),
                    "type": tx_type,
                    "description": desc,
                    "category": _guess_category(desc),
                    "raw": f"{date} | {amount} | {desc}",
                }
            )
        except Exception as e:
            logger.warning(f"Erro ao parsear bloco OFX: {e}")
            continue
    return transactions


def parse_pdf_statement(content: str) -> list[dict[str, Any]]:
    """Tenta extrair transações de texto de PDF de extrato.

    Heurística: procura por linhas com data + valor + descrição.
    """
    transactions = []
    lines = content.split("\n")
    for line in lines:
        line = line.strip()
        if not line:
            continue
        match = re.search(r"(\d{2}/\d{2}/\d{4})\s+(.+?)(?:\s+([\d\.,]+)\s*(?:R\$)?)?\s*$", line)
        if match:
            try:
                date_str = match.group(1)
                rest = match.group(2).strip()
                value_str = match.group(3)
                date = _parse_brazilian_date(date_str)
                if date is None:
                    continue
                if not value_str:
                    val_match = re.search(r"([\d\.,]+)\s*(?:R\$|BRL)?", rest)
                    if val_match:
                        value_str = val_match.group(1)
                if not value_str:
                    continue
                amount = _parse_brazilian_value(value_str)
                if amount is None:
                    continue
                desc = re.sub(r"[\d\.,]+\s*(?:R\$|BRL)?", "", rest).strip()
                desc = re.sub(r"\s+", " ", desc)
                if not desc:
                    desc = "Transação bancária"
                tx_type = "INCOME" if amount > 0 else "EXPENSE"
                transactions.append(
                    {
                        "date": date,
                        "amount": abs(amount),
                        "type": tx_type,
                        "description": desc,
                        "category": _guess_category(desc),
                        "raw": line,
                    }
                )
            except Exception as e:
                logger.warning(f"Erro ao parsear linha PDF: {e}")
                continue
    return transactions


def parse_statement(media: dict[str, Any]) -> list[dict[str, Any]]:
    """Detecta o formato do extrato e faz parse.

    Args:
        media: dict com 'mimetype' e 'data' (base64)

    Returns:
        Lista de transações extraídas
    """
    mimetype = media.get("mimetype", "")
    data = media.get("data", "")
    if not data:
        return []

    content = ""
    try:
        decoded = base64.b64decode(data)
        if mimetype == "application/pdf":
            # Extrai texto do PDF
            try:
                import PyPDF2

                reader = PyPDF2.PdfReader(io.BytesIO(decoded))
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        content += page_text + "\n"
            except ImportError:
                logger.error("PyPDF2 não instalado")
                return []
        else:
            content = decoded.decode("utf-8", errors="replace")
    except Exception as e:
        logger.error(f"Erro ao decodificar mídia: {e}")
        return []

    if not content.strip():
        return []

    logger.info(f"Parseando extrato. Tipo: {mimetype}, tamanho: {len(content)} chars")

    # Detecta formato e faz parse
    transactions = []
    if _is_statement_ofx(content):
        transactions = parse_ofx(content)
        logger.info(f"OFX parseado: {len(transactions)} transações")
    elif _is_statement_csv(content):
        # Tenta Nubank primeiro
        if "Identificador" in content and "Descrição" in content:
            transactions = parse_nubank_csv(content)
            logger.info(f"CSV Nubank parseado: {len(transactions)} transações")
        else:
            transactions = parse_generic_csv(content)
            logger.info(f"CSV genérico parseado: {len(transactions)} transações")
    elif mimetype == "application/pdf" or _is_statement_text(content):
        transactions = parse_pdf_statement(content)
        logger.info(f"PDF/texto parseado: {len(transactions)} transações")
    else:
        logger.info("Conteúdo não reconhecido como extrato bancário")
        return []

    # Filtra duplicatas por raw
    seen = set()
    unique = []
    for tx in transactions:
        key = tx.get("raw", "")
        if key and key not in seen:
            seen.add(key)
            unique.append(tx)
    return unique


def detect_statement(state: dict[str, Any]) -> bool:
    """Detecta se o estado atual contém um extrato bancário.

    Primeiro faz checagem rápida (mimetype + filename), sem parse completo.
    Se falhar, faz parse completo como fallback.
    """
    source_format = state.get("source_format", "text")
    if source_format not in ["document", "text"]:
        return False
    media = state.get("context", {}).get("media")
    if not media:
        return False

    # Checagem rápida por mimetype / filename
    mimetype = media.get("mimetype", "")
    filename = (media.get("filename") or "").lower()
    if mimetype in ("text/csv", "application/csv", "text/plain", "application/ofx", "text/ofx"):
        return True
    if filename.endswith((".csv", ".ofx", ".qfx")):
        return True
    if filename.endswith(".pdf"):
        keywords_in_name = [
            "extrato",
            "fatura",
            "movimento",
            "conta",
            "banco",
            "nubank",
            "itau",
            "bradesco",
            "caixa",
            "santander",
        ]
        if any(k in filename for k in keywords_in_name):
            return True

    # Fallback: parse completo (para detecção de conteúdo)
    transactions = parse_statement(media)
    return len(transactions) >= 3
