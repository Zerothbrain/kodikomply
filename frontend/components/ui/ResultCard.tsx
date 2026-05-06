'use client';
import { formatTZS } from '../../lib/format';
import { CheckCircle, XCircle, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BreakdownItem {
  description: string;
  amount: number;
  taxable?: boolean;
  reason?: string;
  notes?: string;
}

interface ResultCardProps {
  title: string;
  summaryItems: Array<{ label: string; value: number | string; highlight?: boolean }>;
  breakdown?: BreakdownItem[];
  explanation?: string;
  calculationType: string;
}

export default function ResultCard({ title, summaryItems, breakdown, explanation, calculationType }: ResultCardProps) {
  function downloadPDF() {
    const doc = new jsPDF();
    const green: [number, number, number] = [26, 92, 56];

    doc.setFillColor(...green);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('KodiComply Tax Report', 14, 15);
    doc.setFontSize(10);
    doc.text(title, 14, 24);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-TZ', { dateStyle: 'long' })}`, 14, 30);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.text('Summary', 14, 48);

    autoTable(doc, {
      startY: 52,
      head: [['Item', 'Amount']],
      body: summaryItems.map(i => [i.label, typeof i.value === 'number' ? formatTZS(i.value) : String(i.value)]),
      headStyles: { fillColor: green },
      alternateRowStyles: { fillColor: [240, 247, 243] },
    });

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

    if (breakdown && breakdown.length > 0) {
      doc.setFontSize(13);
      doc.text('Detailed Breakdown', 14, finalY + 12);
      autoTable(doc, {
        startY: finalY + 16,
        head: [['Description', 'Amount (TZS)', 'Status']],
        body: breakdown.map(b => [
          b.description,
          Math.round(b.amount).toLocaleString(),
          b.taxable !== undefined ? (b.taxable ? 'Taxable' : 'Exempt') : '',
        ]),
        headStyles: { fillColor: green },
        alternateRowStyles: { fillColor: [240, 247, 243] },
        columnStyles: { 1: { halign: 'right' } },
      });
    }

    if (explanation) {
      const lastY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? finalY;
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const lines = doc.splitTextToSize(`Note: ${explanation}`, 180);
      doc.text(lines, 14, lastY + 12);
    }

    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text('KodiComply • Tanzania Tax Compliance Platform • For informational purposes only', 14, 285);

    doc.save(`kodicomply-${calculationType}-report.pdf`);
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-brand-700">{title}</h3>
          <button onClick={downloadPDF} className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium">
            <Download size={16} />Download PDF
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {summaryItems.map((item, i) => (
            <div key={i} className={`p-4 rounded-lg ${item.highlight ? 'bg-brand-600 text-white' : 'bg-brand-50'}`}>
              <p className={`text-xs font-medium mb-1 ${item.highlight ? 'text-brand-100' : 'text-gray-500'}`}>{item.label}</p>
              <p className={`text-xl font-bold ${item.highlight ? 'text-white' : 'text-brand-700'}`}>
                {typeof item.value === 'number' ? formatTZS(item.value) : item.value}
              </p>
            </div>
          ))}
        </div>

        {explanation && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800">{explanation}</p>
          </div>
        )}
      </div>

      {breakdown && breakdown.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Detailed Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 text-gray-600 font-medium">Item</th>
                  <th className="text-right py-2 pr-4 text-gray-600 font-medium">Amount (TZS)</th>
                  <th className="text-left py-2 text-gray-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-800">{item.description}</p>
                      {(item.reason || item.notes) && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.reason ?? item.notes}</p>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono font-medium">
                      {Math.abs(Math.round(item.amount)).toLocaleString()}
                    </td>
                    <td className="py-3">
                      {item.taxable !== undefined && (
                        item.taxable
                          ? <span className="badge-red flex items-center gap-1 w-fit"><XCircle size={12} />Taxable</span>
                          : <span className="badge-green flex items-center gap-1 w-fit"><CheckCircle size={12} />Exempt</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
