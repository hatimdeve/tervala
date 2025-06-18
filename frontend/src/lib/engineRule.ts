import { CleaningRule } from './callGpt';

export function applyRuleToData(data: string[][], rule: CleaningRule): string[][] {
  if (!Array.isArray(data) || data.length < 1) {
    throw new Error("📛 Données invalides ou fichier vide");
  }

  if (!rule || typeof rule.column !== 'string' || typeof rule.value !== 'string') {
    throw new Error("📛 Règle mal définie : colonne ou valeur manquante");
  }

  const targetColumn = rule.column.toLowerCase().trim();

  // Trouver l'index de la ligne contenant le nom de colonne (en mode insensible à la casse)
  const headerIndex = data.findIndex(row =>
    row.some(col => String(col).trim().toLowerCase() === targetColumn)
  );

  if (headerIndex === -1) {
    throw new Error(`📛 Colonne "${rule.column}" introuvable dans les données`);
  }

  const headerOriginal = data[headerIndex];
  const headerNormalized = headerOriginal.map(col => String(col).trim().toLowerCase());

  console.log("📌 Header détecté :", headerOriginal);
  console.log("📌 Header normalisé :", headerNormalized);
  console.log("📌 Colonne cible (normalisée) :", targetColumn);
  headerOriginal.forEach((col, i) => {
    console.log(`🔍 Col ${i}: "${col}" → "${String(col).toLowerCase().trim()}"`);
  });

  // Trouver l'index de la colonne ciblée
  console.log("📋 Colonnes disponibles (header original):");
  headerOriginal.forEach((col, i) => {
    console.log(`👉 Col ${i}: "${col}"`);
  });

  const colIndex = headerNormalized.findIndex(col => col === targetColumn);

  if (colIndex === -1) {
    throw new Error(`📛 Colonne "${rule.column}" non trouvée dans l'en-tête détecté : ${headerOriginal.join(', ')}`);
  }

  const rows = data.slice(headerIndex + 1);

  const filteredRows = rows.filter(row => {
    if (!Array.isArray(row)) return true;
    const cellValue = row[colIndex];
    return String(cellValue).toLowerCase().trim() !== rule.value!.toLowerCase().trim();
  });

  return [headerOriginal, ...filteredRows];
}