import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PdfInvoice {
  invoiceNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone?: string;
  items: { name: string; unit?: string; quantity: number; unitPrice: number; subtotal: number }[];
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
}

export interface PdfShop {
  shopName?: string;
  ownerName?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string | null;
}

type RGB = [number, number, number];
const ACCENT: RGB = [217, 74, 23]; // brand rust-orange
const INK: RGB = [30, 27, 24];
const MUTED: RGB = [110, 104, 97];
const LINE: RGB = [160, 154, 147];

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function below1000(n: number): string {
  const parts: string[] = [];
  if (n >= 100) { parts.push(`${ONES[Math.floor(n / 100)]} Hundred`); n %= 100; }
  if (n >= 20) { parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '')); }
  else if (n > 0) parts.push(ONES[n]);
  return parts.join(' ');
}

/** South-Asian grouping: thousand, lakh, crore. */
export function rupeesInWords(amount: number): string {
  let n = Math.round(amount);
  if (n === 0) return 'Zero Rupees Only';
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) parts.push(`${below1000(crore)} Crore`);
  if (lakh) parts.push(`${below1000(lakh)} Lakh`);
  if (thousand) parts.push(`${below1000(thousand)} Thousand`);
  if (n) parts.push(below1000(n));
  return `${parts.join(' ')} Rupees Only`;
}

const money = (v: number) => `Rs. ${Math.round(v).toLocaleString('en-PK')}`;

async function loadImage(url: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    // Re-encode through a canvas so any format (webp, svg...) becomes PNG for jsPDF.
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 200;
    canvas.height = img.naturalHeight || 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    return { data: canvas.toDataURL('image/png'), w: canvas.width, h: canvas.height };
  } catch {
    return null; // e.g. CORS-blocked logo: the PDF is still produced, just without it
  }
}

