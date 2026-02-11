
/**
 * Logica Turnario Olimpico VVF
 * Algoritmo deterministico basato su ciclo di 32 step
 */

export const buildOlympicSequence = (): string[] => {
  const seq: string[] = [];
  for (let n = 1; n <= 8; n++) {
    seq.push(`A${n}`, `B${n}`, `C${n}`, `D${n}`);
  }
  return seq;
};

export const SEQ = buildOlympicSequence();
export const NEXT: Record<string, string> = { A: 'B', B: 'C', C: 'D', D: 'A' };
export const PREV: Record<string, string> = { A: 'D', B: 'A', C: 'B', D: 'C' };

// Valori di default richiesti
export const DEFAULT_SEED_DATE = '2026-01-01';
export const DEFAULT_SEED_CODE = 'B6';

export function toMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysDiff(date: Date, seedDate: Date): number {
  return Math.round((toMidnight(date).getTime() - toMidnight(seedDate).getTime()) / 86400000);
}

export function getMainDayCode(date: Date, seedDate: Date = new Date(DEFAULT_SEED_DATE), seedCode: string = DEFAULT_SEED_CODE): string {
  const seedIndex = SEQ.indexOf(seedCode);
  if (seedIndex === -1) throw new Error('Seed code non valido per la sequenza olimpica');
  const diff = daysDiff(date, seedDate);
  const i = ((seedIndex + diff) % SEQ.length + SEQ.length) % SEQ.length;
  return SEQ[i];
}

/**
 * Ritorna il codice del notturno.
 */
export function getMainNightCode(date: Date, seedDate: Date = new Date(DEFAULT_SEED_DATE), seedCode: string = DEFAULT_SEED_CODE): string {
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 1);
  return getMainDayCode(prev, seedDate, seedCode);
}

function prevNum(n: number): number {
  return ((n - 2 + 8) % 8) + 1;
}

/**
 * Calcola i gruppi selezionabili per la vigilanza.
 * Come richiesto, l'ordine è lo Standard (NEXT) seguito dagli Extra.
 * Per Giorno B (Feb 14) -> Standard C, Extra A (notturno prec), D, B. Sequence: C, A, D, B.
 */
export function selectableForVigilanza(mainDayCode: string) {
  const letter = mainDayCode[0];
  const num = parseInt(mainDayCode.slice(1), 10);
  const next = NEXT[letter];

  const standard = Array.from({ length: 8 }, (_, i) => `${next}${i + 1}`);
  let extra: string[] = [];
  
  if (letter === 'B') {
    extra = [`A${num}`, `D${prevNum(num)}`, `B${num}`];
  } else if (letter === 'A') {
    extra = [`D${prevNum(num)}`, `C${prevNum(num)}`, `A${num}`];
  } else if (letter === 'C') {
    extra = [`B${num}`, `A${num}`, `C${num}`];
  } else { // D
    extra = [`C${num}`, `B${num}`, `D${num}`];
  }

  // L'ordine corretto richiesto è Standard prima degli Extra (es. Feb 14: C-A-D-B)
  return { standard, extra, all: [...standard, ...extra] };
}

/**
 * Ritorna l'ordine di priorità dei gruppi (A, B, C, D) estraendolo da selectableForVigilanza.
 * Garantisce che l'ordine di compilazione segua esattamente quello del generatore.
 */
export function getPriorityChain(dayCode: string): string[] {
  const { all } = selectableForVigilanza(dayCode);
  const uniqueLetters: string[] = [];
  all.forEach(code => {
    const letter = code[0];
    if (!uniqueLetters.includes(letter)) {
      uniqueLetters.push(letter);
    }
  });
  return uniqueLetters;
}
