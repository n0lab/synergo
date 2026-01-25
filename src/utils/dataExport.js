// src/utils/dataExport.js

/**
 * Exports the database to a JSON file
 * @param {Object} db - The database to export
 * @param {string} filename - File name (optional)
 */
export function exportDatabase(db, filename = null) {
  const timestamp = new Date().toISOString().split('T')[0];
  const defaultFilename = `synergo-backup-${timestamp}.json`;
  
  const dataStr = JSON.stringify(db, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Imports a database from a JSON file
 * @param {File} file - The file to import
 * @returns {Promise<Object>} The imported database
 */
export function importDatabase(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        
        // Basic validation
        if (!imported.media || !Array.isArray(imported.media)) {
          throw new Error('Format de fichier invalide: média manquant');
        }
        
        if (!imported.nomenclatures || !Array.isArray(imported.nomenclatures)) {
          throw new Error('Format de fichier invalide: nomenclatures manquantes');
        }
        
        resolve(imported);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erreur de lecture du fichier'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Exports nomenclatures only to CSV
 * @param {Array} nomenclatures - List of nomenclatures
 */
export function exportNomenclaturesToCSV(nomenclatures) {
  const headers = ['Label', 'Description', 'Interprétation'];
  const rows = nomenclatures.map(n => [
    n.label,
    (n.description || '').replace(/"/g, '""'),
    (n.interpretation || '').replace(/"/g, '""')
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `nomenclatures-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Exports statistics to JSON
 * @param {Object} stats - The statistics to export
 */
export function exportStatistics(stats) {
  const dataStr = JSON.stringify(stats, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `synergo-stats-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}