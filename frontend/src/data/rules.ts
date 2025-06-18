// src/data/rules.ts
import { CleaningRule } from '../lib/callGpt';

export const predefinedRules: {
  id: number;
  name: string;
  description: string;
  type: 'predef' | 'ia';
  createdAt: Date;
  rule: CleaningRule;
}[] = [
  {
    id: 1,
    name: 'Supprimer les lignes contenant TEST dans Fournisseur',
    description: 'Supprime les lignes où la colonne "fournisseur" contient "TEST"',
    type: 'predef',
    createdAt: new Date('2023-01-01'),
    rule: {
      type: 'delete_rows',
      column: 'FOURNISSEUR',
      value: 'TEST',
    }
  },
  {
    id: 2,
    name: 'Dédupliquer les emails',
    description: 'Supprime les doublons basés sur la colonne Email',
    type: 'predef',
    createdAt: new Date('2023-01-02'),
    rule: {
      type: 'deduplicate',
      column: 'Email'
    }
  }
];