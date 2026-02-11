
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MOCK_OPERATORS, ALL_SPECIALIZATIONS, ALL_SEDI, ALL_PATENTI } from '../constants';
import { OperationalEvent, EventStatus, UserRole, PersonnelRequirement, VehicleEntry, VigilanceType, Operator } from '../types';
import { getMainDayCode, getPriorityChain, selectableForVigilanza } from '../utils/turnarioLogic';
import { openRapportoPresenza } from '../utils/rapportoPresenza';
import ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Mapping vincolante mezzi -> grado patente richiesto
const PATENT_REQUIREMENTS: Record<string, number> = {
  'M.PES.': 4,
  'MEZZO PESANTE': 4,
  'AS': 3,
  'ABP': 3,
  'APS': 3,
  'BUS': 3
};

// Funzione helper per calcolare la durata numerica di un servizio
const getServiceDurationHours = (timeWindow: string): number => {
  const parts = timeWindow.split(' - ').map(s => s.trim());
  if (parts.length < 2) return 0;
  const [start, end] = parts;
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  let diffMinutes = (h2 * 60 + (m2 || 0)) - (h1 * 60 + (m1 || 0));
  if (diffMinutes <= 0) diffMinutes += 24 * 60; // Gestione scavalco mezzanotte
  return diffMinutes / 60;
};

const UserPlusIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" x2="19" y1="8" y2="14" />
    <line x1="22" x2="16" y1="11" y2="11" />
  </svg>
);

const PencilIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6m4-11v6" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const FlagIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

const ShareIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const RotateCcwIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const ClipboardIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
  </svg>
);

const PanelBottomOpenIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 15h18"/><path d="m9 10 3-3 3 3"/>
  </svg>
);

const PanelTopOpenIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="m15 14-3 3-3-3"/>
  </svg>
);

const ZoomIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/>
  </svg>
);

const PdfIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" x2="8" y1="13" y2="13"></line>
    <line x1="16" x2="8" y1="17" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const FileSpreadsheetIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <path d="M8 13h2"/>
    <path d="M8 17h2"/>
    <path d="M14 13h2"/>
    <path d="M14 17h2"/>
  </svg>
);

const BellIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const ChevronLeft = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const ChevronRight = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

