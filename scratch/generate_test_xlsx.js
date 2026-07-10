const XLSX = require('xlsx');
const path = require('path');

const data = [
  {
    "Prénom": "Amadou",
    "Nom": "Traoré",
    "Genre": "M",
    "Matricule": "2026ST001",
    "DateNaissance": "2012-05-20",
    "Parent": "Ibrahim Traoré",
    "Telephone": "76543210",
    "Relation": "PÈRE",
    "CNI": "ML-12345"
  },
  {
    "Prénom": "Fatoumata",
    "Nom": "Koné",
    "Genre": "F",
    "Matricule": "2026ST002",
    "DateNaissance": "2013-10-15",
    "Parent": "Mariam Koné",
    "Telephone": "65432109",
    "Relation": "MÈRE",
    "CNI": "ML-67890"
  }
];

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

const filePath = path.join(__dirname, 'test_students.xlsx');
XLSX.writeFile(workbook, filePath);
console.log('File created at:', filePath);
