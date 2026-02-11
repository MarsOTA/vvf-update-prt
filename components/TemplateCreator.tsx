import React, { useState, useRef, useEffect } from 'react';
import { OperationalEvent, EventStatus, PersonnelRequirement, VehicleEntry, VigilanceType } from '../types';

interface TemplateCreatorProps {
  onSave: (event: OperationalEvent) => void;
  onCancel: () => void;
  defaultDate: string;
  initialEvent?: OperationalEvent;
}

const VEHICLE_OPTIONS = [
  'AUTO',
  'AS',
  'APS',
  'ABP',
  'BUS',
  'FURG.',
  'M.PES.'
];

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6m4-11v6" />
  </svg>
);

const MessageCircleWarningIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M12 8v4"/><path d="M12 16h.01"/>
  </svg>
);

const ChevronLeft = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6"/></svg>;
const ChevronRight = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>;

const CustomCalendar: React.FC<{ selectedDate: string, minDate: string, onSelect: (date: string) => void }> = ({ selectedDate, minDate, onSelect }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate + 'T00:00:00' || new Date()));
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: (firstDayOfMonth + 6) % 7 }, (_, i) => null);
  
  const isSelected = (day: number) => {
    const d = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return d === selectedDate;
  };
  
  const isBeforeMin = (day: number) => {
    const d = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return d < minDate;
  };
  
  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
  
  return (
    <div className="p-3 w-64 bg-white border border-slate-200 shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronLeft /></button>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">{monthNames[currentMonth]} {currentYear}</span>
        <button type="button" onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronRight /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map(d => <span key={d} className="text-[8px] font-black text-slate-300 mb-1">{d}</span>)}
        {padding.map((_, i) => <div key={`p-${i}`} />)}
        {days.map(d => {
          const disabled = isBeforeMin(d);
          const localISO = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          return (
            <button key={d} type="button" disabled={disabled} onClick={() => onSelect(localISO)} className={`h-8 w-8 text-[10px] font-bold rounded-lg transition-all ${disabled ? 'text-slate-200 cursor-not-allowed' : isSelected(d) ? 'bg-[#720000] text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}>
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const TemplateCreator: React.FC<TemplateCreatorProps> = ({ onSave, onCancel, initialEvent, defaultDate }) => {
  const currentYear = new Date().getFullYear();
  const minDate = `${currentYear}-01-01`;
  
  const [formData, setFormData] = useState({
    code: initialEvent?.code || '',
    location: initialEvent?.location || '',
    date: initialEvent?.date || defaultDate,
    start: initialEvent?.timeWindow.split(' - ')[0] || '08:00',
    end: initialEvent?.timeWindow.split(' - ')[1] || '16:00',
    vigilanceType: initialEvent?.vigilanceType || 'STANDARD',
    vehicles: initialEvent?.vehicles || []
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({ code: false, location: false, date: false });
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const initialReqs = initialEvent 
    ? initialEvent.requirements.map(r => ({ role: r.role, qty: r.qty })) 
    : [
        { role: 'DIR' as const, qty: 1 },
        { role: 'CP' as const, qty: 1 },
        { role: 'VIG' as const, qty: 1 },
        { role: 'ALTRO' as const, qty: 0 }
      ];

  const [reqs, setReqs] = useState<{role: 'DIR' | 'CP' | 'VIG' | 'ALTRO', qty: number}[]>(initialReqs as any);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) setShowCalendar(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }));
    if (globalError) setGlobalError(null);
  };

  const addVehicle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, { type, plate: '', qty: 1 }]
    }));
  };

  const removeVehicleAt = (index: number) => {
    setFormData(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter((_, i) => i !== index)
    }));
  };

  const handleVehicleChange = (index: number, field: 'plate', value: string) => {
    setFormData(prev => {
      const newVehicles = [...prev.vehicles];
      newVehicles[index] = { ...newVehicles[index], [field]: value };
      return { ...prev, vehicles: newVehicles };
    });
  };

  const handleSave = () => {
    const newErrors = {
      code: !formData.code.trim(),
      location: !formData.location.trim(),
      date: !formData.date
    };
    if (newErrors.code || newErrors.location || newErrors.date) {
      setErrors(newErrors);
      setGlobalError("Compila tutti i campi obbligatori per salvare il servizio.");
      return;
    }
    
    const newRequirements = reqs.map(r => {
      const existing = initialEvent?.requirements.find(er => er.role === r.role);
      let assignedIds = Array(r.qty).fill(null);
      let entrustedGroups = Array(r.qty).fill(null);
      if (existing) {
        for (let i = 0; i < Math.min(r.qty, existing.qty); i++) {
          assignedIds[i] = existing.assignedIds[i];
          if (existing.entrustedGroups) entrustedGroups[i] = existing.entrustedGroups[i];
        }
      }
      return { role: r.role, qty: r.qty, assignedIds, entrustedGroups };
    }) as PersonnelRequirement[];

    const newEvent: OperationalEvent = {
      id: initialEvent?.id || `EV-${Math.floor(Math.random() * 9000) + 1000}`,
      code: formData.code.toUpperCase(),
      location: formData.location.toUpperCase(),
      date: formData.date,
      timeWindow: `${formData.start} - ${formData.end}`,
      status: initialEvent?.status || EventStatus.IN_COMPILAZIONE, 
      vehicles: formData.vehicles,
      vigilanceType: formData.vigilanceType as VigilanceType,
      isOlympic: formData.vigilanceType.startsWith('OLYMPIC'),
      requirements: newRequirements
    };
    onSave(newEvent);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCancel();
  };

  const inputClass = (field: string, base: string) => {
    const isError = errors[field];
    return `${base} ${isError ? 'border-red-600 ring-2 ring-red-100 border-2 bg-red-50/5' : 'border-slate-200'} transition-all duration-200`;
  };

  const getRoleLabel = (role: string) => {
    switch(role) {
        case 'DIR': return 'Funzionario';
        case 'CP': return 'Capo Posto';
        case 'VIG': return 'Vigile del Fuoco';
        case 'ALTRO': return 'Altro';
        default: return role;
    }
  }

  return (
    <div className="p-3 md:p-4 lg:px-8 lg:py-6 max-w-[1500px] mx-auto space-y-6 animate-in fade-in duration-500 pb-4 relative overflow-x-hidden min-h-full flex flex-col">
      <div className="flex justify-between items-center border-b border-slate-200 pb-5 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">
             PIANIFICAZIONE SERVIZIO
          </h1>
          <p className="text-slate-400 font-bold text-[10px] mt-1.5 uppercase tracking-widest leading-none">Compilazione assetti e logistica operativa</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">ID Servizio</span>
                <span className="text-[10px] font-mono font-bold text-slate-800">{initialEvent?.id || 'NUOVO'}</span>
            </div>
            <div className="w-12 h-12 bg-[#720000] rounded-2xl flex items-center justify-center text-amber-400 font-black text-xl shadow-lg border border-white/10">V1</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-grow">
        
        <div className="lg:col-span-7 space-y-6">
          <div className="diamond-card p-6 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm">
            <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs">1</div>
                <h3 className="text-xs font-black text-slate-700 tracking-widest uppercase">Anagrafica Intervento</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-1.5 tracking-widest pl-1">NOME DEL SERVIZIO <span className="text-red-500">*</span></label>
                <input type="text" value={formData.code} onChange={e => handleInputChange('code', e.target.value.toUpperCase())} placeholder="ES: VIGILANZA EVENTO SPORTIVO" className={inputClass('code', "w-full bg-slate-50 border rounded-2xl px-5 py-3.5 text-base font-black uppercase placeholder:text-slate-200 focus:outline-none shadow-sm")} />
              </div>
              <div className="relative" ref={calendarRef}>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-1.5 tracking-widest pl-1">DATA SERVIZIO <span className="text-red-500">*</span></label>
                <button type="button" onClick={() => setShowCalendar(!showCalendar)} className={inputClass('date', "w-full flex items-center gap-3 bg-slate-50 border rounded-2xl px-5 py-3.5 text-sm font-black text-left uppercase transition-all shadow-sm")}>
                  <CalendarIcon className="text-blue-500 shrink-0" />
                  <span className={formData.date ? 'text-slate-800' : 'text-slate-300'}>
                    {formData.date ? new Date(formData.date + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Seleziona data'}
                  </span>
                </button>
                {showCalendar && <div className="absolute top-full left-0 z-50 mt-1 shadow-2xl"><CustomCalendar selectedDate={formData.date} minDate={minDate} onSelect={(d) => { handleInputChange('date', d); setShowCalendar(false); }} /></div>}
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-1.5 tracking-widest pl-1">TIPO VIGILANZA</label>
                <select value={formData.vigilanceType} onChange={e => handleInputChange('vigilanceType', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black uppercase shadow-sm focus:outline-none appearance-none cursor-pointer">
                  <option value="STANDARD">Vigilanza Standard</option>
                  <option value="RINFORZI">Rinforzi Sedi VVF</option>
                  <option value="OLYMPIC_SPEC">Presidio olimpico: specialistici</option>
                  <option value="OLYMPIC_GENERIC">Presidio olimpico: generico</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1.5 tracking-widest pl-1">ORA INIZIO</label>
                  <input type="time" value={formData.start} onChange={e => handleInputChange('start', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1.5 tracking-widest pl-1">ORA FINE</label>
                  <input type="time" value={formData.end} onChange={e => handleInputChange('end', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-mono font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-1.5 tracking-widest pl-1">UBICAZIONE <span className="text-red-500">*</span></label>
                <input type="text" value={formData.location} onChange={e => handleInputChange('location', e.target.value.toUpperCase())} placeholder="LUOGO INTERVENTO" className={inputClass('location', "w-full bg-slate-50 border rounded-2xl px-5 py-3.5 text-sm font-bold uppercase shadow-sm focus:outline-none")} />
              </div>
            </div>
          </div>

          <div className="diamond-card p-6 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm">
            <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-black text-xs">2</div>
                <h3 className="text-xs font-black text-slate-700 tracking-widest uppercase">Assetto Personale</h3>
            </div>
            <div className="space-y-3">
              {reqs.map((r, i) => (
                <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm hover:bg-slate-100/50 transition-colors">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">
                    {getRoleLabel(r.role)}
                  </span>
                  <div className="flex items-center gap-4">
                      <button type="button" onClick={() => { const n = [...reqs]; n[i].qty = Math.max(0, n[i].qty - 1); setReqs(n); }} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 text-xs shadow-sm hover:text-red-500 hover:border-red-100 transition-all">-</button>
                      <span className="w-8 text-center font-mono font-black text-lg text-slate-800">{r.qty}</span>
                      <button type="button" onClick={() => { const n = [...reqs]; n[i].qty += 1; setReqs(n); }} className="w-8 h-8 flex items-center justify-center bg-[#720000] text-white rounded-xl text-xs shadow-md hover:bg-slate-800 transition-all">+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="diamond-card p-6 bg-[#720000]/5 border border-[#720000]/10 rounded-[1.5rem] shadow-sm flex flex-col min-h-[450px]">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#720000] flex items-center justify-center text-white font-black text-xs">3</div>
                    <h3 className="text-xs font-black text-[#720000] tracking-widest uppercase">Assetto Automezzi</h3>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-end">
                   {VEHICLE_OPTIONS.map(opt => (
                      <button 
                        key={opt}
                        type="button"
                        onClick={() => addVehicle(opt)}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tighter border transition-all bg-white text-[#720000] border-[#720000]/20 hover:bg-[#720000] hover:text-white shadow-sm`}
                      >
                         + {opt}
                      </button>
                   ))}
                </div>
            </div>
            
            <div className="flex-1 bg-white/50 border border-[#720000]/5 rounded-2xl overflow-hidden shadow-inner flex flex-col">
               <div className="grid grid-cols-12 gap-2 p-4 bg-[#720000]/10 text-[9px] font-black text-[#720000] uppercase tracking-widest border-b border-[#720000]/10 shrink-0">
                  <div className="col-span-5">Tipo Mezzo</div>
                  <div className="col-span-6 text-center">Targa</div>
                  <div className="col-span-1"></div>
               </div>
               <div className="divide-y divide-[#720000]/5 overflow-y-auto custom-scrollbar flex-1">
                  {formData.vehicles.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center justify-center opacity-30 grayscale">
                        <svg className="w-10 h-10 mb-3 text-[#720000]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
                        <p className="text-[10px] font-black uppercase tracking-widest">Nessun mezzo selezionato</p>
                    </div>
                  ) : formData.vehicles.map((v, index) => (
                    <div key={`${v.type}-${index}`} className="grid grid-cols-12 items-center gap-2 px-4 py-3.5 hover:bg-white transition-colors group">
                      <div className="col-span-5">
                         <span className="text-xs font-black text-slate-700 uppercase tracking-tighter leading-none">{v.type}</span>
                      </div>
                      <div className="col-span-6">
                         <input 
                            type="text" 
                            value={v.plate} 
                            onChange={e => handleVehicleChange(index, 'plate', e.target.value.toUpperCase())}
                            placeholder="VF-00000"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#720000]/10 text-center shadow-sm"
                         />
                      </div>
                      <div className="col-span-1 flex justify-end">
                         <button type="button" onClick={() => removeVehicleAt(index)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-600 transition-colors bg-red-50/0 hover:bg-red-50 rounded-xl" title="Rimuovi mezzo">
                            <TrashIcon className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER BAR: Trasformata da fixed a sticky per evitare sovrapposizioni e migliorare il flusso */}
      <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-4 z-50 shadow-[0_-15px_35px_rgba(0,0,0,0.05)] -mx-8 mt-10">
        <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex-1 flex items-center">
            {globalError && (
              <div className="bg-red-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-4 shadow-xl border border-red-700 animate-in slide-in-from-left-4">
                <MessageCircleWarningIcon />
                <span className="text-[11px] font-black uppercase tracking-tight leading-none">{globalError}</span>
                <button onClick={() => setGlobalError(null)} className="ml-4 text-white/50 hover:text-white transition-colors text-2xl font-light leading-none">×</button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              type="button" 
              onClick={handleCancelClick} 
              className="flex-1 md:flex-none px-12 py-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-[1.2rem] text-slate-500 text-[11px] font-black uppercase tracking-[0.15em] transition-all"
            >
                ANNULLA E TORNA AL QUADRO
            </button>
            <button 
              type="button" 
              onClick={handleSave} 
              className="flex-1 md:flex-none px-16 py-4 bg-gradient-to-r from-[#720000] to-[#8b0000] hover:from-slate-900 hover:to-slate-800 text-white text-[12px] font-black uppercase tracking-[0.25em] rounded-[1.2rem] shadow-2xl transition-all active:scale-[0.98] shadow-red-900/20 border border-white/10"
            >
                {initialEvent ? 'SALVA MODIFICHE' : 'PUBBLICA SERVIZIO'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};