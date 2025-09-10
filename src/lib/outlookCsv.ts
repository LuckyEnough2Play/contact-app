import { Contact } from './types';

// Outlook full export header (commonly used by Import/Export wizard)
// Keeping the full set improves automatic field matching during Outlook import.
const OUTLOOK_FULL_HEADERS = [
  'Title',
  'First Name',
  'Middle Name',
  'Last Name',
  'Suffix',
  'Company',
  'Department',
  'Job Title',
  'Business Street',
  'Business Street 2',
  'Business Street 3',
  'Business City',
  'Business State',
  'Business Postal Code',
  'Business Country/Region',
  'Home Street',
  'Home Street 2',
  'Home Street 3',
  'Home City',
  'Home State',
  'Home Postal Code',
  'Home Country/Region',
  'Other Street',
  'Other Street 2',
  'Other Street 3',
  'Other City',
  'Other State',
  'Other Postal Code',
  'Other Country/Region',
  "Assistant's Phone",
  'Business Fax',
  'Business Phone',
  'Business Phone 2',
  'Callback',
  'Car Phone',
  'Company Main Phone',
  'Home Fax',
  'Home Phone',
  'Home Phone 2',
  'ISDN',
  'Mobile Phone',
  'Other Fax',
  'Other Phone',
  'Pager',
  'Primary Phone',
  'Radio Phone',
  'TTY/TDD Phone',
  'Telex',
  'Account',
  'Anniversary',
  "Assistant's Name",
  'Billing Information',
  'Birthday',
  'Business Address PO Box',
  'Categories',
  'Children',
  'Directory Server',
  'E-mail Address',
  'E-mail Type',
  'E-mail Display Name',
  'E-mail 2 Address',
  'E-mail 2 Type',
  'E-mail 2 Display Name',
  'E-mail 3 Address',
  'E-mail 3 Type',
  'E-mail 3 Display Name',
  'Gender',
  'Government ID Number',
  'Hobby',
  'Home Address PO Box',
  'Initials',
  'Internet Free Busy',
  'Keywords',
  'Language',
  'Location',
  "Manager's Name",
  'Mileage',
  'Notes',
  'Office Location',
  'Organizational ID Number',
  'Other Address PO Box',
  'Priority',
  'Private',
  'Profession',
  'Referred By',
  'Sensitivity',
  'Spouse',
  'User 1',
  'User 2',
  'User 3',
  'User 4',
  'Web Page',
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
  // Build rows following the full Outlook template; most fields empty
  const header = OUTLOOK_FULL_HEADERS.join(',');
  const rows = contacts.map((c) => {
    const line: string[] = new Array(OUTLOOK_FULL_HEADERS.length).fill('');
    // Map fields we manage
    const set = (name: (typeof OUTLOOK_FULL_HEADERS)[number], value: string | undefined) => {
      if (value == null) return;
      const idx = OUTLOOK_FULL_HEADERS.indexOf(name);
      if (idx >= 0) line[idx] = value;
    };
    set('First Name', c.firstName || '');
    set('Last Name', c.lastName || '');
    set('Company', c.company || '');
    set('Job Title', c.title || '');
    set('Mobile Phone', c.phone || '');
    set('E-mail Address', c.email || '');
    set('Birthday', c.birthday ? toMMDDYYYY(c.birthday) : '');
    set('Categories', (c.tags || []).join('; '));
    return line.map((v) => csvEscape(v)).join(',');
  });
  return [header, ...rows].join('\n');
}

// Detect delimiter by scanning the first non-empty line, considering quotes.
function detectDelimiter(text: string): ',' | ';' | '\t' {
  const firstLine = (text.match(/^[^\r\n]*/)?.[0] || '').trimEnd();
  if (!firstLine) return ',';
  const candidates: Array<{ d: ',' | ';' | '\t'; count: number }> = [
    { d: ',', count: 0 },
    { d: ';', count: 0 },
    { d: '\t', count: 0 },
  ];
  let inQuotes = false;
  for (let i = 0; i < firstLine.length; i++) {
    const ch = firstLine[i];
    if (ch === '"') {
      if (firstLine[i + 1] === '"') {
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes) {
      for (const c of candidates) if (ch === c.d) c.count++;
    }
  }
  candidates.sort((a, b) => b.count - a.count);
  return candidates[0].count > 0 ? candidates[0].d : ',';
}

// Lightweight CSV parser supporting RFC4180 quoting and common delimiters
function parseCsv(text: string): string[][] {
  const delimiter: string = detectDelimiter(text);
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
      if (ch === delimiter) {
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

  // email variants
  if ((s.includes('e-mail') || s.includes('email')) && s.includes('address')) {
    if (s.includes(' 2 ') || s.includes('2')) return 'email2';
    if (s.includes(' 3 ') || s.includes('3')) return 'email3';
    return 'email';
  }
  if (s === 'email' || s === 'e-mail') return 'email';

  // phone variants with precedence
  if (s.includes('mobile') && s.includes('phone')) return 'phone_mobile';
  if (s.includes('primary') && s.includes('phone')) return 'phone_primary';
  if (s.includes('business') && s.includes('phone')) return 'phone_business';
  if (s.includes('home') && s.includes('phone')) return 'phone_home';
  if (s.includes('other') && s.includes('phone')) return 'phone_other';
  if (s.includes('car') && s.includes('phone')) return 'phone_other';
  if (s.includes('company main') && s.includes('phone')) return 'phone_business';
  if (s === 'phone' || s === 'mobile') return 'phone';

  if (s.includes('company')) return 'company';
  if (s.includes('job') && s.includes('title')) return 'jobTitle';
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
  title?: string;
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
    let phoneRank = 99; // lower is better
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
        case 'email2':
          if (!obj.email && val) obj.email = val;
          break;
        case 'email3':
          if (!obj.email && val) obj.email = val;
          break;
        case 'phone': {
          const rank = 6;
          if (val && rank < phoneRank) {
            obj.phone = val;
            phoneRank = rank;
          }
          break;
        }
        case 'phone_mobile': {
          const rank = 1;
          if (val && rank < phoneRank) {
            obj.phone = val;
            phoneRank = rank;
          }
          break;
        }
        case 'phone_primary': {
          const rank = 2;
          if (val && rank < phoneRank) {
            obj.phone = val;
            phoneRank = rank;
          }
          break;
        }
        case 'phone_business': {
          const rank = 3;
          if (val && rank < phoneRank) {
            obj.phone = val;
            phoneRank = rank;
          }
          break;
        }
        case 'phone_home': {
          const rank = 4;
          if (val && rank < phoneRank) {
            obj.phone = val;
            phoneRank = rank;
          }
          break;
        }
        case 'phone_other': {
          const rank = 5;
          if (val && rank < phoneRank) {
            obj.phone = val;
            phoneRank = rank;
          }
          break;
        }
        case 'company':
          obj.company = val || undefined;
          break;
        case 'jobTitle':
          obj.title = val || undefined;
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
