from fastapi import APIRouter, Depends, HTTPException, Response
from app.database import SessionLocal
from app.routers.user_router import get_current_user
from app.models.auction import Auction
from app.models.user import User
from app.models.bid import Bid
from app.models.product import Product
from app.models.company import Company
from sqlalchemy.orm import Session

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from io import BytesIO
import os


# Türkçe font kaydı
font_path = os.path.join("app", "static", "fonts", "DejaVuSans.ttf")
pdfmetrics.registerFont(TTFont("DejaVuSans", font_path))

# Stil ayarları
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="Turkish", fontName="DejaVuSans", fontSize=12, leading=16))
styles.add(ParagraphStyle(name="Header", fontName="DejaVuSans", fontSize=18, leading=22, spaceAfter=12, alignment=1, textColor=colors.darkblue))
styles.add(ParagraphStyle(name="Section", fontName="DejaVuSans", fontSize=14, leading=18, spaceBefore=10, spaceAfter=6, textColor=colors.black, backColor=colors.whitesmoke))

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{auction_id}/report-pdf")
def generate_auction_report_pdf(
    auction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    auction = db.query(Auction).filter(
        Auction.id == auction_id,
        Auction.company_id == current_user.company_id
    ).first()

    if not auction:
        raise HTTPException(status_code=404, detail="İhale bulunamadı")

    bids = db.query(Bid).filter(Bid.auction_id == auction.id).all()
    product = db.query(Product).filter(Product.id == auction.product_id).first()
    winner = db.query(User).filter(User.id == auction.winner_id).first() if auction.winner_id else None
    company =db.query(Company).filter(Company.id==winner.company_id).first()
    highest = max(bids, key=lambda b: b.amount, default=None)
    lowest = min(bids, key=lambda b: b.amount, default=None)
    participants = set(b.supplier_id for b in bids)

    # Kazanan teklif belirle
    winning_bid = None
    if auction.auction_type == "lowest" and lowest:
        winning_bid = lowest.amount
    elif auction.auction_type == "highest" and highest:
        winning_bid = highest.amount

    # PDF oluşturma
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []

    elements.append(Paragraph("İhale Raporu", styles["Header"]))
    elements.append(Spacer(1, 12))

    # Ürün bilgileri
    elements.append(Paragraph("📦 Ürün Bilgileri", styles["Section"]))
    if product:
        elements.append(Paragraph(f"Ürün Adı: {product.name}", styles["Turkish"]))
        elements.append(Paragraph(f"Açıklama: {product.description or 'Yok'}", styles["Turkish"]))
        elements.append(Paragraph(f"Fiyat: {product.price} ₺", styles["Turkish"]))
    else:
        elements.append(Paragraph("Ürün bilgisi bulunamadı.", styles["Turkish"]))

    elements.append(Spacer(1, 10))
    elements.append(Paragraph("📄 İhale Bilgileri", styles["Section"]))
    elements.append(Paragraph(f"İhale ID: {auction.id}", styles["Turkish"]))
    elements.append(Paragraph(f"Başlangıç: {auction.start_time}", styles["Turkish"]))
    elements.append(Paragraph(f"Bitiş: {auction.end_time}", styles["Turkish"]))
    elements.append(Paragraph(f"Toplam Teklif Sayısı: {len(bids)}", styles["Turkish"]))
    elements.append(Paragraph(f"En Yüksek Teklif: {highest.amount if highest else 'Yok'} ₺", styles["Turkish"]))
    elements.append(Paragraph(f"En Düşük Teklif: {lowest.amount if lowest else 'Yok'} ₺", styles["Turkish"]))
    elements.append(Paragraph(f"Görünürlük: {'Açık' if auction.is_public_bids else 'Kapalı'}", styles["Turkish"]))
    elements.append(Paragraph(f"Katılımcı Sayısı: {len(participants)}", styles["Turkish"]))
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("🏆 Kazanan Bilgisi", styles["Section"]))
    if winner:
        elements.append(Paragraph(f"Kazanan Kişi: {winner.name} (Şirket Adı: {company.name})", styles["Turkish"]))
        elements.append(Paragraph(f"Kazanan Teklif: {winning_bid} ₺", styles["Turkish"]))
    else:
        elements.append(Paragraph("Kazanan: Belirlenmemiş", styles["Turkish"]))

    elements.append(Spacer(1, 12))
    elements.append(Paragraph("💼 Teklif Listesi", styles["Section"]))
    
    data = [["Tedarikçi ID", "Teklif Tutarı (₺)", "Zaman"]]
    for bid in bids:
        data.append([str(bid.supplier_id), f"{bid.amount} ₺", bid.timestamp.strftime("%Y-%m-%d %H:%M")])

    table = Table(data, hAlign='LEFT')
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightblue),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
        ("FONTNAME", (0, 0), (-1, -1), "DejaVuSans"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("BACKGROUND", (0, 1), (-1, -1), colors.whitesmoke),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ]))

    elements.append(table)

    doc.build(elements)

    pdf_data = buffer.getvalue()
    buffer.close()

    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=ihale_{auction_id}_raporu.pdf"}
    )
