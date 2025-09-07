import { Contact } from './types';

// Outlook-compatible CSV fields
const HEADERS = [
  'First Name',
  'Last Name',
  'E-mail Address',
  'Mobile Phone',
  'Company',
  'Birthday',
  'Categories',
] as const;

function csvEscape(value: string): string {
  const mustQuote = /[",\n\r]/.test(value);
  let v = value.replace(/"/g, '""');
  return mustQuote ? `"${v}"` : v;
}

function toMMDDYYYY(dateIso: string): string {
  try {
    const d = new Date(dateIso);
    if (isNaN(d.getTime())) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } catch {
    return '';
  }
}

export function contactsToOutlookCsv(contacts: Contact[]): string {
  const header = HEADERS.join(',');
  const rows = contacts.map((c) => {
    const row = [
      c.firstName || '',
      c.lastName || '',
      c.email || '',
      c.phone || '',
      c.company || '',
      c.birthday ? toMMDDYYYY(c.birthday) : '',
      (c.tags || []).join('; '),
    ];
    return row.map((v) => csvEscape(v)).join(',');
  });
  return [header, ...rows].join('\n');
}

// Lightweight CSV parser supporting RFC4180 quoting
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let i = 0;
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        cur += ch;
        i++;
        continue;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (ch === ',') {
        row.push(cur);
        cur = '';
        i++;
        continue;
      }
      if (ch === '\n') {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = '';
        i++;
        continue;
      }
      if (ch === '\r') {
        // handle CRLF or solo CR
        if (text[i + 1] === '\n') {
          // finalize on CRLF
          row.push(cur);
          rows.push(row);
          row = [];
          cur = '';
          i += 2;
          continue;
        } else {
          row.push(cur);
          rows.push(row);
          row = [];
          cur = '';
          i++;
          continue;
        }
      }
      cur += ch;
      i++;
    }
  }
  // finalize last cell/row
  row.push(cur);
  if (row.length === 1 && row[0] === '' && rows.length > 0) {
    // trailing newline produced an empty final row; ignore
  } else {
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

function normalizeHeader(h: string): string {
  const s = h.trim().toLowerCase();
  if (s.includes('first') && s.includes('name')) return 'firstName';
  if (s.includes('last') && s.includes('name')) return 'lastName';
  if (s.includes('email')) return 'email';
  if (s.includes('e-mail')) return 'email';
  if (s.includes('mobile') && s.includes('phone')) return 'phone';
  if (s === 'phone' || s === 'mobile') return 'phone';
  if (s.includes('company')) return 'company';
  if (s.includes('birthday') || s.includes('birth')) return 'birthday';
  if (s.includes('categor')) return 'tags'; // Category/Categories
  return s;
}

function parseBirthday(v: string): string | undefined {
  const t = v.trim();
  if (!t) return undefined;
  // try MM/DD/YYYY
  const md = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (md) {
    const mm = parseInt(md[1], 10) - 1;
    const dd = parseInt(md[2], 10);
    let yyyy = parseInt(md[3], 10);
    if (yyyy < 100) yyyy += 2000;
    const d = new Date(yyyy, mm, dd);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  // try Date.parse()
  const d = new Date(t);
  if (!isNaN(d.getTime())) return d.toISOString();
  return undefined;
}

export interface ParsedContactLike {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  birthday?: string;
  company?: string;
  tags: string[];
}

export function parseOutlookCsv(text: string): ParsedContactLike[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const headerRow = rows[0];
  const map: Record<number, string> = {};
  headerRow.forEach((h, i) => {
    map[i] = normalizeHeader(h);
  });
  const out: ParsedContactLike[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const obj: any = { tags: [] as string[] };
    for (let i = 0; i < row.length; i++) {
      const key = map[i];
      const val = row[i]?.trim?.() ?? '';
      if (!key) continue;
      switch (key) {
        case 'firstName':
          obj.firstName = val;
          break;
        case 'lastName':
          obj.lastName = val;
          break;
        case 'email':
          obj.email = val || undefined;
          break;
        case 'phone':
          obj.phone = val;
          break;
        case 'company':
          obj.company = val || undefined;
          break;
        case 'birthday':
          obj.birthday = parseBirthday(val);
          break;
        case 'tags': {
          // Categories separated by ; or ,
          const parts = val
            .split(/[;,]/)
            .map((t) => t.trim())
            .filter(Boolean);
          obj.tags = parts;
          break;
        }
        default:
          break;
      }
    }
    if (obj.firstName || obj.lastName || obj.email || obj.phone) {
      // normalize required fields
      obj.firstName = obj.firstName || '';
      obj.lastName = obj.lastName || '';
      obj.phone = obj.phone || '';
      obj.tags = obj.tags || [];
      out.push(obj as ParsedContactLike);
    }
  }
  return out;
}

