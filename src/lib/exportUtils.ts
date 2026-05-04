import * as XLSX from 'xlsx';

/**
 * Exporte des données JSON vers un fichier Excel (XLSX)
 * @param data - Tableau d'objets JSON
 * @param fileName - Nom du fichier (sans extension)
 * @param sheetName - Nom de l'onglet
 */
export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Données') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Générer le fichier et déclencher le téléchargement
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Exporte des données JSON vers un fichier CSV
 */
export const exportToCSV = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
