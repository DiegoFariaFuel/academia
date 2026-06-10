import type { StatusAluno } from '../types/database';

export interface StudentImportRow {
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  plano: string;
  status: StatusAluno;
}

const VALID_STATUS = new Set<StatusAluno>(['ativo', 'inativo', 'suspenso', 'cancelado', 'bloqueado']);

function splitLine(line: string): string[] {
  if (line.includes(';')) return line.split(';').map((c) => c.trim());
  return line.split(',').map((c) => c.trim());
}

function parseStatus(raw: string | undefined): StatusAluno {
  const s = (raw ?? 'ativo').toLowerCase();
  if (VALID_STATUS.has(s as StatusAluno)) return s as StatusAluno;
  return 'ativo';
}

function rowFromCells(cells: string[]): StudentImportRow | null {
  const [nome, email, telefone, cpf, plano, statusRaw] = cells;
  if (!nome?.trim() || !email?.trim()) return null;
  if (!email.includes('@')) return null;

  return {
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    telefone: telefone?.trim() || null,
    cpf: cpf?.trim() || null,
    plano: (plano?.trim() || 'mensal').toLowerCase(),
    status: parseStatus(statusRaw),
  };
}

function isHeaderLine(cells: string[]): boolean {
  const joined = cells.join(' ').toLowerCase();
  return joined.includes('email') || joined.includes('e-mail') || joined.includes('nome');
}

export function parseStudentsCsv(text: string): { rows: StudentImportRow[]; errors: string[] } {
  const errors: string[] = [];
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], errors: ['empty'] };
  }

  const firstCells = splitLine(lines[0]);
  const hasHeader = isHeaderLine(firstCells);
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const rows: StudentImportRow[] = [];
  for (let i = 0; i < dataLines.length; i++) {
    const cells = splitLine(dataLines[i]);
    const row = rowFromCells(cells);
    if (row) {
      rows.push(row);
    } else if (cells.some((c) => c.length > 0)) {
      errors.push(`line:${hasHeader ? i + 2 : i + 1}`);
    }
  }

  return { rows, errors };
}

export function toInsertPayload(rows: StudentImportRow[], academiaId: string | null) {
  const due = new Date(Date.now() + 30 * 86400000).toISOString();
  return rows.map((r) => ({
    academia_id: academiaId,
    nome: r.nome,
    email: r.email,
    telefone: r.telefone,
    cpf: r.cpf,
    plano: r.plano,
    status: r.status,
    data_vencimento: due,
  }));
}
