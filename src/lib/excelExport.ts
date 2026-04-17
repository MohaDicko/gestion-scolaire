import * as XLSX from 'xlsx';

/**
 * Exporte un tableau d'objets JSON en fichier Excel (.xlsx)
 * @param data Les données JSON à exporter
 * @param fileName Le nom du fichier de sortie
 * @param sheetName Le nom de la feuille (onglet)
 */
export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Sheet1') => {
  if (!data || data.length === 0) {
    alert('Aucune donnée à exporter.');
    return;
  }

  // Création de la feuille de calcul
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Stylisation basique des colonnes (Largeur)
  const wscols = Object.keys(data[0]).map(() => ({ wch: 15 }));
  worksheet['!cols'] = wscols;

  // Création du classeur
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Écriture du fichier et déclenchement du téléchargement
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
