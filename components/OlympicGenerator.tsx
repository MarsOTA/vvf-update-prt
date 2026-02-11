
import React, { useState, useMemo, useEffect } from 'react';
import { SEQ, getMainDayCode, getMainNightCode, selectableForVigilanza, DEFAULT_SEED_DATE, DEFAULT_SEED_CODE } from '../utils/turnarioLogic';

export const OlympicGenerator: React.FC = () => {
  const [seedDate, setSeedDate] = useState(DEFAULT_SEED_DATE);
  const [seedCode, setSeedCode] = useState(DEFAULT_SEED_CODE);
  const [startDate, setStartDate] = useState('2026-01-01');
  const [days, setDays] = useState(31);

  const tableData = useMemo(() => {
    const rows = [];
    const sDate = new Date(seedDate + 'T00:00:00');
    const stDate = new Date(startDate + 'T00:00:00');
    
    for (let i = 0; i < days; i++) {
      const d = new Date(stDate);
      d.setDate(d.getDate() + i);
      
      try {
        const day = getMainDayCode(d, sDate, seedCode);
        const night = getMainNightCode(d, sDate, seedCode);
        const vig = selectableForVigilanza(day);
        
        rows.push({
          date: d,
          day,
          night,
          standard: vig.standard,
          extra: vig.extra,
          hasEveningExtra: vig.extra.includes(night)
        });
      } catch (e) {
        console.error(e);
      }
    }
    return rows;
  }, [seedDate, seedCode, startDate, days]);

  return (
    <div className="p-8 max-w-[1700px] mx-auto space-y-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Generatore Turnario Olimpico</h1>
          <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-[0.2em]">Algoritmo deterministico • Ciclo 32 step • Proiezione Assetti Vigilanza</p>
        </div>
      </div>

      {/* Pannello Configurazione Orizzontale */}
      <div className="diamond-card p-6 bg-white shadow-xl border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Data Seed (Ancora)</label>
            <input 
              type="date" 
              value={seedDate} 
              onChange={e => setSeedDate(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase focus:ring-2 focus:ring-[#720000]/10" 
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Codice Seed (Diurno)</label>
            <select 
              value={seedCode} 
              onChange={e => setSeedCode(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black focus:ring-2 focus:ring-[#720000]/10"
            >
              {SEQ.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Inizio Proiezione</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase focus:ring-2 focus:ring-[#720000]/10" 
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Giorni da Generare</label>
            <input 
              type="number" 
              min="1" 
              max="120" 
              value={days} 
              onChange={e => setDays(parseInt(e.target.value) || 1)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black focus:ring-2 focus:ring-[#720000]/10" 
            />
          </div>
        </div>
      </div>

      {/* Tabella Risultati */}
      <div className="diamond-card overflow-hidden shadow-2xl border border-slate-100">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white">
              <th className="px-6 py-5">Data Calendario</th>
              <th className="px-6 py-5 border-l border-white/10 text-amber-400">Diurno</th>
              <th className="px-6 py-5 border-l border-white/10 text-slate-300">Notturno (Prec.)</th>
              <th className="px-6 py-5 border-l border-white/10">Vigilanza Selezionabili (8 Std + 3 Extra)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {tableData.map((row, idx) => (
              <tr key={idx} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-800 tracking-tight uppercase">
                      {row.date.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">
                      {row.date.toLocaleDateString('it-IT', { weekday: 'long' }).toUpperCase()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 border-l border-slate-50">
                  <span className="px-4 py-1.5 bg-amber-100 text-amber-900 rounded-lg text-sm font-black border border-amber-200 shadow-sm">
                    {row.day}
                  </span>
                </td>
                <td className="px-6 py-5 border-l border-slate-50">
                  <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-black border border-slate-200 shadow-sm">
                    {row.night}
                  </span>
                </td>
                <td className="px-6 py-5 border-l border-slate-50">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-1.5">
                      {row.standard.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md text-[10px] font-black border border-slate-100">
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {row.extra.map(e => (
                        <div 
                          key={e} 
                          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all ${
                            e === row.night 
                            ? 'bg-red-50 border-red-200 text-[#720000] ring-4 ring-red-500/5' 
                            : 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm'
                          }`}
                        >
                          <span>{e}</span>
                          {e === row.night && (
                            <div className="flex items-center gap-1.5 ml-1.5 pl-2 border-l border-red-200">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#720000] animate-pulse"></div>
                              <span className="text-[8px] uppercase tracking-tighter font-black">Rientro Sera (4h)</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
