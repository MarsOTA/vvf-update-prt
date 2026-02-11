import { OperationalEvent } from '../types';
import { MOCK_OPERATORS } from '../constants';

/**
 * Utility per generare il Rapporto Presenza (formato A4)
 */

const escapeHTML = (str: string) => {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[m] || m));
};

export const renderRapportoPresenza = (event: OperationalEvent): string => {
  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const calculateDurationStr = (timeWindow: string) => {
    const parts = timeWindow.split(' - ').map(s => s.trim());
    if (parts.length < 2) return '';
    const [start, end] = parts;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let diff = (h2 * 60 + (m2 || 0)) - (h1 * 60 + (m1 || 0));
    if (diff <= 0) diff += 24 * 60;
    const hrs = diff / 60;
    return Math.abs(hrs - Math.round(hrs)) < 1e-6 ? `${Math.round(hrs)}h.` : `${hrs.toFixed(1)}h.`;
  };

  const [startTime, endTime] = event.timeWindow.split(' - ').map(s => s.trim());
  const durationStr = calculateDurationStr(event.timeWindow);

  // Risoluzione dei nomi degli operatori assegnati
  const presenze = event.requirements.flatMap(req => 
    req.assignedIds.map((id, idx) => {
      const op = MOCK_OPERATORS.find(o => o.id === id);
      const qualifica = op?.rank || req.role;
      return {
        subgroup: op?.subgroup || '---',
        qual: qualifica,
        // Corretto bug: rimosso ${op.rank} dal campo nome
        nome: op ? op.name : (req.entrustedGroups?.[idx] ? `AFFIDATO GR. ${req.entrustedGroups[idx]}` : '---'),
        inServ: '', // Richiesto vuoto
        sost: ''
      };
    })
  );

  // Assicura almeno 3 righe vuote se necessario
  while (presenze.length < 3) {
    presenze.push({ subgroup: '', qual: '', nome: '', inServ: '', sost: '' });
  }

  const preventivoNum = "MIL-" + event.id.replace('EV-', '');
  const dataServizio = formatDate(event.date);

  return `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <title>Rapporto Presenza - ${event.code}</title>
      <style>
        @page { 
          size: A4; 
          margin: 30mm 25mm; /* 3cm superiore/inferiore, 2.5cm laterali */
        }
        body { font-family: 'Helvetica', Arial, sans-serif; font-size: 10pt; color: #000; line-height: 1.4; margin: 0; padding: 0; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .logo-container { margin-bottom: 15px; }
        .logo-img { height: 150px; width: auto; }
        .title-main { font-weight: 900; font-size: 16pt; text-transform: uppercase; margin: 0; }
        .title-sub { font-weight: 700; font-size: 14pt; text-decoration: underline; margin: 5px 0; }
        .meta-info { display: flex; justify-content: space-between; margin-bottom: 15px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .field-row { margin-bottom: 10px; }
        .label { font-weight: bold; text-transform: uppercase; margin-right: 5px; }
        .signature-block-top { display: flex; justify-content: space-between; margin: 20px 0; height: 60px; }
        .signature-line { border-top: 1px solid #000; width: 200px; margin-top: 40px; text-align: center; font-size: 8pt; }
        
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #000; padding: 6px; text-align: left; }
        th { background-color: #f0f0f0; text-transform: uppercase; font-size: 8pt; }
        
        /* Stili specifici per colonne con font ridotto */
        .col-small { font-size: 8pt; }

        .section-title { font-weight: bold; text-decoration: underline; text-transform: uppercase; margin-top: 15px; }
        .notes-area { border: 1px solid #000; height: 150px; margin-top: 5px; padding: 10px; }
        
        .footer-signatures { display: flex; justify-content: space-between; margin-top: 30px; }
        .final-footer { margin-top: 40px; border-top: 1px dashed #000; padding-top: 10px; font-size: 9pt; }
        
        .page-break { 
          page-break-before: always;
          break-before: page;
        }

        .no-print-btn { position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #720000; color: white; border: none; cursor: pointer; border-radius: 5px; font-weight: bold; }
        @media print { .no-print-btn { display: none; } }
      </style>
    </head>
    <body>
      <button class="no-print-btn" onclick="window.print()">STAMPA RAPPORTO</button>
      
      <div class="header">
        <div class="logo-container">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Emblem_of_Italy.svg/1200px-Emblem_of_Italy.svg.png" alt="Logo Repubblica Italiana" class="logo-img">
        </div>
        <p style="margin:0; font-weight: bold;">MINISTERO DELL'INTERNO</p>
        <p style="margin:0; font-size: 9pt;">DIPARTIMENTO DEI VIGILI DEL FUOCO, DEL SOCCORSO PUBBLICO E DELLA DIFESA CIVILE</p>
        <p style="margin:0; font-weight: bold;">COMANDO PROVINCIALE VIGILI DEL FUOCO MILANO</p>
        <h1 class="title-main">Servizio di Vigilanza Antincendio</h1>
        <h2 class="title-sub">RAPPORTO PRESENZA</h2>
      </div>

      <div class="meta-info">
        <span>Preventivo n° ${escapeHTML(preventivoNum)}</span>
        <span>Del ${escapeHTML(dataServizio)}</span>
      </div>

      <div class="field-row">
        <span class="label">LOCALE o SEDE:</span> ${escapeHTML(event.location)}
      </div>
      <div class="field-row">
        <span class="label">MANIFESTAZIONE:</span> ${escapeHTML(event.code)}
      </div>
      <div class="field-row">
        <span class="label">Data</span> ${escapeHTML(dataServizio)} &nbsp; - &nbsp; 
        <span class="label">durata presunta servizio:</span> ${escapeHTML(durationStr)} &nbsp; 
        <span class="label">Dalle</span> ${escapeHTML(startTime)}, <span class="label">Alle</span> ${escapeHTML(endTime)}
      </div>

      <div class="signature-block-top">
        <div>
          <p class="label">Firma Responsabile VVF</p>
          <div class="signature-line"></div>
        </div>
        <div>
          <p class="label">Firma del Richiedente</p>
          <div class="signature-line"></div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 10%">Turno</th>
            <th style="width: 15%">Qual</th>
            <th style="width: 45%">Cognome e Nome</th>
            <th style="width: 15%">Firma Dip.</th>
            <th style="width: 7%">In Serv</th>
            <th style="width: 8%">Sost.</th>
          </tr>
        </thead>
        <tbody>
          ${presenze.map(p => `
            <tr>
              <td class="col-small">${escapeHTML(p.subgroup)}</td>
              <td class="col-small">${escapeHTML(p.qual)}</td>
              <td style="text-transform: uppercase;">${escapeHTML(p.nome)}</td>
              <td></td>
              <td style="text-align:center">${p.inServ}</td>
              <td></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Pagina successiva per Note e Provvedimenti -->
      <div class="page-break"></div>

      <div class="section-title">Note da segnalare</div>
      <div class="notes-area"></div>

      <div class="section-title">Provvedimenti</div>
      <div class="notes-area"></div>

      <div class="footer-signatures">
        <div>
          <p class="label">Firma Responsabile Servizio</p>
          <div class="signature-line"></div>
        </div>
        <div>
          <p class="label">Firma del Richiedente</p>
          <div class="signature-line"></div>
        </div>
      </div>

      <div class="final-footer">
        <p><strong>RICHIESTA VERSAMENTO INTEGRATIVO:</strong> &nbsp;&nbsp; SI [ ] &nbsp;&nbsp;&nbsp; NO [ ]</p>
        <p style="margin-top: 20px;"><strong>FIRMA L'ADDETTO ALL'UFFICIO:</strong> ............................................................................</p>
      </div>

    </body>
    </html>
  `;
};

export const openRapportoPresenza = (event: OperationalEvent) => {
  const html = renderRapportoPresenza(event);
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
};