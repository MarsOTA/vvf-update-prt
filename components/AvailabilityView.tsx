
import React, { useState } from 'react';

const MOCK_DATES = [
  '14/02/26', '15/02/26', '16/02/26', '17/02/26', '18/02/26', '19/02/26', '20/02/26', 
  '21/02/26', '22/02/26', '23/02/26', '24/02/26', '25/02/26', '26/02/26', '27/02/26', 
  '28/02/26', '01/03/26', '02/03/26', '03/03/26', '04/03/26', '05/03/26', '06/03/26', 
  '07/03/26', '08/03/26', '09/03/26', '10/03/26', '11/03/26', '12/03/26', '13/03/26'
];

const MOCK_SHIFTS_DIURNO = ['B1', 'C1', 'D1', 'A2', 'B2', 'C2', 'D2', 'A3', 'B3', 'C3', 'D3', 'A4', 'B4', 'C4', 'D4', 'A5', 'B5', 'C5', 'D5', 'A6', 'B6', 'C6', 'D6', 'A7', 'B7', 'C7', 'D7', 'A8'];
const MOCK_SHIFTS_NOTTURNO = ['D8', 'B1', 'C1', 'D1', 'A2', 'B2', 'C2', 'D2', 'A3', 'B3', 'C3', 'D3', 'A4', 'B4', 'C4', 'D4', 'A5', 'B5', 'C5', 'D5', 'A6', 'B6', 'C6', 'D6', 'A7', 'B7', 'C7', 'D7'];

export const AvailabilityView: React.FC = () => {
  const [isUploaded, setIsUploaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const simulateUpload = () => {
    setIsUploaded(true);
  };

  return (
    <div className="p-8 max-w-[1750px] mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Gestione Disponibilità</h1>
          <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-[0.2em]">Importazione e consultazione calendario turni e vigilanza</p>
        </div>
        {isUploaded && (
            <button 
                onClick={() => setIsUploaded(false)}
                className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 shadow-sm"
            >
                Carica Nuovo File
            </button>
        )}
      </div>

      {!isUploaded ? (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); simulateUpload(); }}
          className={`diamond-card h-[500px] flex flex-col items-center justify-center border-2 border-dashed transition-all duration-300 cursor-pointer rounded-[2.5rem] ${isDragging ? 'border-[#720000] bg-red-50/30 scale-[0.99]' : 'border-slate-200 bg-white hover:border-slate-300'}`}
          onClick={simulateUpload}
        >
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <svg className={`w-10 h-10 ${isDragging ? 'text-[#720000]' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Trascina qui il file Excel</h2>
          <p className="text-slate-400 text-sm font-medium mt-2">O clicca per sfogliare i documenti del computer</p>
          <div className="mt-8 flex gap-3">
             <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase">XLSX</span>
             <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase">XLS</span>
             <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase">CSV</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Calendario Principale */}
          <div className="diamond-card overflow-hidden rounded-[2rem] border-slate-200">
            <div className="bg-slate-800 p-4 flex justify-between items-center">
                <span className="text-white text-[10px] font-black uppercase tracking-widest">Matrice Turni Comando Milano</span>
                <span className="text-amber-400 text-[10px] font-black uppercase">Stato: Caricato</span>
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-white z-20 p-4 border-r border-b border-slate-200 min-w-[140px]"></th>
                    {MOCK_DATES.map((date, i) => (
                      <th key={i} className="p-2 border-b border-r border-slate-100 bg-slate-50/50">
                        <div className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-black text-slate-600 tracking-widest h-20 flex items-center justify-center w-8">
                          {date}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="sticky left-0 bg-white z-20 px-6 py-3 border-r border-slate-200 text-[10px] font-black text-slate-800 uppercase tracking-wider">Turno Diurno</td>
                    {MOCK_SHIFTS_DIURNO.map((s, i) => (
                      <td key={i} className="p-3 border-r border-slate-100 text-center font-mono font-bold text-xs text-slate-600">{s}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="sticky left-0 bg-white z-20 px-6 py-3 border-r border-slate-200 text-[10px] font-black text-slate-800 uppercase tracking-wider">Turno Notturno</td>
                    {MOCK_SHIFTS_NOTTURNO.map((s, i) => (
                      <td key={i} className="p-3 border-r border-slate-100 text-center font-mono font-bold text-xs text-slate-600">{s}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Sezione Vigilanza - Highlights */}
          <div className="diamond-card overflow-hidden rounded-[2rem] border-slate-200">
            <div className="bg-[#720000] p-4">
                <span className="text-white text-[11px] font-black uppercase tracking-widest leading-none flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div> Calendario Vigilanze
                </span>
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-white z-20 p-4 border-r border-b border-slate-200 min-w-[140px]"></th>
                    {MOCK_DATES.map((date, i) => (
                      <th key={i} className="p-2 border-b border-r border-slate-100 bg-slate-50/30">
                        <div className="[writing-mode:vertical-lr] rotate-180 text-[9px] font-black text-slate-400 tracking-widest h-16 flex items-center justify-center w-8">
                          {date}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-amber-50/40">
                    <td className="sticky left-0 bg-amber-50 z-20 px-6 py-4 border-r border-slate-200 text-[10px] font-black text-amber-900 uppercase tracking-wider shadow-sm">Turno Corrente</td>
                    {MOCK_SHIFTS_DIURNO.map((s, i) => (
                      <td key={i} className="p-3 border-r border-slate-100 text-center font-mono font-black text-xs text-amber-700">{s}</td>
                    ))}
                  </tr>
                  {/* Simulazione "Turni utilizzabili per i rientri" */}
                  {[1, 2, 3, 4, 5].map((row) => (
                    <tr key={row} className="hover:bg-slate-50 transition-colors">
                      {row === 1 && (
                        <td rowSpan={5} className="sticky left-0 bg-white z-20 px-4 py-3 border-r border-slate-200">
                           <div className="[writing-mode:vertical-lr] rotate-180 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center h-full">
                             Turni per Rientri
                           </div>
                        </td>
                      )}
                      {MOCK_SHIFTS_NOTTURNO.map((s, i) => (
                        <td key={i} className="p-2 border-r border-slate-100 text-center font-mono font-medium text-[10px] text-slate-400">
                          {MOCK_SHIFTS_DIURNO[(i + row) % MOCK_SHIFTS_DIURNO.length]}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-slate-100/50">
                    <td className="sticky left-0 bg-slate-100 z-20 px-6 py-2 border-r border-slate-200 text-[9px] font-black text-slate-400 uppercase">Extra</td>
                    {MOCK_DATES.map((_, i) => (
                      <td key={i} className="p-2 border-r border-slate-100 text-center text-[8px] font-bold text-slate-300">Extra</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
