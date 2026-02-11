export type ScreenType = 'DASHBOARD' | 'STAFF' | 'CREAZIONE' | 'GENERATORE';

export type UserRole =
  | 'REDATTORE'
  | 'APPROVATORE'
  | 'COMPILATORE_A'
  | 'COMPILATORE_B'
  | 'COMPILATORE_C'
  | 'COMPILATORE_D';

export type VigilanceType = 'STANDARD' | 'RINFORZI' | 'OLYMPIC_SPEC' | 'OLYMPIC_GENERIC';

export enum EventStatus {
  IN_COMPILAZIONE = 'IN COMPILAZIONE',
  ATTESA_APPROVAZIONE = 'ATTESA APPROVAZIONE',
  APPROVATO = 'APPROVATO',
  CRITICO = 'CRITICO',
  COMPLETATO = 'COMPLETATO'
}

export interface VehicleEntry {
  type: string;
  plate: string;
  qty: number;
}

export interface PersonnelRequirement {
  role: 'DIR' | 'CP' | 'VIG' | 'ALTRO';
  qty: number;

  assignedIds: (string | null)[];                 // dimensione qty
  entrustedGroups?: (string | null)[];            // dimensione qty: 'A'|'B'|'C'|'D'|'VACANTE'|null
  entrustedByGroups?: (string | null)[];          // dimensione qty: chi ha passato (provenienza)
  assignedByGroups?: (string | null)[];           // dimensione qty: chi ha effettivamente inserito l'operatore

  specializations?: string[];
}

export interface OperationalEvent {
  id: string;
  code: string;
  location: string;
  date: string;
  timeWindow: string;
  status: EventStatus;
  vehicles: VehicleEntry[];
  requirements: PersonnelRequirement[];
  approvedByAdmin?: boolean;
  isOlympic?: boolean; // Mantenuto per compatibilità
  vigilanceType: VigilanceType;
  requiredSpecializations?: string[];
  createdBy?: string;
}

export interface Operator {
  id: string;
  name: string;
  rank: string;
  group: string; // A, B, C, D
  subgroup: string; // A1, A2...
  qualification: 'DIR' | 'CP' | 'VIG' | 'ALTRO';
  available: boolean;
  statusMessage?: string;
  unavailabilityEndDate?: string; // YYYY-MM-DD
  assignedHours: number;
  specializations?: string[];
  sede?: string;
  tipoPatente?: string;
}