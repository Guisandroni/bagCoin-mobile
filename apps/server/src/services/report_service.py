from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import io
from datetime import datetime
from typing import List, Any

def generate_financial_report(user_name: str, transactions: List[Any]) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    normal_style = styles['Normal']
    
    elements.append(Paragraph(f"Relatório Financeiro - {user_name}", title_style))
    elements.append(Paragraph(f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}", normal_style))
    elements.append(Spacer(1, 20))
    
    total_spent = sum(t.amount for t in transactions if t.amount > 0)
    elements.append(Paragraph(f"Total Registrado no Período: R$ {total_spent:.2f}", styles['Heading2']))
    elements.append(Spacer(1, 10))
    
    data = [["Data", "Descrição", "Categoria", "Valor"]]
    for t in transactions:
        data.append([
            t.transaction_date.strftime("%d/%m/%Y"),
            t.description,
            t.category,
            f"R$ {t.amount:.2f}"
        ])
    
    table = Table(data, colWidths=[80, 200, 100, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(table)
    
    doc.build(elements)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
