import { z } from 'zod';

// Current canonical Contact schema.
export const ContactSchema = z.object({
  id: z.string(), // uuid or stable string
  firstName: z.string().optional().default(''),
  lastName: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  email: z.string().optional().default(''),
  birthday: z.string().optional().default(''), // ISO date or ''
  company: z.string().optional().default(''),
  tags: z.array(z.string()).default([]),
  color: z.string().optional().default(''), // hex or ''
  createdAt: z.number().int().default(0),
  updatedAt: z.number().int().default(0),
});

export type Contact = z.infer<typeof ContactSchema>;

export const ContactListSchema = z.array(ContactSchema);

// Helper to coerce various legacy shapes into a Contact-ish object
export function coerceLegacyContact(raw: any): any {
  const out: any = { ...raw };

  // id coercion
  if (out.id == null) {
    // Try common legacy keys
    out.id = String(out.uuid ?? out._id ?? out.key ?? Date.now() + ':' + Math.random().toString(36).slice(2));
  } else {
    out.id = String(out.id);
  }

  // tags string -> array
  if (typeof out.tags === 'string') {
    out.tags = out.tags
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
  }
  if (!Array.isArray(out.tags)) out.tags = [];

  // normalize primitive fields
  ['firstName', 'lastName', 'phone', 'email', 'birthday', 'company', 'color'].forEach((k) => {
    if (out[k] == null) out[k] = '';
    else out[k] = String(out[k]);
  });

  // timestamps
  const now = Date.now();
  out.createdAt = Number.isFinite(out.createdAt) ? Number(out.createdAt) : now;
  out.updatedAt = Number.isFinite(out.updatedAt) ? Number(out.updatedAt) : now;

  return out;
}

