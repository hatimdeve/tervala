import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export type DataRow = { [key: string]: any };

export async function parseFile(file: File): Promise<{ columns: string[]; data: DataRow[] }> {
  console.log("📥 [parseFile] Fichier reçu :", file.name);

  return new Promise((resolve, reject) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    reader.onload = () => {
      try {
        if (extension === 'csv') {
          const csvText = reader.result as string;
          const parsed = Papa.parse(csvText, { header: false });
          const rawRows = parsed.data as string[][];

          const header = rawRows[0].map(col => String(col).trim());
          const rows = rawRows.slice(1);

          const formattedData = rows.map(row => {
            const obj: DataRow = {};
            header.forEach((col, idx) => {
              obj[col] = row[idx];
            });
            return obj;
          });

          console.log("🧠 [parseFile] Header CSV détecté :", header);
          console.log("📊 [parseFile] Nombre de lignes CSV :", formattedData.length);
          console.log("📋 [parseFile] Exemple de données :", formattedData[0]);

          resolve({ columns: header, data: formattedData });
        } else if (extension === 'xlsx' || extension === 'xls') {
          const buffer = new Uint8Array(reader.result as ArrayBuffer);
          const workbook = XLSX.read(buffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
          const header1 = rawData[0]?.map(col => String(col).trim()) ?? [];
          const header2 = rawData[1]?.map(col => String(col).trim()) ?? [];

          const isValidHeader = (header1.length >= 2 && header1.includes('FOURNISSEUR')); 
          const header = isValidHeader ? header1 : header2;
          const rows = isValidHeader ? rawData.slice(1) : rawData.slice(2);

          const formattedData = rows.map(row => {
            const obj: DataRow = {};
            header.forEach((col, idx) => {
              obj[col] = row[idx];
            });
            return obj;
          });

          console.log("🧠 [parseFile] Header XLSX détecté :", header);
          console.log("📊 [parseFile] Nombre de lignes XLSX :", formattedData.length);
          console.log("📋 [parseFile] Exemple de données :", formattedData[0]);

          resolve({ columns: header, data: formattedData });
        } else {
          reject(new Error('❌ Type de fichier non supporté'));
        }
      } catch (error) {
        console.error("💥 [parseFile] Erreur :", error);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('❌ Erreur lors de la lecture du fichier'));
    };

    if (extension === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}