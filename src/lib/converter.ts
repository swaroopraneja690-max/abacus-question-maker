import html2canvas from 'html2canvas';
import mammoth from 'mammoth';
import autoTable from 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export type ConvertibleFile = {
  file: File;
  id: string;
  status: 'pending' | 'done' | 'error';
  message?: string;
};

function isWord(file: File): boolean {
  return /\.docx$/i.test(file.name);
}

function isExcel(file: File): boolean {
  return /\.(xlsx|xls|csv)$/i.test(file.name);
}

export function isSupported(file: File): boolean {
  return isWord(file) || isExcel(file);
}

/** Renders a .docx into an image-based PDF, page by page. */
export async function wordToPdf(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });

  const holder = document.createElement('div');
  holder.style.cssText = [
    'position:fixed',
    'left:-20000px',
    'top:0',
    'width:794px',
    'box-sizing:border-box',
    'padding:56px 64px',
    'background:#ffffff',
    'color:#000000',
    'font-family:Calibri, Arial, sans-serif',
    'font-size:14px',
    'line-height:1.55',
    'white-space:normal',
  ].join(';');
  holder.innerHTML = result.value;
  document.body.appendChild(holder);

  try {
    const canvas = await html2canvas(holder, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const renderedW = pageW;
    const scale = renderedW / canvas.width;
    const renderedH = canvas.height * scale;

    let offsetY = 0;
    let pageIndex = 0;
    const sliceHeightPx = Math.floor(pageH / scale);

    while (offsetY < canvas.height) {
      if (pageIndex > 0) pdf.addPage();

      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = Math.min(sliceHeightPx, canvas.height - offsetY);
      const ctx = slice.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(
          canvas,
          0,
          offsetY,
          canvas.width,
          slice.height,
          0,
          0,
          canvas.width,
          slice.height,
        );
      }

      pdf.addImage(
        slice.toDataURL('image/jpeg', 0.95),
        'JPEG',
        0,
        0,
        renderedW,
        slice.height * scale,
      );

      offsetY += slice.height;
      pageIndex += 1;
    }

    return pdf.output('blob');
  } finally {
    document.body.removeChild(holder);
  }
}

/** Reads an Excel workbook and renders each sheet as a table PDF. */
export async function excelToPdf(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();

  workbook.SheetNames.forEach((sheetName, sheetIndex) => {
    if (sheetIndex > 0) pdf.addPage();

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(sheetName, 28, 30);

    if (rows.length === 0) return;

    autoTable(pdf, {
      body: rows.map((row) => row.map((cell) => String(cell ?? ''))),
      startY: 40,
      margin: { left: 28, right: 28, bottom: 28 },
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
      tableWidth: pageW - 56,
    });
  });

  return pdf.output('blob');
}

export async function convertFile(file: File): Promise<Blob> {
  if (isWord(file)) return wordToPdf(file);
  if (isExcel(file)) return excelToPdf(file);
  throw new Error('Only Word (.docx) and Excel (.xlsx/.xls/.csv) files are supported.');
}
