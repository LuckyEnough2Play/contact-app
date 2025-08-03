import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

import { Contact } from './types';

export const tagPool = ['Family', 'Work', 'Friends', 'Urgent', 'Gym', 'Clients'];

function randomTags(): string[] {
  const count = Math.floor(Math.random() * tagPool.length) + 1;
  const shuffled = [...tagPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomPhone() {
  return '555-' + Math.floor(1000000 + Math.random() * 9000000).toString();
}

function randomEmail(first: string, last: string) {
  return `${first.toLowerCase()}.${last.toLowerCase()}@example.com`;
}

const firstNames = [
  'Alice',
  'Bob',
  'Carol',
  'David',
  'Eve',
  'Frank',
  'Grace',
  'Heidi',
  'Ivan',
  'Judy',
  'Kevin',
  'Laura',
  'Mallory',
  'Niaj',
  'Olivia',
  'Peggy',
  'Quentin',
  'Rupert',
  'Sybil',
  'Trent',
];

const lastNames = [
  'Johnson',
  'Smith',
  'Williams',
  'Brown',
  'Davis',
  'Miller',
  'Wilson',
  'Moore',
  'Taylor',
  'Anderson',
  'Thomas',
  'Jackson',
  'White',
  'Harris',
  'Martin',
  'Thompson',
  'Garcia',
  'Martinez',
  'Robinson',
  'Clark',
];

export function generateSeedContacts(): Contact[] {
  const contacts: Contact[] = [];
  for (let i = 0; i < 20; i++) {
    const first = firstNames[i % firstNames.length];
    const last = lastNames[i % lastNames.length];
    contacts.push({
      id: uuid(),
      firstName: first,
      lastName: last,
      phone: randomPhone(),
      email: randomEmail(first, last),
      tags: randomTags(),
    });
  }

  // Ensure coverage for tag matching examples
  if (contacts.length >= 3) {
    contacts[0].tags = [...tagPool]; // all tags
    contacts[1].tags = [tagPool[0]]; // partial
    contacts[2].tags = []; // no overlap
  }

  return contacts;
}