export async function generateInvoicePdf(invoice: PdfInvoice, shop: PdfShop): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const right = W - M;
  const center = { align: 'center' as const };

  // ---------- Header: logo + shop details ----------
  let textLeft = M;
  const logo = shop.logoUrl ? await loadImage(shop.logoUrl) : null;
  if (logo) {
    const box = 64;
    const scale = Math.min(box / logo.w, box / logo.h);
    const lw = logo.w * scale;
    const lh = logo.h * scale;
    doc.addImage(logo.data, 'PNG', M, 34 + (box - lh) / 2, lw, lh);
    textLeft = M + box + 16;
  }
  const centerX = logo ? textLeft + (right - textLeft) / 2 : W / 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...ACCENT);
  doc.text(shop.shopName || 'Your Shop', centerX, 56, center);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  let y = 74;
  if (shop.address) {
    const lines = doc.splitTextToSize(shop.address, right - textLeft - 20) as string[];
    doc.text(lines, centerX, y, center);
    y += lines.length * 13;
  }
  const contact = [shop.phone && `Phone: ${shop.phone}`, shop.email].filter(Boolean).join('   |   ');
  if (contact) { doc.text(contact, centerX, y, center); y += 13; }
  if (shop.ownerName) {
    doc.setTextColor(...MUTED);
    doc.text(`Proprietor: ${shop.ownerName}`, centerX, y, center);
    y += 13;
  }

  y = Math.max(y, 112) + 6;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(2);
  doc.line(M, y, right, y);

  // ---------- Invoice title row ----------
  y += 24;
  doc.setTextColor(...INK);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Invoice No.:', M, y);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.invoiceNumber, M + 62, y);

  doc.setFontSize(16);
  doc.setTextColor(...ACCENT);
  doc.text('INVOICE', W / 2, y + 1, center);

  doc.setFontSize(10);
  doc.setTextColor(...INK);
  const d = new Date(invoice.createdAt);
  const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  doc.setFont('helvetica', 'normal');
  doc.text('Date:', right - 150, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`${dateStr}, ${timeStr}`, right, y, { align: 'right' });

  // ---------- Customer box ----------
  y += 14;
  const boxH = 44;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.8);
  doc.rect(M, y, right - M, boxH);
  doc.line(M, y + boxH / 2, right, y + boxH / 2);
  doc.line(M + 80, y, M + 80, y + boxH);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text('Name', M + 70, y + 15, { align: 'right' });
  doc.text('Phone', M + 70, y + boxH / 2 + 15, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...INK);
  doc.text(invoice.customerName, M + 92, y + 15);
  doc.text(invoice.customerPhone || '-', M + 92, y + boxH / 2 + 15);

  // ---------- Items table ----------
  const tableTop = y + boxH + 14;
  const footerReserve = 212; // totals, words, terms, signature, band
  const tableBottom = H - footerReserve;

  autoTable(doc, {
    startY: tableTop,
    margin: { left: M, right: M, bottom: footerReserve },
    head: [['Sl.No', 'Description', 'Qty', 'Rate', 'Amount']],
    body: invoice.items.map((it, i) => [
      String(i + 1),
      it.unit ? `${it.name} (${it.unit})` : it.name,
      String(it.quantity),
      money(it.unitPrice),
      money(it.subtotal),
    ]),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 10, textColor: INK, lineColor: LINE, lineWidth: 0.8, cellPadding: 6 },
    headStyles: { fillColor: [255, 255, 255], textColor: INK, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 44, halign: 'center' },
      2: { cellWidth: 50, halign: 'center' },
      3: { cellWidth: 80, halign: 'right' },
      4: { cellWidth: 90, halign: 'right' },
    },
  });

  // Extend the column rules down to the totals row, like a printed invoice pad.
  const endY: number = (doc as any).lastAutoTable.finalY;
  doc.setPage(doc.getNumberOfPages());
  const bodyBottom = Math.max(endY, tableBottom);
  const colX = [M, M + 44, right - 220, right - 170, right - 90, right];
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.8);
  colX.forEach((x) => doc.line(x, endY, x, bodyBottom));
  doc.line(M, bodyBottom, right, bodyBottom);

  // ---------- Totals ----------
  let ty = bodyBottom;
  const rowH = 20;
  const totalsRow = (label: string, value: string, bold = false) => {
    doc.rect(right - 170, ty, 170, rowH);
    doc.line(right - 90, ty, right - 90, ty + rowH);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(label, right - 96, ty + 14, { align: 'right' });
    doc.text(value, right - 6, ty + 14, { align: 'right' });
    ty += rowH;
  };
  const subtotal = invoice.items.reduce((s, i) => s + i.subtotal, 0);
  totalsRow('Subtotal', money(subtotal));
  if (invoice.discountAmount > 0) totalsRow('Discount', `- ${money(invoice.discountAmount)}`);
  if (invoice.taxAmount > 0) totalsRow('Tax', money(invoice.taxAmount));
  totalsRow('Total', money(invoice.totalAmount), true);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text('Payment method:', M, bodyBottom + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...INK);
  doc.text(invoice.paymentMethod.toUpperCase(), M + 82, bodyBottom + 14);

  // ---------- Words, terms, signature ----------
  ty += 12;
  doc.setDrawColor(...LINE);
  doc.line(M, ty + 16, right, ty + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...INK);
  doc.text('Rupees in words:', M, ty + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(rupeesInWords(invoice.totalAmount), M + 86, ty + 12);

  ty += 36;
  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions:', M, ty);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.setFontSize(9);
  [
    'Tinted / mixed paint cannot be returned or exchanged.',
    'Please check colour and quantity before leaving the shop.',
    'Thank you for your business.',
  ].forEach((t, i) => doc.text(`•  ${t}`, M + 4, ty + 14 + i * 12));

  doc.setDrawColor(...INK);
  doc.setLineWidth(0.6);
  doc.line(right - 140, ty + 34, right, ty + 34);
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text('Signature', right - 70, ty + 47, center);

  // ---------- Footer band ----------
  doc.setFillColor(...ACCENT);
  doc.rect(0, H - 22, W, 22, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Generated with Paintly', W / 2, H - 8, center);

  doc.save(`${invoice.invoiceNumber}.pdf`);
}
