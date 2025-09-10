import { Contact } from './types';

export type NameOrder = 'firstLast' | 'lastFirst';

function safe(s?: string): string {
  return (s || '').trim();
}

export function displayName(contact: Contact, order: NameOrder): string {
  const first = safe(contact.firstName);
  const last = safe(contact.lastName);
  if (order === 'lastFirst') {
    if (first && last) return `${last}, ${first}`;
    return last || first;
  }
  // firstLast
  if (first && last) return `${first} ${last}`;
  return first || last;
}

export function compareContacts(a: Contact, b: Contact, order: NameOrder): number {
  const af = safe(a.firstName);
  const bf = safe(b.firstName);
  const al = safe(a.lastName);
  const bl = safe(b.lastName);
  if (order === 'lastFirst') {
    return al.localeCompare(bl) || af.localeCompare(bf);
  }
  // firstLast
  return af.localeCompare(bf) || al.localeCompare(bl);
}

