import { EventStatus, OperationalEvent, Operator } from './types';

export const ALL_SEDI = [
  "SEDE CENTRALE",
  "DISTACCAMENTO RHO",
  "DISTACCAMENTO SESTO",
  "DISTACCAMENTO GORGONZOLA",
  "DISTACCAMENTO ABBIATEGRASSO",
  "DISTACCAMENTO LEGNANO"
];

export const ALL_PATENTI = [
  "1", "2", "3", "4", "1 LIM.", "2 LIM.", "3 LIM.", "4 LIM.", "AUT.ANFIBI"
];

export const ALL_SPECIALIZATIONS = [
  "TAS2", "NBCR", "NBCR L.2", "USR-M", "USR-L", "NBCR L.3", "SMZ", "M.TERRA", "CINO"
];

export const MOCK_OPERATORS: Operator[] = [
  // GRUPPO A
  { id: 'DIR-A1', name: 'VALENTI ROBERTO', rank: 'DIRIGENTE', group: 'A', subgroup: 'A1', qualification: 'DIR', available: true, assignedHours: 8, specializations: ['TAS2'], sede: 'SEDE CENTRALE', tipoPatente: '3' },
  { id: 'VIG-A1', name: 'LUCA BIANCHI', rank: 'VIGILE COORD.', group: 'A', subgroup: 'A1', qualification: 'VIG', available: true, assignedHours: 36, specializations: ['NBCR', 'SMZ'], sede: 'DISTACCAMENTO SESTO', tipoPatente: '4' },
  { id: 'VIG-A6', name: 'ZANCHI LUCA', rank: 'VIGILE DEL FUOCO', group: 'A', subgroup: 'A6', qualification: 'VIG', available: true, assignedHours: 12, specializations: ['USR-L'], sede: 'SEDE CENTRALE', tipoPatente: '3 LIM.' },
  { id: 'ALT-A1', name: 'MORO ALESSIO', rank: 'SPECIALISTA', group: 'A', subgroup: 'A1', qualification: 'ALTRO', available: true, assignedHours: 0, specializations: ['CINO'], sede: 'SEDE CENTRALE', tipoPatente: '2' },

  // GRUPPO B
  { id: 'VIG-B6', name: 'POZZI MARCO', rank: 'VIGILE DEL FUOCO', group: 'B', subgroup: 'B6', qualification: 'VIG', available: true, assignedHours: 4, specializations: ['TAS2'], sede: 'DISTACCAMENTO SESTO', tipoPatente: '4 LIM.' },
  { id: 'CP-B6', name: 'GENTILE FABRIZIO', rank: 'CAPO POSTAZIONE', group: 'B', subgroup: 'B6', qualification: 'CP', available: true, assignedHours: 12, specializations: ['NBCR L.2'], sede: 'SEDE CENTRALE', tipoPatente: '4' },

  // GRUPPO C
  { id: 'DIR-C1', name: 'MARTINA COLLI', rank: 'DIRIGENTE', group: 'C', subgroup: 'C1', qualification: 'DIR', available: true, assignedHours: 0, specializations: ['NBCR L.3'], sede: 'SEDE CENTRALE', tipoPatente: '3' },
  { id: 'CP-C1', name: 'GALLI FABRIZIO', rank: 'CAPO POSTAZIONE', group: 'C', subgroup: 'C1', qualification: 'CP', available: true, assignedHours: 8, specializations: ['USR-M'], sede: 'DISTACCAMENTO SESTO', tipoPatente: '4' },
  { id: 'VIG-C1', name: 'DANI COSTA', rank: 'VIGILE DEL FUOCO', group: 'C', subgroup: 'C1', qualification: 'VIG', available: true, assignedHours: 16, specializations: ['M.TERRA'], sede: 'DISTACCAMENTO GORGONZOLA', tipoPatente: '2' },
  { id: 'ALT-C2', name: 'BRIGHI ELENA', rank: 'SPECIALISTA', group: 'C', subgroup: 'C2', qualification: 'ALTRO', available: true, assignedHours: 4, specializations: ['CINO'], sede: 'SEDE CENTRALE', tipoPatente: '1' },

  // GRUPPO D
  { id: 'VIG-D5', name: 'KIM ROSSI', rank: 'VIGILE DEL FUOCO', group: 'D', subgroup: 'D5', qualification: 'VIG', available: true, assignedHours: 4, specializations: ['TAS2'], sede: 'SEDE CENTRALE', tipoPatente: '1' },
  { id: 'VIG-D6', name: 'COSTA DANIELE', rank: 'VIGILE DEL FUOCO', group: 'D', subgroup: 'D6', qualification: 'VIG', available: true, assignedHours: 16, specializations: ['NBCR'], sede: 'DISTACCAMENTO ABBIATEGRASSO', tipoPatente: '2' },

  // GRUPPO EXTRA
  { id: 'EXTRA-1', name: 'RIZZI GIOVANNI', rank: 'VIGILE DEL FUOCO', group: 'EXTRA', subgroup: 'N3', qualification: 'VIG', available: true, assignedHours: 0, specializations: ['TAS2', 'USR-M'], sede: 'SEDE CENTRALE', tipoPatente: '3' },
  { id: 'ALT-EXTRA-1', name: 'VERDI PAOLO', rank: 'SPECIALISTA', group: 'EXTRA', subgroup: 'EXTRA', qualification: 'ALTRO', available: true, assignedHours: 4, specializations: ['NBCR'], sede: 'DISTACCAMENTO LEGNANO', tipoPatente: '2' },
];

export const MOCK_EVENTS: OperationalEvent[] = [
  { 
    id: 'EV-RHO-01', 
    code: 'RHO HOKEY', 
    location: 'FIERA MILANO, RHO', 
    date: '2026-02-17',
    timeWindow: '08:00 - 20:00', 
    status: EventStatus.IN_COMPILAZIONE,
    vigilanceType: 'OLYMPIC_GENERIC',
    vehicles: [
      { type: 'aps', plate: 'VF 12345', qty: 2 },
      { type: 'as', plate: 'VF 67890', qty: 1 },
      { type: 'abp', plate: 'VF 54321', qty: 1 }
    ],
    requirements: [
      { role: 'DIR', qty: 1, assignedIds: Array(1).fill(null), entrustedGroups: Array(1).fill(null) },
      { role: 'CP', qty: 2, assignedIds: Array(2).fill(null), entrustedGroups: Array(2).fill(null) },
      { role: 'VIG', qty: 6, assignedIds: Array(6).fill(null), entrustedGroups: Array(6).fill(null) },
      { role: 'ALTRO', qty: 0, assignedIds: [], entrustedGroups: [] }
    ],
    approvedByAdmin: false,
    isOlympic: true
  }
];

export const STATUS_UI: Record<string, { color: string, text: string, label: string }> = {
  [EventStatus.IN_COMPILAZIONE]: { color: 'bg-orange-50 border-orange-200', text: 'text-orange-600', label: 'IN COMPILAZIONE' },
  [EventStatus.ATTESA_APPROVAZIONE]: { color: 'bg-blue-50 border-blue-200', text: 'text-blue-600', label: 'ATTESA APPROVAZIONE' },
  [EventStatus.APPROVATO]: { color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-600', label: 'APPROVATO' },
  [EventStatus.CRITICO]: { color: 'bg-red-50 border-red-200', text: 'text-red-600', label: 'CRITICO' },
  [EventStatus.COMPLETATO]: { color: 'bg-slate-50 border-slate-200', text: 'text-slate-600', label: 'COMPLETATO' },
};