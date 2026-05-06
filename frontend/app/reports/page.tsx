'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, Clock } from 'lucide-react';
import Navbar from '../../components/ui/Navbar';
import Footer from '../../components/ui/Footer';
import { isLoggedIn } from '../../lib/auth';
import { formatDate, formatTZS } from '../../lib/format';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Calculation {
  id: number;
  calculationType: string;
  createdAt: string;
  inputData: Record<string, unknown>;
  resultData: Record<string, unknown>;
}

const TYPE_LABELS: Record<string, string> = {
  employment: 'Employment Tax (PAYE)',
  business: 'Business Income Tax',
  vat: 'Value Added Tax',
  withholding: 'Withholding Tax',
  investment: 'Investment Income',
  corporate: 'Corporate Tax',
  terminal_benefits: 'Terminal Benefits',
  penalties: 'Penalties & Interest',
};

function downloadPDF(calc: Calculation) {
  const doc = new jsPDF();
  const green: [number, number, number] = [26, 92, 56];

  doc.setFillColor(...green);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('KodiComply Tax Report', 14, 15);
  doc.setFontSize(11);
  doc.text(TYPE_LABELS[calc.calculationType] ?? calc.calculationType, 14, 24);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-TZ', { dateStyle: 'long' })}`, 14, 30);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13);
  doc.text('Results Summary', 14, 48);

  const result = calc.resultData;
  const rows = Object.entries(result)
    .filter(([k]) => !['breakdown', 'explanation', 'yearlyAllocations'].includes(k))
    .map(([k, v]) => [
      k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
      typeof v === 'number' ? formatTZS(v) : String(v),
    ]);

  autoTable(doc, {
    startY: 52,
    head: [['Item', 'Value']],
    body: rows,
    headStyles: { fillColor: green },
    alternateRowStyles: { fillColor: [240, 247, 243] },
  });

  const breakdown = result.breakdown as Array<{ description: string; amount: number; taxable?: boolean }> | undefined;
  if (breakdown && breakdown.length > 0) {
    const lastY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    doc.setFontSize(13);
    doc.text('Breakdown', 14, lastY + 12);
    autoTable(doc, {
      startY: lastY + 16,
      head: [['Description', 'Amount (TZS)', 'Status']],
      body: breakdown.map(b => [b.description, Math.abs(Math.round(b.amount)).toLocaleString(), b.taxable !== undefined ? (b.taxable ? 'Taxable' : 'Exempt') : '']),
      headStyles: { fillColor: green },
      columnStyles: { 1: { halign: 'right' } },
    });
  }

  if (result.explanation) {
    const lastY2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 200;
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(String(result.explanation), 180);
    doc.text(lines, 14, lastY2 + 10);
  }

  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.text('KodiComply • Tanzania Tax Compliance Platform • For informational purposes only', 14, 285);

  doc.save(`kodicomply-${calc.calculationType}-${calc.id}.pdf`);
  toast.success('PDF downloaded!');
}

export default function ReportsPage() {
  const router = useRouter();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/auth/login'); return; }
    api.get('/reports/history').then(r => setCalculations(r.data)).catch(() => toast.error('Failed to load history')).finally(() => setLoading(false));
  }, [router]);

  const filtered = filter ? calculations.filter(c => c.calculationType === filter) : calculations;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Calculation History & Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Download PDF reports for all your past calculations</p>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <select className="input-field w-auto" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All types</option>
            {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <span className="self-center text-sm text-gray-500">{filtered.length} calculation(s)</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-600">No calculations yet</h3>
            <p className="text-gray-400 text-sm mt-2">Use any calculator to get started — your results will be saved here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(calc => {
              const result = calc.resultData;
              const taxAmt = (result.payeMonthly ?? result.taxPayable ?? result.netVAT ?? result.whtAmount ?? result.totalTax ?? 0) as number;
              return (
                <div key={calc.id} className="card flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                      <FileText size={18} className="text-brand-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{TYPE_LABELS[calc.calculationType] ?? calc.calculationType}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={11} />{formatDate(calc.createdAt)}
                        </span>
                        {taxAmt ? (
                          <span className="text-xs font-mono text-brand-700 font-semibold">{formatTZS(taxAmt)}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => downloadPDF(calc)} className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium border border-brand-200 hover:border-brand-400 rounded-lg px-3 py-2 transition-colors">
                    <Download size={14} />PDF
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
