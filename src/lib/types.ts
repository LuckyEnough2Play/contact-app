export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  birthday?: string; // ISO string
  company?: string;
  title?: string;
  tags: string[];
}
