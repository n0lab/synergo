// src/components/Settings.jsx
import React, { useRef, useState } from 'react';
import { exportDatabase, importDatabase, exportNomenclaturesToCSV } from '../utils/dataExport.js';

export default function Settings({ db, onImport, onReset, t }) {
  const fileInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleExportJSON = () => {
    try {
      exportDatabase(db);
    } catch (error) {
      console.error('Export error:', error);
      alert('Erreur lors de l\'export');
    }
  };

  const handleExportCSV = () => {
    try {
      exportNomenclaturesToCSV(db.nomenclatures);
    } catch (error) {
      console.error('Export CSV error:', error);
      alert('Erreur lors de l\'export CSV');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError('');

    try {
      const imported = await importDatabase(file);
      onImport?.(imported);
      alert('Import réussi !');
    } catch (error) {
      console.error('Import error:', error);
      setImportError(error.message);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReset = () => {
    if (showResetConfirm) {
      onReset?.();
      setShowResetConfirm(false);
      alert('Base de données réinitialisée');
    } else {
      setShowResetConfirm(true);
    }
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  return (
    <div className="settings-page oracle">
      <div className="header-row">
        <div>
          <h2>{t?.('settingsTitle') || 'Paramètres'}</h2>
          <p>{t?.('settingsSubtitle') || 'Gérez vos données et préférences'}</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Export */}
        <div className="card settings-section">
          <h3>📤 Export des données</h3>
          <p className="muted">
            Exportez votre bibliothèque pour la sauvegarder ou la partager
          </p>
          <div className="settings-actions">
            <button className="ghost success" onClick={handleExportJSON}>
              Export JSON complet
            </button>
            <button className="ghost" onClick={handleExportCSV}>
              Export nomenclatures (CSV)
            </button>
          </div>
          <div className="settings-info">
            <small className="muted">
              • JSON: Sauvegarde complète (média + nomenclatures + listes)<br/>
              • CSV: Nomenclatures uniquement pour Excel/Sheets
            </small>
          </div>
        </div>

        {/* Import */}
        <div className="card settings-section">
          <h3>📥 Import de données</h3>
          <p className="muted">
            Importez une sauvegarde précédente (format JSON)
          </p>
          <div className="settings-actions">
            <button 
              className="ghost info" 
              onClick={handleImportClick}
              disabled={isImporting}
            >
              {isImporting ? 'Import en cours...' : 'Importer un fichier'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
          {importError && (
            <div className="error-banner">
              Erreur d'import: {importError}
            </div>
          )}
          <div className="settings-info">
            <small className="muted">
              ⚠️ L'import remplacera toutes vos données actuelles
            </small>
          </div>
        </div>

        {/* Statistiques stockage */}
        <div className="card settings-section">
          <h3>💾 Stockage local</h3>
          <p className="muted">Informations sur votre base de données</p>
          <div className="storage-stats">
            <div className="stat-row">
              <span className="stat-label">Ressources</span>
              <span className="stat-value">{db.media?.length || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Nomenclatures</span>
              <span className="stat-value">{db.nomenclatures?.length || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Reviewer</span>
              <span className="stat-value">{db.reviewList?.length || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Quiz</span>
              <span className="stat-value">{db.quizzList?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Réinitialisation */}
        <div className="card settings-section danger-zone">
          <h3>⚠️ Zone dangereuse</h3>
          <p className="muted">
            Réinitialiser complètement la base de données
          </p>
          {showResetConfirm ? (
            <div className="confirm-reset">
              <p className="warning-text">
                ⚠️ Cette action est irréversible. Toutes vos données seront perdues.
              </p>
              <div className="settings-actions">
                <button className="ghost danger" onClick={handleReset}>
                  Confirmer la réinitialisation
                </button>
                <button className="ghost" onClick={cancelReset}>
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button className="ghost danger" onClick={handleReset}>
              Réinitialiser la base de données
            </button>
          )}
        </div>

        {/* Raccourcis clavier */}
        <div className="card settings-section full-width">
          <h3>⌨️ Raccourcis clavier</h3>
          <div className="shortcuts-grid">
            <div className="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>K</kbd>
              <span className="muted">Aller à Oracle</span>
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>N</kbd>
              <span className="muted">Nouvelle ressource</span>
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>S</kbd>
              <span className="muted">Sauvegarder (en édition)</span>
            </div>
            <div className="shortcut-item">
              <kbd>Escape</kbd>
              <span className="muted">Fermer / Retour</span>
            </div>
            <div className="shortcut-item">
              <kbd>←</kbd> / <kbd>→</kbd>
              <span className="muted">Frame précédente/suivante (vidéo)</span>
            </div>
            <div className="shortcut-item">
              <kbd>Space</kbd>
              <span className="muted">Play/Pause (vidéo)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}