export interface SportOption {
  id: string;
  name: string;
  category: 'team' | 'individual';
}

export const ILOPRISAA_SPORTS: SportOption[] = [
  // Team Sports
  { id: 'baseball', name: 'Baseball', category: 'team' },
  { id: 'basketball_5x5', name: 'Basketball (5x5)', category: 'team' },
  { id: 'basketball_3x3', name: 'Basketball (3x3)', category: 'team' },
  { id: 'beach_volleyball', name: 'Beach Volleyball', category: 'team' },
  { id: 'football', name: 'Football', category: 'team' },
  { id: 'sepaktakraw', name: 'Sepaktakraw', category: 'team' },
  { id: 'softball', name: 'Softball', category: 'team' },
  { id: 'volleyball', name: 'Volleyball', category: 'team' },

  // Individual Sports
  { id: 'archery', name: 'Archery', category: 'individual' },
  { id: 'athletics', name: 'Athletics', category: 'individual' },
  { id: 'badminton', name: 'Badminton', category: 'individual' },
  { id: 'billiards', name: 'Billiards', category: 'individual' },
  { id: 'boxing', name: 'Boxing', category: 'individual' },
  { id: 'chess', name: 'Chess', category: 'individual' },
  { id: 'dancesport', name: 'Dancesport', category: 'individual' },
  { id: 'gymnastics', name: 'Gymnastics', category: 'individual' },
  { id: 'karatedo', name: 'Karatedo', category: 'individual' },
  { id: 'swimming', name: 'Swimming', category: 'individual' },
  { id: 'table_tennis', name: 'Table Tennis', category: 'individual' },
  { id: 'taekwondo', name: 'Taekwondo', category: 'individual' },
  { id: 'tennis', name: 'Tennis', category: 'individual' },
  { id: 'weightlifting', name: 'Weightlifting', category: 'individual' },
];