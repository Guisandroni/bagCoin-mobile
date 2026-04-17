import io
import pandas as pd
import pdfplumber
from ofxtools.Parser import OFXTree
from typing import List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class ExtractedTransaction(BaseModel):
    date: str
    description: str
    amount: float
    category: str = "Outros"

def parse_csv_statement(file_bytes: bytes) -> str:
    try:
        try:
            content = file_bytes.decode('utf-8')
        except UnicodeDecodeError:
            content = file_bytes.decode('latin-1')
        return content
    except Exception as e:
        print(f"Error reading CSV bytes: {e}")
        return ""

def parse_pdf_statement(file_bytes: bytes) -> str:
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
    except Exception as e:
        print(f"Error reading PDF: {e}")
    return text

def parse_ofx_statement(file_bytes: bytes) -> List[Dict[str, Any]]:
    try:
        parser = OFXTree()
        parser.parse(io.BytesIO(file_bytes))
        ofx = parser.convert()
        
        transactions = []
        for stmt in ofx.statements:
            for txn in stmt.banktranlist:
                transactions.append({
                    "date": str(txn.dtposted),
                    "description": txn.memo or txn.name,
                    "amount": float(txn.trnamt)
                })
        return transactions
    except Exception as e:
        print(f"Error reading OFX: {e}")
        return []
