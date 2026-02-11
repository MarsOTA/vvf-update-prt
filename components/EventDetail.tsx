
import React, { useState, useMemo } from 'react';
import { MOCK_OPERATORS, STATUS_UI } from '../constants';
import { UserRole, Operator, OperationalEvent, PersonnelRequirement } from '../types';

interface EventDetailProps {
  role: UserRole;
  initialEvent: OperationalEvent;
}

export const EventDetail: React.FC<EventDetailProps> = ({ role, initialEvent }) => {
  const [assignedOperatorIds, setAssignedOperatorIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('TUTTI');
  
  const requirements: PersonnelRequirement[] = useMemo(() => initialEvent.requirements || [
    { role: 'CP', qty: 1, assignedIds: [] },
    { role: 'VIG', qty: 3, assignedIds: [] }
  ], [initialEvent.requirements]);

  const [activeTab, setActiveTab] = useState(requirements[0]?.role || 'VIG');

  const totalRequired = requirements.reduce((acc, curr) => acc + curr.qty, 0);
  const currentAssignedCount = assignedOperatorIds.length;

  const toggleAssignment = (op: Operator) => {
    if (!role.startsWith('COMPILATORE')) return;
    setAssignedOperatorIds(prev => 
      prev.includes(op.id) 
        ? prev.filter(id => id !== op.id) 
        : [...prev, op.id]
    );
  };

  const getAssignedByRole = (roleName: string) => {
    return MOCK_OPERATORS.filter(op => 
      assignedOperatorIds.includes(op.id) && op.qualification === roleName
    );
  };

  const filteredOperators = useMemo(() => {
    return MOCK_OPERATORS.filter(op => {
      const matchesRole = op.qualification === activeTab;
      const matchesSearch = op.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           op.rank.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = groupFilter === 'TUTTI' || op.group === groupFilter;
      return matchesRole && matchesSearch && matchesGroup;
    });
  }, [activeTab, searchTerm, groupFilter]);

  const uniqueGroups = Array.from(new Set(MOCK_OPERATORS.map(op => op.group))).sort();

  const ui: any = (STATUS_UI as any)[initialEvent.status] || { text: 'text-slate-400', color: 'bg-slate-100' };

  // Helper function to get vehicle quantity by type
  const getVehicleQty = (type: string) => {
    return initialEvent.vehicles.find(v => v.type.toLowerCase() === type.toLowerCase())?.qty || 0;
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 bg-[#f8fafc]">
      
      <div className="bg-white border-b border-slate-200 px-8 py-6 shadow-sm z-30 shrink-0">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-red-50 text-[#c6020f] flex items-center justify-center rounded-2xl font-bold text-xl border border-red-100">
              {initialEvent.code.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-800">{initialEvent.code}</h1>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${ui.text} ${ui.color} border-current`}>
                  {initialEvent.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{initialEvent.id} • {initialEvent.location}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-8 items-center bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fascia Oraria</span>
                <span className="text-sm font-normal text-slate-700">{initialEvent.timeWindow}</span>
              </div>
              <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asset Mezzi</span>
                <div className="flex gap-3 mt-0.5">
                  {/* Fix: Find vehicle quantity in the vehicles array */}
                  <span className="text-xs font-normal text-slate-600">APS: <span className="text-[#c6020f]">{getVehicleQty('aps')}</span></span>
                  <span className="text-xs font-normal text-slate-600">AS: <span className="text-[#c6020f]">{getVehicleQty('as')}</span></span>
                  {/* Fix: Find vehicle quantity in the vehicles array */}
                  <span className="text-xs font-normal text-slate-600">ABP: <span className="text-[#c6020f]">{getVehicleQty('abp')}</span></span>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Copertura Team</span>
                  <span className="text-lg font-normal text-slate-800">{currentAssignedCount}/{totalRequired}</span>
                </div>
                <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#c6020f]" style={{ width: `${(currentAssignedCount/totalRequired)*100}%` }}></div>
                </div>
              </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col max-w-[1600px] mx-auto w-full p-8">
        <div className="diamond-card flex flex-col flex-1 overflow-hidden">
          
          <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/30">
            <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 self-start shadow-sm">
              {requirements.map((req) => {
                const assignedCount = getAssignedByRole(req.role).length;
                const isSatisfied = assignedCount >= req.qty;
                return (
                  <button 
                    key={req.role}
                    onClick={() => setActiveTab(req.role)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-3 ${activeTab === req.role ? 'bg-[#720000] text-white shadow-lg shadow-red-100' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    <span className="uppercase tracking-widest">{req.role}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-normal border ${activeTab === req.role ? 'bg-white/20 border-white/30 text-white' : isSatisfied ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                      {assignedCount}/{req.qty}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <select 
                value={groupFilter} 
                onChange={e => setGroupFilter(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100"
              >
                <option value="TUTTI">Gruppo: Tutti</option>
                {uniqueGroups.map(g => <option key={g} value={g}>Gruppo {g}</option>)}
              </select>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Cerca personale..."
                  className="bg-white border border-slate-200 text-xs font-medium px-4 py-2 pl-9 rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-red-100 shadow-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <svg className="w-4 h-4 text-slate-300 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Stato</th>
                  <th className="px-6 py-4">Nominativo</th>
                  <th className="px-6 py-4">Grado</th>
                  <th className="px-6 py-4">Unità</th>
                  <th className="px-6 py-4 text-right pr-10">Azione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOperators.length > 0 ? (
                  filteredOperators.map(op => {
                    const isAssigned = assignedOperatorIds.includes(op.id);
                    return (
                      <tr key={op.id} className={`group transition-all ${!op.available ? 'opacity-40 grayscale' : isAssigned ? 'bg-red-50/30' : 'hover:bg-slate-50/50'}`}>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg w-fit text-[9px] font-black border ${op.available ? (isAssigned ? 'bg-red-100 border-red-200 text-[#c6020f]' : 'bg-emerald-100 border-emerald-200 text-emerald-700') : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${op.available ? (isAssigned ? 'bg-[#c6020f]' : 'bg-emerald-500') : 'bg-slate-400'}`}></div>
                            {op.available ? (isAssigned ? 'ASSEGNATO' : 'DISPONIBILE') : 'INDISPONIBILE'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-black text-slate-800 uppercase tracking-tight">{op.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{op.id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{op.rank}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gruppo {op.group} <span className="mx-1 opacity-20">•</span> {op.subgroup}</span>
                        </td>
                        <td className="px-6 py-4 text-right pr-10">
                          {op.available ? (
                            role.startsWith('COMPILATORE') && (
                              <button 
                                onClick={() => toggleAssignment(op)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all shadow-sm ${isAssigned ? 'bg-white border border-red-200 text-[#c6020f] hover:bg-red-50' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                              >
                                {isAssigned ? 'RIMUOVI' : 'ASSEGNA'}
                              </button>
                            )
                          ) : (
                            <span className="text-[10px] font-black text-slate-400 italic uppercase tracking-tighter">{op.statusMessage || 'FUORI SERVIZIO'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
                          <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <span className="text-slate-400 text-sm font-black uppercase tracking-[0.2em]">Assenza di operatori</span>
                        <p className="text-slate-300 text-xs mt-1 uppercase font-bold">Verificare i filtri di ricerca per la qualifica selezionata</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="h-24 bg-white border-t border-slate-200 px-10 flex items-center justify-between shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex gap-4">
            <button className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">
              Salva Bozza
            </button>
        </div>
        <div className="flex items-center gap-8">
            <div className="text-right">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Totale Deployed</span>
                <span className="text-xl font-normal text-slate-800 uppercase tracking-tighter">{currentAssignedCount} Operatori</span>
            </div>
            <button 
              disabled={currentAssignedCount < totalRequired || !role.startsWith('COMPILATORE')}
              className="px-10 py-4 bg-[#720000] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-red-100 hover:bg-[#a5020c] disabled:opacity-30 transition-all transform active:scale-95"
            >
              Conferma e Invia Ordine
            </button>
        </div>
      </div>
    </div>
  );
};
