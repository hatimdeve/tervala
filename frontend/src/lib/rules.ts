// src/data/rules.ts
import { CleaningRule } from '../lib/callGpt';

export const mockRules: {
  id: number;
  name: string;
  description: string;
  type: 'predef' | 'ia';
  createdAt: Date;
  rule: CleaningRule;
}[] = [
  {
    id: 1,
    name: 'Supprimer les lignes avec TEST',
    description: 'Supprime les lignes contenant "TEST" dans la colonne Fournisseur',
    type: 'predef',
    createdAt: new Date('2023-03-01'),
    rule: {
      type: 'delete_rows',
      column: 'FOURNISSEUR',
      value: 'TEST'
    }
  },
  {
    id: 2,
    name: 'Supprimer les doublons sur Email',
    description: 'Supprime les doublons basés sur la colonne Email',
    type: 'predef',
    createdAt: new Date('2023-03-02'),
    rule: {
      type: 'deduplicate',
      column: 'Email'
    }
  }
];