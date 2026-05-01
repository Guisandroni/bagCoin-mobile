"""PDF Generator service — generates financial report PDFs using ReportLab.

Creates professional PDF reports with summary, category breakdown, and transactions.
"""
import os
import logging
from datetime import datetime
from typing import Any

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

logger = logging.getLogger(__name__)

REPORTS_DIR = "/app/reports"
os.makedirs(REPORTS_DIR, exist_ok=True)


def generate_financial_report(
    user_name: str,
    period_start: str,
    period_end: str,
    transactions: list[dict[str, Any]],
    categories_summary: list[dict[str, Any]],
    total_income: float,
    total_expense: float,
    budget_info: dict[str, Any] | None = None,
    goals_info: list[dict[str, Any]] | None = None,
) -> str:
    """Gera relatório PDF financeiro.

    Returns:
        Caminho absoluto do arquivo PDF gerado.
    """
    filename = f"report_{user_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = os.path.join(REPORTS_DIR, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a1a2e'),
        spaceAfter=30,
        alignment=TA_CENTER,
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#16213e'),
        spaceAfter=12,
        spaceBefore=12,
    )

    story = []

    # Título
    story.append(Paragraph("💰 BagCoin - Relatório Financeiro", title_style))
    story.append(Spacer(1, 0.5*cm))

    # Período
    story.append(Paragraph(f"<b>Período:</b> {period_start} a {period_end}", styles['Normal']))
    story.append(Paragraph(f"<b>Gerado em:</b> {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
    story.append(Spacer(1, 1*cm))

    # Resumo
    story.append(Paragraph("📊 Resumo Financeiro", heading_style))

    summary_data = [
        ['Métrica', 'Valor'],
        ['Total de Receitas', f'R$ {total_income:,.2f}'],
        ['Total de Despesas', f'R$ {total_expense:,.2f}'],
        ['Saldo', f'R$ {(total_income - total_expense):,.2f}'],
    ]

    if budget_info:
        summary_data.append(['Orçamento Definido', f'R$ {budget_info.get("limit", 0):,.2f}'])
        summary_data.append(['Consumo do Orçamento', f'R$ {budget_info.get("spent", 0):,.2f}'])

    summary_table = Table(summary_data, colWidths=[8*cm, 8*cm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#16213e')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f0f0f0')),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 1*cm))

    # Despesas por categoria
    if categories_summary:
        story.append(Paragraph("📈 Despesas por Categoria", heading_style))
        cat_data = [['Categoria', 'Total', '% do Total']]
        for cat in categories_summary:
            pct = (cat['total'] / total_expense * 100) if total_expense > 0 else 0
            cat_data.append([
                cat['name'],
                f"R$ {cat['total']:,.2f}",
                f"{pct:.1f}%"
            ])

        cat_table = Table(cat_data, colWidths=[8*cm, 4*cm, 4*cm])
        cat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f3460')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8f8f8')),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ]))
        story.append(cat_table)
        story.append(Spacer(1, 1*cm))

    # Transações detalhadas
    if transactions:
        story.append(PageBreak())
        story.append(Paragraph("📝 Transações Detalhadas", heading_style))

        tx_data = [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor']]
        for tx in transactions:
            tx_data.append([
                tx.get('date', 'N/A'),
                tx.get('type', 'N/A').upper(),
                tx.get('category', 'N/A'),
                tx.get('description', '-')[:30],
                f"R$ {tx.get('amount', 0):,.2f}"
            ])

        tx_table = Table(tx_data, colWidths=[3*cm, 2.5*cm, 3*cm, 5.5*cm, 3*cm])
        tx_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a2e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TOPPADDING', (0, 1), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(tx_table)

    # Metas
    if goals_info:
        story.append(Spacer(1, 1*cm))
        story.append(Paragraph("🎯 Metas Financeiras", heading_style))
        for goal in goals_info:
            progress = (goal.get('current', 0) / goal.get('target', 1) * 100) if goal.get('target', 0) > 0 else 0
            story.append(Paragraph(
                f"• <b>{goal.get('title')}</b>: R$ {goal.get('current', 0):,.2f} / R$ {goal.get('target', 0):,.2f} ({progress:.1f}%)",
                styles['Normal']
            ))

    # Rodapé
    story.append(Spacer(1, 2*cm))
    story.append(Paragraph(
        "<i>Este relatório foi gerado automaticamente pelo BagCoin. "
        "As informações são baseadas nos dados registrados no sistema.</i>",
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey, alignment=TA_CENTER)
    ))

    doc.build(story)
    logger.info(f"Relatório PDF gerado: {filepath}")

    return filepath