const CustomCalendar: React.FC<{ selectedDate: string, onSelect: (date: string) => void }> = ({ selectedDate, onSelect }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate + 'T00:00:00' || new Date()));
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: (firstDayOfMonth + 6) % 7 }, (_, i) => null);
  
  const isSelected = (dayNum: number) => {
    const d = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return d === selectedDate;
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
          return (
            <button key={d} type="button" onClick={() => onSelect(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)} className={`h-8 w-8 text-[10px] font-bold rounded-lg transition-all ${isSelected(d) ? 'bg-[#720000] text-white shadow-lg shadow-red-100' : 'text-slate-600 hover:bg-slate-100'}`}>
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const PieChart: React.FC<{ percent: number; color: string; alertMessage?: string | null }> = ({ percent, color, alertMessage }) => {
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  const isAlert = !!alertMessage;

  return (
    <div className="relative flex items-center justify-center w-12 h-12 shrink-0 group cursor-help">
      <svg className="w-12 h-12 transform -rotate-90 block">
        <circle cx="24" cy="24" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="rgba(0,0,0,0.15)" />
        <circle cx="24" cy="24" r={radius} stroke={isAlert ? '#EF4444' : color} strokeWidth="4" fill="transparent" strokeDasharray={circumference} style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center leading-none text-white pointer-events-none">
          {isAlert ? (
             <span className="text-2xl font-black text-red-500 animate-pulse pb-1">!</span>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black tracking-tighter block" data-pdf-percent="true">{percent}</span>
              <span className="text-[6px] font-black opacity-80 block -mt-0.5">%</span>
            </div>
          )}
      </div>

      {isAlert && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-2.5 bg-slate-900 text-white text-[9px] font-black leading-tight rounded-xl shadow-2xl border border-white/20 z-[100] invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
          {alertMessage}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[8px] border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  );
};

interface DeleteConfirmationModalProps {
    count: number;
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ count, onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onCancel}></div>
        <div className="w-full max-w-md bg-white p-8 relative z-10 shadow-2xl rounded-[2.5rem] flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <TrashIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 text-center uppercase tracking-tight translation-none leading-none mb-2">Conferma Eliminazione</h3>
            <p className="text-slate-500 text-sm text-center mb-8">
                Sei sicuro di voler eliminare {count === 1 ? 'questo servizio' : `${count} servizi`}? 
                <br /><strong className="text-red-600 font-black">L’operazione non è reversibile.</strong>
            </p>
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={onCancel}
                    className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                >
                    Annulla
                </button>
                <button 
                    onClick={onConfirm}
                    className="px-6 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                >
                    Elimina ora
                </button>
            </div>
        </div>
    </div>
);

interface DashboardProps {
  events: OperationalEvent[];
  setEvents: React.Dispatch<React.SetStateAction<OperationalEvent[]>>;
  role: UserRole;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onEditEvent: (event: OperationalEvent) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ events, setEvents, role, selectedDate, setSelectedDate, onEditEvent }) => {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [assignmentModal, setAssignmentModal] = useState<{ eventId: string, roleName: string, reqIndex: number, slotIndex: number } | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<string[] | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [dayApprovedState, setDayApprovedState] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const reportMenuRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Calcolo dinamico del carico ore per tutti gli operatori basato sulle assegnazioni correnti
  const operatorsCalculatedHours = useMemo(() => {
    const hoursMap: Record<string, number> = {};
    
    // Inizializza con le ore di base dai mock
    MOCK_OPERATORS.forEach(op => {
      hoursMap[op.id] = op.assignedHours;
    });

    // Aggiungi le ore di ogni assegnazione presente nello stato globale
    events.forEach(ev => {
      const duration = getServiceDurationHours(ev.timeWindow);
      ev.requirements.forEach(req => {
        req.assignedIds.forEach(id => {
          if (id && hoursMap[id] !== undefined) {
            hoursMap[id] += duration;
          }
        });
      });
    });

    return hoursMap;
  }, [events]);

  useEffect(() => {
    const isApproved = localStorage.getItem(`approvedDay_${selectedDate}`) === 'true';
    setDayApprovedState(isApproved);
  }, [selectedDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (reportMenuRef.current && !reportMenuRef.current.contains(event.target as Node)) {
        setShowReportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const displayEvents = useMemo(() => {
    return [...events]
      .filter(ev => ev.date === selectedDate)
      .sort((a, b) => a.timeWindow.split(' - ')[0].localeCompare(b.timeWindow.split(' - ')[0]));
  }, [events, selectedDate]);

  const getEventCompletion = (ev: OperationalEvent) => {
    const totalRequired = ev.requirements.reduce((acc, r) => acc + (r.qty || 0), 0);
    if (totalRequired === 0) return 100;
    const totalFilled = ev.requirements.reduce((acc, r) => acc + (r.assignedIds?.filter(Boolean).length || 0), 0);
    return Math.round((totalFilled / totalRequired) * 100);
  };

  const getLicenseAlert = (ev: OperationalEvent) => {
    const completion = getEventCompletion(ev);
    if (completion < 100) return null;

    let maxReq = 0;
    ev.vehicles.forEach(v => {
      const req = PATENT_REQUIREMENTS[v.type.toUpperCase()] || 0;
      if (req > maxReq) maxReq = req;
    });

    if (maxReq === 0) return null;

    // Recupero operatori assegnati
    const assignedOperatorIds = ev.requirements.flatMap(r => r.assignedIds.filter(Boolean)) as string[];
    const assignedOperators = assignedOperatorIds.map(id => MOCK_OPERATORS.find(o => o.id === id)).filter(Boolean) as Operator[];

    const hasValidDriver = assignedOperators.some(op => {
      const gradeStr = op.tipoPatente || '0';
      const grade = parseInt(gradeStr);
      return grade >= maxReq;
    });

    if (!hasValidDriver) {
      return `Attenzione: nessun operatore assegnato ha la patente richiesta per il mezzo selezionato - richiesto: ${maxReq}° grado`;
    }
    return null;
  };

  const allComplete = useMemo(() => {
    return displayEvents.length > 0 && displayEvents.every(ev => getEventCompletion(ev) === 100);
  }, [displayEvents]);

  const handleToggleDayApproval = () => {
    const newState = !dayApprovedState;
    
    if (newState) {
      if (!allComplete) {
        if (!window.confirm("ATTENZIONE: Alcuni servizi non sono completati al 100%. Vuoi procedere comunque con l'approvazione formale della giornata?")) {
          return;
        }
      } else {
        if (!window.confirm(`Confermi l'approvazione definitiva di tutti i servizi per il giorno ${formatDate(selectedDate)}? Questa operazione bloccherà ulteriori modifiche.`)) {
          return;
        }
      }
    } else {
      if (!window.confirm("Riaprire la giornata? Le modifiche verranno nuovamente abilitate per i compilatori.")) {
        return;
      }
    }

    localStorage.setItem(`approvedDay_${selectedDate}`, String(newState));
    setDayApprovedState(newState);
    
    // Aggiorna lo stato di tutti gli eventi della giornata selezionata
    setEvents(prev => prev.map(ev => {
      if (ev.date === selectedDate) {
        return { ...ev, status: newState ? EventStatus.APPROVATO : EventStatus.IN_COMPILAZIONE };
      }
      return ev;
    }));
  };

  const summary = useMemo(() => {
    const stats: Record<string, { assigned: number; total: number }> = { 
      DIR: { assigned: 0, total: 0 }, 
      CP: { assigned: 0, total: 0 }, 
      VIG: { assigned: 0, total: 0 },
      ALTRO: { assigned: 0, total: 0 }
    };
    displayEvents.forEach(ev => {
      ev.requirements.forEach(req => {
        if (req.role in stats) {
          stats[req.role].assigned += req.assignedIds.filter(Boolean).length;
          stats[req.role].total += req.qty;
        }
      });
    });
    return stats;
  }, [displayEvents]);

  const uniqueEventDates = useMemo(() => {
    return Array.from(new Set(events.map(e => e.date))).sort();
  }, [events]);

  const toggleExpandAll = (expand: boolean) => {
    setExpandedIds(expand ? displayEvents.map(ev => ev.id) : []);
  };

  const confirmDelete = () => {
    if (!deleteRequest) return;
    setEvents(prev => prev.filter(ev => !deleteRequest.includes(ev.id)));
    setExpandedIds(prev => prev.filter(id => !deleteRequest.includes(id)));
    if (assignmentModal && deleteRequest.includes(assignmentModal.eventId)) setAssignmentModal(null);
    setDeleteRequest(null);
  };

  const handleDownloadPDF = async () => {
    if (!gridRef.current) return;
    setIsPdfLoading(true);

    const previousZoom = zoomLevel;
    const previousExpanded = [...expandedIds];
    const container = gridRef.current;

    const originalStyle = container.getAttribute('style') || '';
    const originalClassName = container.className;

    toggleExpandAll(true);
    setZoomLevel(1);

    const cols = 3;
    const rowsPerPage = 2;
    const perPage = cols * rowsPerPage;

    const cardMinWidth = 520;
    const gap = 24;
    const padding = 40;
    const exportWidth = cols * cardMinWidth + (cols - 1) * gap + padding * 2;

    const totalPages = Math.max(1, Math.ceil(displayEvents.length / perPage));
    await new Promise(resolve => setTimeout(resolve, 900));

    try {
      container.style.cssText = `
        display: grid !important;
        grid-template-columns: repeat(${cols}, 1fr) !important;
        gap: ${gap}px !important;
        width: ${exportWidth}px !important;
        background: white !important;
        padding: ${padding}px !important;
        transform: none !important;
        overflow: visible !important;
      `;
      container.classList.add('forced-pdf-grid');

      const headerDiv = document.createElement('div');
      headerDiv.style.cssText = `
        grid-column: span ${cols} !important;
        margin-bottom: 40px !important;
        border-bottom: 5px solid black !important;
        padding-bottom: 20px !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: flex-end !important;
        background: white !important;
      `;
      headerDiv.innerHTML = `
        <div style="flex: 1">
          <h1 style="font-size: 40px; font-weight: 900; text-transform: uppercase; margin: 0; color: black; letter-spacing: -1px;">VVF MILANO • REPORT OPERATIVO</h1>
          <p style="font-size: 18px; font-weight: 700; text-transform: uppercase; margin: 10px 0 0 0; color: #333;">Comando Provinciale Vigili del Fuoco</p>
        </div>
        <div style="text-align: right">
          <h2 style="font-size: 56px; font-weight: 900; margin: 0; line-height: 0.8; color: black;">${formatDate(selectedDate)}</h2>
          <p style="font-size: 13px; font-weight: 700; text-transform: uppercase; margin-top: 24px; color: #555;">Documento generato il ${new Date().toLocaleString()}</p>
        </div>
      `;
      container.prepend(headerDiv);

      const pdf = new jsPDF('l', 'mm', 'a3');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const cards = Array.from(container.querySelectorAll('.print-card-break')) as HTMLElement[];
      const originalDisplays = cards.map(c => c.style.display);

      for (let page = 0; page < totalPages; page++) {
        const from = page * perPage;
        const to = from + perPage;

        cards.forEach((c, i) => { c.style.display = (i >= from && i < to) ? '' : 'none'; });

        await new Promise(resolve => setTimeout(resolve, 200));

        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: exportWidth,
          onclone: (clonedDoc) => {
            const clonedEl = clonedDoc.querySelector('.forced-pdf-grid') as HTMLElement;
            if (!clonedEl) return;

            clonedEl.style.display = 'grid';
            clonedEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
            clonedEl.style.gap = `${gap}px`;
            clonedEl.style.width = `${exportWidth}px`;
            clonedEl.style.padding = `${padding}px`;
            clonedEl.style.overflow = 'visible';

            clonedDoc.querySelectorAll('.truncate').forEach((el: any) => {
              el.style.whiteSpace = 'normal';
              el.style.overflow = 'visible';
              el.style.textOverflow = 'clip';
            });

            clonedDoc.querySelectorAll('.print-card-break').forEach((el: any) => {
              el.style.overflow = 'visible';
              el.style.minHeight = '320px';
            });

            clonedDoc.querySelectorAll('[data-requirement-row="true"]').forEach((el: any) => {
              el.style.height = 'auto'; 
              el.style.minHeight = '48px';
              el.style.paddingTop = '4px';
              el.style.paddingBottom = '4px';
            });

            clonedDoc.querySelectorAll('[data-pdf-badge="true"]').forEach((el: any) => {
              el.style.fontSize = '10px';
              el.style.whiteSpace = 'normal';
              el.style.overflow = 'visible';
              el.style.textOverflow = 'clip';
              el.style.wordBreak = 'break-word';
              el.style.lineHeight = '1.05';

              const parent = el.parentElement as HTMLElement | null;
              if (parent) {
                parent.style.overflow = 'visible';
                parent.style.width = '140px';
                parent.style.flex = '0 0 140px';
              }
            });

            clonedDoc.querySelectorAll('[data-pdf-percent="true"]').forEach((el: any) => {
              el.style.fontSize = '12px';
            });
          }
        });

        const imgData = canvas.toDataURL('image/png');
        const imgW = canvas.width;
        const imgH = canvas.height;
        const ratio = imgW / imgH;

        let w = pdfWidth;
        let h = w / ratio;
        let x = 0;
        let y = 0;

        if (h > pdfHeight) {
          h = pdfHeight;
          w = h * ratio;
          x = (pdfWidth - w) / 2;
        }

        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', x, y, w, h, undefined, 'FAST');
      }

      cards.forEach((c, i) => { c.style.display = originalDisplays[i]; });

      container.removeChild(headerDiv);
      container.className = originalClassName;
      container.style.cssText = originalStyle;
      container.classList.remove('forced-pdf-grid');
      setZoomLevel(previousZoom);
      setExpandedIds(previousExpanded);

      pdf.save(`Report_Servizi_VVF_MILANO_${selectedDate}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Si è verificato un errore durante l'esportazione del PDF.");
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const wb = new (ExcelJS as any).Workbook();

      const EVENTS_PER_PAGE = 9; // 3x3
      const totalPages = Math.max(1, Math.ceil(displayEvents.length / EVENTS_PER_PAGE));

      const CARD_COLS = 6;
      const GAP_COLS = 2;
      const CARDS_PER_ROW = 3;
      const CARD_ROWS = 11;
      const GAP_ROWS = 1;
      const cardWidths = [9.4, 12, 12, 12, 12, 12];
      const gapWidths = [2.5, 2.5];
      const widths: number[] = [
        ...cardWidths, ...gapWidths,
        ...cardWidths, ...gapWidths,
        ...cardWidths,
      ];

      const colStarts = [1, 1 + CARD_COLS + GAP_COLS, 1 + (CARD_COLS + GAP_COLS) * 2];
      const rowStarts = [2, 2 + CARD_ROWS + GAP_ROWS, 2 + (CARD_ROWS + GAP_ROWS) * 2];

      const formatDateHeader = (iso: string) => {
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
      };

      const calcDurationHours = (timeWindow: string) => {
        const parts = timeWindow.split(' - ').map(s => s.trim());
        if (parts.length < 2) return '';
        const [a, b] = parts;
        const [ah, am] = a.split(':').map(Number);
        const [bh, bm] = b.split(':').map(Number);
        if ([ah, am, bh, bm].some(n => Number.isNaN(n))) return '';
        let start = ah * 60 + am;
        let end = bh * 60 + bm;
        if (end < start) end += 24 * 60;
        const mins = end - start;
        const hrs = mins / 60;
        return Math.abs(hrs - Math.round(hrs)) < 1e-6 ? `${Math.round(hrs)}h.` : `${hrs.toFixed(1)}h.`;
      };

      const computeCompletionPercent = (ev: OperationalEvent) => {
        const totalRequired = ev.requirements.reduce((acc, r) => acc + (r.qty || 0), 0);
        if (totalRequired === 0) return 100;
        const totalFilled = ev.requirements.reduce((acc, r) => acc + (r.assignedIds?.filter(Boolean).length || 0), 0);
        return Math.round((totalFilled / totalRequired) * 100);
      };

      const buildNameRows = (ev: OperationalEvent) => {
        const rows: { q: string; n: string }[] = [];

        const getFullDisplayName = (opId: string | null, entrustedTo: string | null | undefined, fallback: string) => {
           if (!opId) return entrustedTo ? `AFFIDATO ${entrustedTo}` : '';
           const op = MOCK_OPERATORS.find(o => o.id === opId);
           if (!op) return '';
           
           let name = op.name;
           
           // Aggiunta patente
           const lic = op.tipoPatente?.trim().toUpperCase();
           let licL = '';
           if (lic === '3') licL = '3°';
           else if (lic === '4') licL = '4°';
           else if (lic === '3 LIM.') licL = '3 L.';
           else if (lic === '4 LIM.') licL = '4 L.';
           if (licL) name += ` [${licL}]`;

           // Aggiunta specializzazioni
           if (op.specializations?.length) {
              name += ` (${op.specializations.join(', ')})`;
           }

           return name;
        };

        const pushRole = (role: string, label: string) => {
          const req = ev.requirements.find(r => r.role === role);
          if (!req || !req.qty) {
            rows.push({ q: label, n: '' });
            return;
          }
          for (let i = 0; i < req.qty; i++) {
            const assignedId = req.assignedIds?.[i];
            const operator = assignedId ? MOCK_OPERATORS.find(o => o.id === assignedId) : null;
            const entrustedTo = req.entrustedGroups?.[i];
            const fullN = getFullDisplayName(assignedId, entrustedTo, label);
            rows.push({ q: operator ? operator.rank : label, n: fullN });
          }
        };

        pushRole('DIR', 'DIR');
        pushRole('CP', 'CP');

        const vigReq = ev.requirements.find(r => r.role === 'VIG');
        if (!vigReq || !vigReq.qty) {
          rows.push({ q: 'VIG', n: '' });
        } else {
          for (let i = 0; i < vigReq.qty; i++) {
            const assignedId = vigReq.assignedIds?.[i];
            const operator = assignedId ? MOCK_OPERATORS.find(o => o.id === assignedId) : null;
            const entrustedTo = vigReq.entrustedGroups?.[i];
            const fullN = getFullDisplayName(assignedId, entrustedTo, 'VIG');
            rows.push({ q: operator ? operator.rank : 'VIG', n: fullN });
          }
        }

        const main = new Set(['DIR', 'CP', 'VIG']);
        ev.requirements.forEach(req => {
          if (!req.qty || req.qty === 0) return;
          if (main.has(req.role)) return;

          for (let i = 0; i < req.qty; i++) {
            const assignedId = req.assignedIds?.[i];
            const operator = assignedId ? MOCK_OPERATORS.find(o => o.id === assignedId) : null;
            const entrustedTo = req.entrustedGroups?.[i];
            const fullN = getFullDisplayName(assignedId, entrustedTo, 'ALT');
            if (fullN) rows.push({ q: operator ? operator.rank : 'ALT', n: fullN });
          }
        });

        return rows;
      };

      const applyCellStyle = (cell: any, fontSize: number, bold: boolean, align: 'left' | 'center' = 'left') => {
        cell.font = { name: 'Calibri', size: fontSize, bold };
        cell.alignment = { vertical: 'middle', horizontal: align, wrapText: true };
      };

      const applyThinGrid = (ws: any, r0: number, c0: number, r1: number, c1: number) => {
        for (let r = r0; r <= r1; r++) {
          for (let c = c0; c <= c1; c++) {
            ws.getCell(r, c).border = {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' },
            };
          }
        }
      };

      const applyOutlineMedium = (ws: any, r0: number, c0: number, r1: number, c1: number) => {
        for (let r = r0; r <= r1; r++) {
          for (let c = c0; c <= c1; c++) {
            const cell = ws.getCell(r, c);
            const b = cell.border || {};
            cell.border = {
              ...b,
              top: r === r0 ? { style: 'medium' } : b.top,
              bottom: r === r1 ? { style: 'medium' } : b.bottom,
              left: c === c0 ? { style: 'medium' } : b.left,
              right: c === c1 ? { style: 'medium' } : b.right,
            };
          }
        }
      };

      for (let page = 0; page < totalPages; page++) {
        const sheetName = totalPages === 1 ? 'A3' : `A3_${page + 1}`;
        const ws = wb.addWorksheet(sheetName);

        ws.pageSetup = {
          paperSize: 8,
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
          horizontalCentered: false,
          verticalCentered: false,
          margins: { left: 0.3, right: 0.3, top: 0.3, bottom: 0.3, header: 0.2, footer: 0.2 },
        };

        ws.columns = widths.map((w: number, idx: number) => ({ key: `c${idx + 1}`, width: w }));

        for (let r = 1; r <= 39; r++) ws.getRow(r).height = 18;
        ws.getRow(1).height = 32;

        ws.mergeCells(1, 1, 1, 22);
        const headerCell = ws.getCell(1, 1);
        headerCell.value = `Data: ${formatDateHeader(selectedDate)}`;
        headerCell.font = { name: 'Calibri', size: 24, bold: true };
        headerCell.alignment = { vertical: 'middle', horizontal: 'left' };

        ws.mergeCells(39, 1, 39, 22);
        const footerCell = ws.getCell(39, 1);
        footerCell.value = `DATA: ${selectedDate}`;
        footerCell.font = { name: 'Calibri', size: 12, bold: false };
        footerCell.alignment = { vertical: 'middle', horizontal: 'left' };

        const pageEvents = displayEvents.slice(page * EVENTS_PER_PAGE, (page + 1) * EVENTS_PER_PAGE);
        pageEvents.forEach((ev, i) => {
          const gridR = Math.floor(i / CARDS_PER_ROW);
          const gridC = i % CARDS_PER_ROW;
          const r0 = rowStarts[gridR];
          const c0 = colStarts[gridC];
          const r1 = r0 + CARD_ROWS - 1;
          const c1 = c0 + CARD_COLS - 1;

          applyThinGrid(ws, r0, c0, r1, c1);
          applyOutlineMedium(ws, r0, c0, r1, c1);

          ws.mergeCells(r0, c0, r0, c1);
          const titleCell = ws.getCell(r0, c0);
          titleCell.value = `${ev.code}`;
          applyCellStyle(titleCell, 18, true, 'left');

          ws.mergeCells(r0 + 1, c0, r0 + 1, c1);
          const dur = calcDurationHours(ev.timeWindow);
          const orarioCell = ws.getCell(r0 + 1, c0);
          orarioCell.value = `ORARIO: ${ev.timeWindow}${dur ? ` - DURATA: ${dur}` : ''}`;
          applyCellStyle(orarioCell, 18, true, 'left');

          const rows = buildNameRows(ev);
          const maxNameRows = 6;
          for (let k = 0; k < maxNameRows; k++) {
            const rr = r0 + 2 + k;
            const qCell = ws.getCell(rr, c0);
            const nStart = c0 + 1;
            const nEnd = c1;

            ws.mergeCells(rr, nStart, rr, nEnd);

            const item = rows[k];
            qCell.value = item ? item.q : '';
            applyCellStyle(qCell, 14, true, 'left');

            const nCell = ws.getCell(rr, nStart);
            nCell.value = item ? item.n : '';
            applyCellStyle(nCell, 16, false, 'left');

            qCell.border = { ...(qCell.border || {}), right: { style: 'thin' } };
            nCell.border = { ...(nCell.border || {}), left: { style: 'thin' } };
          }

          ws.mergeCells(r0 + 8, c0, r0 + 8, c1);
          const vehicleCell = ws.getCell(r0 + 8, c0);
          const vehicleParts: string[] = ev.vehicles
            .filter(v => v.qty > 0)
            .map(v => `${v.type.toUpperCase()}${v.plate ? ` [${v.plate}]` : ''}`);
          vehicleCell.value = vehicleParts.join(' • ');
          vehicleCell.font = { name: 'Calibri', size: 13, bold: false };
          vehicleCell.alignment = { vertical: 'middle', horizontal: 'left' };

          const pct = computeCompletionPercent(ev);
          const boxR0 = r0 + 9;
          const boxR1 = r0 + 10;
          const boxC0 = c0 + 4;
          const boxC1 = c0 + 5;

          ws.mergeCells(boxR0, boxC0, boxR1, boxC1);
          const pctCell = ws.getCell(boxR0, boxC0);
          pctCell.value = `${pct}%`;
          applyCellStyle(pctCell, 16, true, 'center');

          for (let r = boxR0; r <= boxR1; r++) {
            for (let c = boxC0; c <= boxC1; c++) {
              const cell = ws.getCell(r, c);
              const b = cell.border || {};
              cell.border = {
                ...b,
                top: r === boxR0 ? { style: 'medium' } : b.top,
                bottom: r === boxR1 ? { style: 'medium' } : b.bottom,
                left: c === boxC0 ? { style: 'medium' } : b.left,
                right: c === c1 ? { style: 'medium' } : b.right,
              };
            }
          }
        });
      }

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Servizi_VVF_A3_${selectedDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Excel Export Error:', err);
      alert("Si è verificato un errore durante l'esportazione dell'Excel.");
    }
  };

  const updateAssignment = (eventId: string, reqIndex: number, slotIndex: number, operatorId: string | null) => {
    if (dayApprovedState) return;
    
    const userGroup = role.startsWith('COMPILATORE') ? role.split('_')[1] : null;

    setEvents(prev => prev.map(ev => {
      if (ev.id !== eventId) return ev;
      const newReqs = [...ev.requirements];
      const targetReq = { ...newReqs[reqIndex] };
      
      const newAssigned = [...targetReq.assignedIds];
      newAssigned[slotIndex] = operatorId;
      targetReq.assignedIds = newAssigned;
      
      // Registra chi ha effettuato l'assegnazione
      if (!targetReq.assignedByGroups) targetReq.assignedByGroups = Array(targetReq.qty).fill(null);
      const newAssignedBy = [...targetReq.assignedByGroups];
      newAssignedBy[slotIndex] = operatorId ? userGroup : null;
      targetReq.assignedByGroups = newAssignedBy;
      
      if (!targetReq.entrustedGroups) targetReq.entrustedGroups = Array(targetReq.qty).fill(null);

      newReqs[reqIndex] = targetReq;

      const totalUnits = newReqs.reduce((sum, r) => sum + r.qty, 0);
      const filledUnits = newReqs.reduce((sum, r) => sum + r.assignedIds.filter(Boolean).length, 0);
      
      let newStatus = ev.status;
      if (filledUnits === totalUnits && totalUnits > 0) {
        newStatus = EventStatus.COMPLETATO;
      } else if (filledUnits > 0) {
        newStatus = EventStatus.IN_COMPILAZIONE;
      }

      return { ...ev, requirements: newReqs, status: newStatus };
    }));
  };

  const handleEntrust = (eventId: string, reqIndex: number, slotIndex: number, currentOwner: string) => {
    if (dayApprovedState) return;
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    const dayCode = getMainDayCode(new Date(event.date + 'T00:00:00'));
    const priorityChain = getPriorityChain(dayCode);
    const currentIndex = priorityChain.indexOf(currentOwner);
    const nextGroup = priorityChain[(currentIndex + 1) % priorityChain.length];

    setEvents(prev => prev.map(ev => {
      if (ev.id !== eventId) return ev;
      const newReqs = [...ev.requirements];
      const targetReq = { ...newReqs[reqIndex] };
      if (!targetReq.entrustedGroups) targetReq.entrustedGroups = Array(targetReq.qty).fill(null);
      const newEntrusted = [...targetReq.entrustedGroups];
      newEntrusted[slotIndex] = nextGroup;
      targetReq.entrustedGroups = newEntrusted;
      
      // Quando si passa la gestione, resettiamo per permettere al subentrante di scegliere.
      const newAssigned = [...targetReq.assignedIds];
      newAssigned[slotIndex] = null;
      targetReq.assignedIds = newAssigned;
      
      if (!targetReq.assignedByGroups) targetReq.assignedByGroups = Array(targetReq.qty).fill(null);
      const newAssBy = [...targetReq.assignedByGroups];
      newAssBy[slotIndex] = null;
      targetReq.assignedByGroups = newAssBy;

      newReqs[reqIndex] = targetReq;
      return { ...ev, requirements: newReqs };
    }));
    setAssignmentModal(null);
  };

  const handleRevokeEntrust = (eventId: string, reqIndex: number, slotIndex: number) => {
    if (dayApprovedState) return;
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    const dayCode = getMainDayCode(new Date(event.date + 'T00:00:00'));
    const priorityChain = getPriorityChain(dayCode);

    setEvents(prev => prev.map(ev => {
      if (ev.id !== eventId) return ev;
      const newReqs = [...ev.requirements];
      const targetReq = { ...newReqs[reqIndex] };
      if (!targetReq.entrustedGroups) return ev;
      
      const currentEntrusted = targetReq.entrustedGroups[slotIndex];
      const ownerIdx = priorityChain.indexOf(currentEntrusted!);
      const prevGroup = ownerIdx > 0 ? priorityChain[ownerIdx - 1] : null;
      
      if (!prevGroup) return ev;

      const newEntrusted = [...targetReq.entrustedGroups];
      newEntrusted[slotIndex] = prevGroup === priorityChain[0] ? null : prevGroup;
      targetReq.entrustedGroups = newEntrusted;
      
      newReqs[reqIndex] = targetReq;
      return { ...ev, requirements: newReqs };
    }));
  };

  const handleToggleNotifications = () => {
     setShowNotifications(!showNotifications);
  }

  const navigateDay = (direction: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + direction);
    const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setSelectedDate(formatted);
  };

  return (
    <div className="mx-auto p-3 lg:p-4 space-y-4 pb-32 transition-all duration-500 relative max-w-[1800px]">
      <div className="flex flex-col lg:flex-row gap-4 items-center bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm no-print relative z-30">
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => navigateDay(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-[#720000] transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="relative" ref={datePickerRef}>
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-3 text-[#720000] min-w-[200px] justify-center cursor-pointer hover:bg-slate-50 rounded-2xl transition-all p-2 group"
            >
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black tracking-tighter leading-none group-hover:scale-105 transition-transform">{formatDate(selectedDate).split('/')[0]}</span>
                <div className="flex flex-col">
                  <span className="text-[9px] font-light uppercase tracking-[0.2em] text-slate-500">{new Date(selectedDate + 'T00:00:00').toLocaleString('it-IT', { weekday: 'long' }).toUpperCase()}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-black uppercase tracking-widest leading-none">{new Date(selectedDate + 'T00:00:00').toLocaleString('it-IT', { month: 'long' }).toUpperCase()}</span>
                    <span className="text-[10px] font-black opacity-30 tracking-widest">{new Date(selectedDate + 'T00:00:00').getFullYear()}</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#720000] group-hover:w-1/2 transition-all duration-300"></div>
            </button>
            {showDatePicker && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 z-[70] mt-2 shadow-2xl">
                <CustomCalendar 
                  selectedDate={selectedDate} 
                  onSelect={(d) => { setSelectedDate(d); setShowDatePicker(false); }} 
                />
              </div>
            )}
          </div>

          <button 
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-[#720000] hover:bg-red-50 transition-all shadow-sm"
            title="Oggi"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>

          <button onClick={() => navigateDay(1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-[#720000] transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="h-8 w-px bg-slate-100 hidden lg:block"></div>
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-1.5 rounded-2xl shrink-0">
          <div className="flex items-center gap-1">
            <button onClick={() => toggleExpandAll(true)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:text-[#720000] text-slate-400 transition-all"><PanelBottomOpenIcon /></button>
            <button onClick={() => toggleExpandAll(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:text-[#720000] text-slate-400 transition-all"><PanelTopOpenIcon /></button>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="flex items-center gap-1">
            {[1, 0.7, 0.5].map(level => (
              <button key={level} onClick={() => setZoomLevel(level)} className={`px-2 h-8 rounded-lg text-[10px] font-black transition-all ${zoomLevel === level ? 'bg-[#720000] text-white' : 'text-slate-400 hover:bg-white'}`}>{level * 100}%</button>
            ))}
            <div className="ml-1 text-slate-300"><ZoomIcon /></div>
          </div>
        </div>
        <div className="h-8 w-px bg-slate-100 hidden lg:block"></div>
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          {Object.entries(summary).map(([key, value]) => {
            const val = value as { assigned: number; total: number };
            if (val.total === 0) return null; 
            return (
              <div key={key} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shrink-0">
                <span className="text-[10px] font-black text-[#720000] tracking-tighter w-6">{key}</span>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-900 leading-none">{val.assigned}/{val.total}</span>
                  <div className="w-10 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full ${val.assigned >= val.total && val.total > 0 ? 'bg-emerald-500' : 'bg-[#720000]'}`} style={{ width: `${val.total > 0 ? Math.min(100, (val.assigned / val.total) * 100) : 0}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex-1 lg:flex-none ml-auto flex items-center gap-3 border-l border-slate-100 pl-4">
             {role === 'APPROVATORE' && (
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Stato Giorno</span>
                    <span className={`text-[10px] font-black uppercase tracking-tighter leading-none ${dayApprovedState ? 'text-emerald-600' : 'text-[#720000]'}`}>
                      {dayApprovedState ? 'APPROVATO' : 'IN COMPILAZIONE'}
                    </span>
                  </div>
                  <button 
                    onClick={handleToggleDayApproval}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-offset-2 focus:ring-2 focus:ring-emerald-500 ${dayApprovedState ? 'bg-emerald-600' : 'bg-slate-300'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${dayApprovedState ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
             )}
             
             <button 
                onClick={handleDownloadExcel}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm active:scale-95"
             >
                <FileSpreadsheetIcon className="w-4 h-4" />
                <span className="hidden xl:inline">XLS</span>
             </button>

             <button 
                onClick={handleDownloadPDF}
                disabled={isPdfLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all disabled:opacity-50 shadow-sm active:scale-95"
             >
                {isPdfLoading ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <PdfIcon className="w-4 h-4" />
                )}
                <span className="hidden xl:inline">{isPdfLoading ? '...' : 'PDF'}</span>
             </button>

             {role !== 'APPROVATORE' && (
               <div className="relative" ref={reportMenuRef}>
                 <button 
                    onClick={() => setShowReportMenu(!showReportMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-[#720000] hover:text-white transition-all shadow-sm active:scale-95"
                 >
                    <ClipboardIcon className="w-4 h-4" />
                    <span className="hidden xl:inline">RAPP.</span>
                    <svg className={`w-3 h-3 transition-transform ${showReportMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                 </button>
                 {showReportMenu && (
                   <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[80] animate-in slide-in-from-top-2 zoom-in-95">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-3 py-2 border-b border-slate-50 mb-1">Genera Rapporto Servizio</p>
                      <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
                        {displayEvents.map(ev => (
                          <button 
                            key={ev.id}
                            onClick={() => { openRapportoPresenza(ev); setShowReportMenu(false); }}
                            className="w-full text-left px-3 py-3 rounded-xl hover:bg-[#720000] hover:text-white group transition-all"
                          >
                             <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-tight leading-none group-hover:text-white">{ev.code}</span>
                                <span className="text-[8px] font-bold opacity-60 uppercase tracking-tighter mt-1.5 group-hover:text-white/80">{ev.timeWindow}</span>
                             </div>
                          </button>
                        ))}
                        {displayEvents.length === 0 && (
                          <p className="text-[10px] text-slate-400 italic text-center py-6 uppercase font-black tracking-widest">Nessun servizio pianificato</p>
                        )}
                      </div>
                   </div>
                 )}
               </div>
             )}

             <button 
                onClick={handleToggleNotifications}
                className={`relative w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${showNotifications ? 'bg-[#720000] text-white border-[#720000]' : 'bg-white border-slate-200 text-slate-400 hover:text-[#720000] hover:border-[#720000]'}`}
             >
                <BellIcon className="w-5 h-5" />
                {uniqueEventDates.length > 0 && (
                   <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                )}
             </button>
        </div>
      </div>

      {showNotifications && (
        <div className="fixed top-24 right-6 w-80 bg-white shadow-2xl rounded-3xl border border-slate-100 p-6 z-[60] animate-in slide-in-from-right-4 zoom-in-95">
           <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Calendario Servizi</h3>
              <button onClick={() => setShowNotifications(false)} className="text-slate-300 hover:text-red-500 text-xl font-light">×</button>
           </div>
           <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-thin">
              {uniqueEventDates.map(date => (
                  <button 
                    key={date}
                    onClick={() => { setSelectedDate(date); setShowNotifications(false); }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between group ${date === selectedDate ? 'bg-[#720000] border-[#720000] text-white' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-red-200 hover:shadow-md'}`}
                  >
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest">{formatDate(date)}</span>
                        <span className={`text-[8px] font-bold uppercase tracking-tight ${date === selectedDate ? 'text-white/60' : 'text-slate-400'}`}>
                           {events.filter(e => e.date === date).length} Servizi Attivi
                        </span>
                     </div>
                     <div className={`w-6 h-6 rounded-full flex items-center justify-center ${date === selectedDate ? 'bg-white/20' : 'bg-white text-slate-300 group-hover:text-[#720000]'}`}>
                        <ChevronRight className="w-3 h-3" />
                     </div>
                  </button>
              ))}
           </div>
        </div>
      )}

      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,380px)] gap-6 items-start transition-transform duration-500 bg-white md:bg-transparent" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left', width: `${100 / zoomLevel}%` }}>
        {displayEvents.map(event => (
          <EventCard 
            key={event.id} 
            event={event} 
            role={role}
            dayApproved={dayApprovedState}
            isExpanded={expandedIds.includes(event.id)}
            onToggle={() => setExpandedIds(prev => prev.includes(event.id) ? prev.filter(id => id !== event.id) : [...prev, event.id])}
            onOpenAssignment={(roleName, reqIdx, slotIdx) => setAssignmentModal({ eventId: event.id, roleName, reqIndex: reqIdx, slotIndex: slotIdx })}
            onRemoveAssignment={(reqIdx, slotIdx) => updateAssignment(event.id, reqIdx, slotIdx, null)}
            onDeleteRequest={() => setDeleteRequest([event.id])}
            onEdit={() => onEditEvent(event)}
            completionPercent={getEventCompletion(event)}
            licenseAlert={getLicenseAlert(event)}
            allCalculatedHours={operatorsCalculatedHours}
          />
        ))}
      </div>

      {assignmentModal && (
        <AssignmentPopup 
          eventId={assignmentModal.eventId}
          roleName={assignmentModal.roleName}
          userRole={role}
          onClose={() => setAssignmentModal(null)}
          onAssign={(opId) => { updateAssignment(assignmentModal.eventId, assignmentModal.reqIndex, assignmentModal.slotIndex, opId); setAssignmentModal(null); }}
          onEntrust={(owner) => handleEntrust(assignmentModal.eventId, assignmentModal.reqIndex, assignmentModal.slotIndex, owner)}
          onRevokeEntrust={() => { handleRevokeEntrust(assignmentModal.eventId, assignmentModal.reqIndex, assignmentModal.slotIndex); }}
          assignedIds={events.find(e => e.id === assignmentModal.eventId)?.requirements[assignmentModal.reqIndex].assignedIds || []}
          slotIndex={assignmentModal.slotIndex}
          events={events}
          allCalculatedHours={operatorsCalculatedHours}
        />
      )}

      {deleteRequest && (
          <DeleteConfirmationModal 
            count={deleteRequest.length}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteRequest(null)}
          />
      )}
    </div>
  );
};

const getHeaderStyles = (type: VigilanceType | undefined) => {
  switch (type) {
    case 'STANDARD':
    case 'RINFORZI':
      return { bg: 'bg-[#A80505]', text: 'text-white' };
    case 'OLYMPIC_SPEC':
    case 'OLYMPIC_GENERIC':
      return { bg: 'bg-[#C9A40E]', text: 'text-slate-900' };
    default:
      return { bg: 'bg-[#A80505]', text: 'text-white' };
  }
}

const EventCard: React.FC<{
  event: OperationalEvent;
  role: UserRole;
  dayApproved: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onOpenAssignment: (role: string, idx: number, slotIdx: number) => void;
  onRemoveAssignment: (idx: number, slotIdx: number) => void;
  onDeleteRequest: () => void;
  onEdit: () => void;
  completionPercent: number;
  licenseAlert: string | null;
  allCalculatedHours: Record<string, number>;
}> = ({ event, role, dayApproved, isExpanded, onToggle, onOpenAssignment, onRemoveAssignment, onDeleteRequest, onEdit, completionPercent, licenseAlert, allCalculatedHours }) => {
  const currentCompilatoreGroup = role.startsWith('COMPILATORE') ? role.split('_')[1] : null;
  const isCompilatore = !!currentCompilatoreGroup;
  const isRedattore = role === 'REDATTORE';
  
  const dayCode = getMainDayCode(new Date(event.date + 'T00:00:00'));
  const priorityChain = getPriorityChain(dayCode);

  const durationStr = useMemo(() => {
    const parts = event.timeWindow.split(' - ');
    const [start, end] = parts;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let diff = (h2 * 60 + (m2 || 0)) - (h1 * 60 + (m1 || 0));
    if (diff <= 0) diff += 24 * 60;
    return Math.floor(diff / 60) + (diff % 60 > 0 ? 'h ' + (diff % 60) + 'm' : 'h');
  }, [event.timeWindow]);

  const headerStyle = getHeaderStyles(event.vigilanceType);

  const getLicenseBadge = (license?: string) => {
    if (!license) return null;
    const clean = license.trim().toUpperCase();
    let label = '';
    if (clean === '3') label = '3°';
    else if (clean === '4') label = '4°';
    else if (clean === '3 LIM.') label = '3 L.';
    else if (clean === '4 LIM.') label = '4 L.';
    
    if (!label) return null;
    
    return (
      <span className="px-1 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase leading-none shrink-0 ml-1">
        {label}
      </span>
    );
  };

  return (
    <div id={event.id} className={`bg-white rounded-xl shadow-md overflow-visible flex flex-col border transition-all print-card-break ${isExpanded ? 'ring-2 ring-slate-900/10' : ''} border-slate-100 relative z-10`}>
      <div className="flex h-14 shrink-0 border-b border-slate-50 relative group/header overflow-hidden rounded-t-xl">
        <div 
          className={`flex-1 ${headerStyle.bg} flex items-center px-4 gap-2 border-r border-white/10 relative transition-colors overflow-hidden pdf-no-overflow cursor-pointer`}
          onClick={onToggle}
        >
           <div className="flex flex-col min-w-0">
             <h3 className={`text-xl font-black ${headerStyle.text} uppercase tracking-tighter leading-none`}>{event.code}</h3>
             <div className="flex gap-1.5 mt-1.5 no-print">
               {event.vigilanceType === 'RINFORZI' && (
                 <span className="px-1.5 py-0.5 bg-white/20 text-white rounded text-[7px] font-black uppercase tracking-widest border border-white/30 leading-none">RINFORZI</span>
               )}
               {event.vigilanceType === 'OLYMPIC_SPEC' && (
                 <span className="px-1.5 py-0.5 bg-black/10 text-slate-900 rounded text-[7px] font-black uppercase tracking-widest border border-black/10 leading-none">SPECIALISTI</span>
               )}
             </div>
           </div>
        </div>

        <div className="w-20 bg-[#720000] flex flex-col items-center justify-center text-white px-1 shrink-0 pt-0.5">
           <span className="text-[7px] font-black leading-none opacity-80 uppercase tracking-widest mb-1">DURATA</span>
           <span className="text-lg font-black text-[#EBE81D] tracking-tighter leading-tight">{durationStr}</span>
        </div>
      </div>

      <div className={`flex-1 divide-y divide-slate-100 ${isExpanded ? 'block' : 'hidden'}`}>
        {event.requirements.map((req, reqIdx) => {
          if (req.qty === 0) return null; 
          return Array.from({ length: req.qty }).map((_, unitIdx) => {
            const assignedId = req.assignedIds[unitIdx];
            const operator = assignedId ? MOCK_OPERATORS.find(o => o.id === assignedId) : null;
            const entrustedTo = req.entrustedGroups?.[unitIdx];
            const slotOwner = entrustedTo || (priorityChain ? priorityChain[0] : 'A');
            const ownerIdx = priorityChain.indexOf(slotOwner);
            const immediatePredecessor = ownerIdx > 0 ? priorityChain[ownerIdx - 1] : null;

            // Logica di protezione: un compilatore può cancellare solo se è LUI che ha fatto l'inserimento
            const isOriginalAssigner = isCompilatore && req.assignedByGroups?.[unitIdx] === currentCompilatoreGroup;
            
            const canThisCompilatoreEdit = isCompilatore && (currentCompilatoreGroup === slotOwner || (entrustedTo && currentCompilatoreGroup === immediatePredecessor));

            let roleBg = "bg-slate-100";
            if (req.role === 'DIR') roleBg = "bg-[#EA9E8D]";
            if (req.role === 'CP') roleBg = "bg-[#A6D9F7]";
            if (req.role === 'VIG') roleBg = "bg-[#f1f3f5]";
            if (req.role === 'ALTRO') roleBg = "bg-slate-200";

            return (
              <div key={`${req.role}-${reqIdx}-${unitIdx}`} className="flex items-stretch border-b border-slate-50 last:border-b-0 min-h-[40px]" data-requirement-row="true">
                <div className={`w-24 px-1 ${roleBg} flex items-center justify-center shrink-0 border-r border-slate-200/30 overflow-hidden`}>
                   <span className="text-[9px] font-black text-slate-800 uppercase whitespace-nowrap text-center leading-tight tracking-tighter overflow-hidden" data-pdf-badge="true">
                     {operator ? operator.rank : req.role}
                   </span>
                </div>
                <div className="flex-1 flex items-center px-2 py-1 bg-white min-w-0 gap-2">
                  {operator ? (
                    <div className="flex items-center w-full min-w-0 gap-1.5 overflow-visible">
                       {/* PROTEZIONE: Il tasto rimuovi appare solo se l'utente attivo è il responsabile dell'inserimento */}
                       {isOriginalAssigner && !dayApproved && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); onRemoveAssignment(reqIdx, unitIdx); }} 
                           className="w-5 h-5 bg-red-50 text-[#720000] rounded-lg flex items-center justify-center hover:bg-[#A80505] hover:text-white transition-all no-print shrink-0 border border-red-200"
                         >
                           <span className="text-[12px] font-black leading-none">×</span>
                         </button>
                       )}
                       <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-visible flex-wrap">
                         <span className="text-[10px] font-black text-slate-950 uppercase pr-1 truncate pdf-no-truncate shrink-0">{operator.name}</span>
                         
                         <div className="flex items-center gap-1 overflow-visible scrollbar-hide shrink-0">
                            {getLicenseBadge(operator.tipoPatente)}
                            {operator.specializations?.map((spec, sIdx) => (
                              <span key={sIdx} className="px-1 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-bold uppercase tracking-tighter border border-slate-200 leading-none whitespace-nowrap shrink-0">
                                {spec}
                              </span>
                            ))}
                         </div>
                       </div>
                       
                       {/* NUOVA SEZIONE: Visualizzazione Carico Ore per Approvatore */}
                       {role === 'APPROVATORE' && (
                         <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-[9px] font-black text-amber-700 shrink-0 shadow-sm transition-all hover:bg-amber-100 cursor-help" title="Totale ore assegnate all'operatore">
                           <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/></svg>
                           <span className="font-mono">{allCalculatedHours[operator.id]}H</span>
                         </div>
                       )}
                    </div>
                  ) : (
                    <div className="flex items-center w-full gap-2">
                       {canThisCompilatoreEdit && !dayApproved && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); onOpenAssignment(req.role, reqIdx, unitIdx); }} 
                           className="w-5 h-5 bg-red-50 text-[#720000] hover:scale-110 transition-transform shrink-0 no-print flex items-center justify-center rounded-lg shadow-sm hover:bg-[#A80505] hover:text-white border border-red-200"
                         >
                           <UserPlusIcon className="w-3.5 h-3.5" />
                         </button>
                       )}
                       
                       {entrustedTo ? (
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded border ${entrustedTo === 'A' ? 'bg-red-50 border-red-100 text-red-600' : entrustedTo === 'B' ? 'bg-blue-50 border-blue-100 text-blue-600' : entrustedTo === 'C' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : entrustedTo === 'D' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50'}`}>
                             <div className={`w-1 h-1 rounded-full ${entrustedTo === 'A' ? 'bg-red-500' : entrustedTo === 'B' ? 'bg-blue-500' : entrustedTo === 'C' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                             <span className="text-[8px] font-black uppercase tracking-tighter whitespace-nowrap">Gr. {entrustedTo}</span>
                          </div>
                       ) : (
                          <span className="text-[8px] italic text-slate-300 font-medium uppercase tracking-tighter truncate pr-1">Vacante...</span>
                       )}
                    </div>
                  )}
                </div>
              </div>
            );
          });
        })}
      </div>

      <div className="p-2 bg-[#3A3835] border-t border-slate-50/10 flex flex-col shrink-0 min-h-[64px] justify-center overflow-visible rounded-b-xl relative z-20">
        <div className="flex items-center w-full px-2 gap-3 overflow-visible">
            <div className="flex flex-col shrink-0">
              <span className="text-[7px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">ORARIO SERVIZIO</span>
              <span className="text-lg font-black text-[#EBE81D] leading-none tracking-tighter whitespace-nowrap">{event.timeWindow}</span>
            </div>
            
            <div className="flex-1 flex flex-wrap gap-1.5 py-1 overflow-visible">
               {event.vehicles.filter(v => v.qty > 0).map((v, vIdx) => (
                 <div key={`${v.type}-${vIdx}`} className="relative group/vehicle px-3 py-1.5 bg-slate-800 rounded-lg text-[10px] font-black text-white border border-white/20 uppercase tracking-tighter shadow-sm shrink-0 cursor-help transition-all hover:bg-slate-700 overflow-visible">
                   {v.type.toUpperCase()}
                   {v.plate && (
                     <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 pointer-events-none opacity-0 invisible group-hover/vehicle:opacity-100 group-hover/vehicle:visible transition-all duration-200 z-[9999] transform translate-y-1 group-hover/vehicle:translate-y-0">
                       <div className="bg-slate-900 text-white px-3 py-2 rounded-xl shadow-2xl border border-white/20 flex flex-col items-center min-w-[120px] ring-4 ring-black/20">
                         <span className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1 whitespace-nowrap">TARGA</span>
                         <span className="text-[12px] font-mono font-black text-[#EBE81D] tracking-widest whitespace-nowrap">{v.plate}</span>
                         <div className="absolute top-[100%] left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900"></div>
                       </div>
                     </div>
                   )}
                 </div>
               ))}
            </div>

            <div className="flex items-center gap-1 shrink-0 no-print overflow-visible">
              {isRedattore && !dayApproved && (
                <>
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }} 
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-[#C9A40E] text-white/40 hover:text-slate-900 transition-all group/edit border border-white/5"
                    title="Modifica"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteRequest(); }} 
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-600 text-white/40 hover:text-white transition-all group/del border border-white/5"
                    title="Elimina"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {dayApproved ? (
              <div className="shrink-0 flex items-center gap-1.5 bg-emerald-600 px-2 py-1 rounded-lg border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <FlagIcon className="w-3 h-3 text-white" />
                <span className="text-[8px] font-black text-white uppercase">OK</span>
              </div>
            ) : (
              <PieChart percent={completionPercent} color="#EBE81D" alertMessage={licenseAlert} />
            )}
        </div>
      </div>
    </div>
  );
};

const AssignmentPopup: React.FC<{
  eventId: string; roleName: string; userRole: UserRole; onClose: () => void;
  onAssign: (id: string) => void; onEntrust: (currentOwner: string) => void; onRevokeEntrust: () => void;
  assignedIds: (string | null)[]; slotIndex: number; events: OperationalEvent[];
  allCalculatedHours: Record<string, number>;
}> = ({ eventId, roleName, userRole, onClose, onAssign, onEntrust, onRevokeEntrust, assignedIds, slotIndex, events, allCalculatedHours }) => {
  const [search, setSearch] = useState('');
  const [specFilters, setSpecFilters] = useState<string[]>([]);
  const [showSpecDropdown, setShowSpecDropdown] = useState(false);
  const specDropdownRef = useRef<HTMLDivElement>(null);
  const [sedePopupFilter, setSedePopupFilter] = useState('TUTTE');
  const [patenteFilter, setPatenteFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: 'subgroup' | 'assignedHours', direction: 'asc' | 'desc' }>({ key: 'assignedHours', direction: 'asc' });
  
  const event = events.find(e => e.id === eventId);
  const userGroup = userRole.startsWith('COMPILATORE') ? userRole.split('_')[1] : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (specDropdownRef.current && !specDropdownRef.current.contains(event.target as Node)) {
        setShowSpecDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const globallyAssignedIdsForDate = useMemo(() => {
    if (!event) return new Set<string>();
    const date = event.date;
    const assigned = new Set<string>();
    events.filter(ev => ev.date === date).forEach(ev => {
      ev.requirements.forEach(req => {
        req.assignedIds.forEach(id => {
          if (id) assigned.add(id);
        });
      });
    });
    return assigned;
  }, [events, event]);

  const entrustedTo = useMemo(() => {
    const specificReq = event?.requirements.find(r => r.role === roleName);
    return specificReq?.entrustedGroups?.[slotIndex];
  }, [event, roleName, slotIndex]);

  const dayCode = event ? getMainDayCode(new Date(event.date + 'T00:00:00')) : '';
  const { standard, extra } = selectableForVigilanza(dayCode);
  const priorityChain = getPriorityChain(dayCode);

  const groupOwner = useMemo(() => {
    if (entrustedTo) return entrustedTo;
    return priorityChain[0]; 
  }, [entrustedTo, priorityChain]);

  const immediatePredecessor = useMemo(() => {
    const idx = priorityChain.indexOf(groupOwner);
    return idx > 0 ? priorityChain[idx - 1] : null;
  }, [priorityChain, groupOwner]);
  
  const pool = useMemo(() => {
    const validSubgroups = new Set([...standard, ...extra]);

    let result = MOCK_OPERATORS.filter(op => op.qualification === roleName && op.available);
    
    result = result.filter(op => 
      standard.some(s => s.startsWith(op.group)) || 
      validSubgroups.has(op.subgroup) ||            
      op.group === 'EXTRA'                          
    );
    
    if (userGroup) {
      result = result.filter(op => op.group === userGroup || op.group === 'EXTRA');
    }
    
    if (search) result = result.filter(op => op.name.toLowerCase().includes(search.toLowerCase()));
    
    // Multi-select specialization filter logic
    if (specFilters.length > 0) {
      result = result.filter(op => {
        const opSpecs = op.specializations || [];
        const hasNone = opSpecs.length === 0;

        const matchesNone = specFilters.includes('NONE') && hasNone;
        const matchesOthers = specFilters.some(s => s !== 'NONE' && opSpecs.includes(s));

        return matchesNone || matchesOthers;
      });
    }

    if (sedePopupFilter !== 'TUTTE') result = result.filter(op => op.sede === sedePopupFilter);
    if (patenteFilter) result = result.filter(op => op.tipoPatente === patenteFilter);
    
    result.sort((a, b) => {
      const getPriority = (subgroup: string) => {
        if (standard.includes(subgroup)) return 1;
        if (extra.includes(subgroup)) return 2;
        return 3;
      };

      const pA = getPriority(a.subgroup);
      const pB = getPriority(b.subgroup);

      if (pA !== pB) return pA - pB;

      const valA = allCalculatedHours[a.id];
      const valB = allCalculatedHours[b.id];
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [roleName, search, userGroup, standard, extra, specFilters, sedePopupFilter, patenteFilter, sortConfig, allCalculatedHours]);

  const toggleSpecFilter = (spec: string) => {
    setSpecFilters(prev => 
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="w-full max-w-6xl bg-white p-6 relative z-10 shadow-2xl rounded-[2.5rem] flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-slate-100">
         <div className="mb-4 flex justify-between items-start border-b border-slate-50 pb-5">
            <div className="flex-1">
              <h3 className="text-xl font-black text-[#720000] uppercase tracking-tight translation-none leading-none">SELEZIONE {roleName}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${userGroup === 'A' ? 'bg-red-50 text-red-600 border border-red-100' : userGroup === 'B' ? 'bg-blue-50 text-blue-700 border border-blue-100' : userGroup === 'C' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : userGroup === 'D' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-50'}`}>Gruppo {userGroup}</span>
                <span className="text-slate-300 mx-1">•</span>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Compilatore Autorizzato</p>
                {userGroup !== groupOwner && (
                  <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg animate-in slide-in-from-left-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
                    <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest">In visione: Gestione Gruppo {groupOwner}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 mr-4">
              {userGroup !== groupOwner && entrustedTo && userGroup === immediatePredecessor && (
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRevokeEntrust(); }} 
                  className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-[#720000] text-[#720000] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:bg-red-50 active:scale-95"
                >
                  <RotateCcwIcon className="w-3.5 h-3.5" /> Annulla Passaggio
                </button>
              )}
              
              {userGroup === groupOwner && (
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEntrust(groupOwner); }} 
                  className="flex items-center gap-2 px-5 py-3 bg-[#720000] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-200 hover:bg-slate-900 active:scale-95 border border-white/10"
                >
                  <ShareIcon className="w-3.5 h-3.5" /> Passa a Gruppo {priorityChain[(priorityChain.indexOf(groupOwner) + 1) % priorityChain.length]}
                </button>
              )}
            </div>
            
            <button onClick={onClose} className="text-slate-300 hover:text-slate-500 text-2xl font-light leading-none">×</button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
             <input type="text" placeholder="Cerca nominativo..." value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold uppercase focus:outline-none focus:ring-4 focus:ring-red-100/50" />
             <select value={sedePopupFilter} onChange={e => setSedePopupFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-[10px] font-black uppercase focus:outline-none appearance-none cursor-pointer">
                <option value="TUTTE">Filtra Sede: Tutte</option>
                {ALL_SEDI.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
             <select value={patenteFilter} onChange={e => setPatenteFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-[10px] font-black uppercase focus:outline-none appearance-none cursor-pointer">
                <option value="">Filtra Patente: Tutte</option>
                {ALL_PATENTI.map(p => <option key={p} value={p}>Patente {p}</option>)}
             </select>
             
             {/* Multi-select for Specializations */}
             <div className="relative" ref={specDropdownRef}>
               <button 
                 type="button"
                 onClick={() => setShowSpecDropdown(!showSpecDropdown)}
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-[10px] font-black uppercase focus:outline-none text-left flex items-center justify-between"
               >
                 <span>
                    {specFilters.length === 0 ? 'Filtra Spec: Tutte' : `Spec. Selezionate: ${specFilters.length}`}
                 </span>
                 <svg className={`w-3 h-3 transition-transform ${showSpecDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
               </button>
               
               {showSpecDropdown && (
                 <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[110] animate-in slide-in-from-top-2 zoom-in-95 overflow-hidden">
                   <div className="max-h-60 overflow-y-auto scrollbar-thin">
                     <label className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
                       <input 
                         type="checkbox" 
                         checked={specFilters.includes('NONE')} 
                         onChange={() => toggleSpecFilter('NONE')}
                         className="w-4 h-4 rounded border-slate-300 text-[#720000] focus:ring-[#720000]"
                       />
                       <span className="text-[10px] font-black uppercase text-slate-600 group-hover:text-[#720000]">Nessuna Spec.</span>
                     </label>
                     <div className="h-px bg-slate-100 my-1 mx-2"></div>
                     {ALL_SPECIALIZATIONS.map(spec => (
                       <label key={spec} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
                         <input 
                           type="checkbox" 
                           checked={specFilters.includes(spec)} 
                           onChange={() => toggleSpecFilter(spec)}
                           className="w-4 h-4 rounded border-slate-300 text-[#720000] focus:ring-[#720000]"
                         />
                         <span className="text-[10px] font-black uppercase text-slate-600 group-hover:text-[#720000]">{spec}</span>
                       </label>
                     ))}
                   </div>
                   {specFilters.length > 0 && (
                      <button 
                        onClick={() => setSpecFilters([])} 
                        className="w-full mt-2 py-2 text-[9px] font-black uppercase text-[#720000] hover:bg-red-50 rounded-xl transition-colors border-t border-slate-50"
                      >
                        Reset Filtri
                      </button>
                   )}
                 </div>
               )}
             </div>
         </div>
         
         <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {userGroup !== groupOwner ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-amber-400 mb-4 shadow-sm border border-slate-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Slot in gestione al Gruppo {groupOwner}</h4>
                <p className="text-xs text-slate-400 font-medium text-center max-w-xs">Non disponi delle autorizzazioni per assegnare operatori a questo slot. Puoi revocare il passaggio se lo desideri.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 sticky top-0 bg-white z-10">
                  <div className="col-span-3">Nominativo</div>
                  <div className="col-span-2 cursor-pointer hover:text-[#720000]" onClick={() => setSortConfig({ key: 'subgroup', direction: sortConfig.key === 'subgroup' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                    Sottogruppo {sortConfig.key === 'subgroup' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </div>
                  <div className="col-span-2">Sede</div>
                  <div className="col-span-1 text-center">Patente</div>
                  <div className="col-span-2">Spec.</div>
                  <div className="col-span-2 text-right cursor-pointer hover:text-[#720000]" onClick={() => setSortConfig({ key: 'assignedHours', direction: sortConfig.key === 'assignedHours' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                    Carico {sortConfig.key === 'assignedHours' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </div>
                </div>
                {pool.map(op => {
                  const isAlreadyImpegnato = globallyAssignedIdsForDate.has(op.id);
                  const isSecondary = extra.includes(op.subgroup);
                  
                  return (
                    <div 
                      key={op.id} 
                      onClick={() => !isAlreadyImpegnato && onAssign(op.id)} 
                      className={`grid grid-cols-12 items-center p-3.5 border rounded-2xl transition-all ${isAlreadyImpegnato ? 'bg-slate-50/50 border-slate-100 opacity-60 cursor-not-allowed select-none grayscale-[0.5]' : 'bg-white border-slate-100 hover:bg-slate-50/80 cursor-pointer group shadow-sm'}`}
                    >
                      <div className="col-span-3 flex items-center gap-2 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${isAlreadyImpegnato ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                        <div className="flex flex-col min-w-0 ml-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-[11px] font-black uppercase truncate leading-tight ${isAlreadyImpegnato ? 'text-slate-400' : 'text-slate-900'}`}>{op.name}</p>
                            {isSecondary && (
                               <span className="text-[7px] bg-[#720000]/10 text-[#720000] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter shrink-0">Rientro</span>
                            )}
                          </div>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{op.rank}</span>
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center justify-start pl-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black border shadow-sm ${
                          op.group === 'A' ? 'bg-red-50 text-red-700 border-red-100' :
                          op.group === 'B' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          op.group === 'C' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          op.group === 'D' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-slate-800 text-white border-slate-900'
                        }`}>
                          {op.subgroup}
                        </span>
                      </div>
                      <div className="col-span-2">
                         <span className="text-[9px] font-black text-slate-500 uppercase truncate" title={op.sede}>{op.sede || 'N/D'}</span>
                      </div>
                      <div className="col-span-1 text-center">
                         <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-black border border-slate-200 uppercase">{op.tipoPatente || 'N/D'}</span>
                      </div>
                      <div className="col-span-2 flex flex-wrap gap-1">
                        {op.specializations?.slice(0, 2).map(s => (
                          <span key={s} className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter whitespace-nowrap border border-slate-200">{s}</span>
                        ))}
                        {op.specializations && op.specializations.length > 2 && (
                           <span className="text-[9px] font-black text-slate-300">+{op.specializations.length - 2}</span>
                        )}
                      </div>
                      <div className="col-span-2 text-right">
                        <span className={`text-sm font-black transition-colors ${isAlreadyImpegnato ? 'text-slate-300' : 'text-slate-900 group-hover:text-[#720000]'}`}>{allCalculatedHours[op.id]}h</span>
                      </div>
                    </div>
                  );
                })}
                {pool.length === 0 && (
                  <div className="py-20 text-center bg-slate-50/30 rounded-3xl border border-dashed border-slate-100">
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Nessun operatore disponibile per i criteri selezionati</p>
                  </div>
                )}
              </>
            )}
         </div>
         <div className="mt-6 pt-4 border-t border-slate-50">
            <button onClick={onClose} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Chiudi e Annulla</button>
         </div>
      </div>
    </div>
  );
};
