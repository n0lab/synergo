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
      alert(t('settingsExportError'));
    }
  };

  const handleExportCSV = () => {
    try {
      exportNomenclaturesToCSV(db.nomenclatures);
    } catch (error) {
      console.error('Export CSV error:', error);
      alert(t('settingsExportCSVError'));
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
      alert(t('settingsImportSuccess'));
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
      alert(t('settingsDatabaseReset'));
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
          <h2>{t('settingsTitle')}</h2>
          <p>{t('settingsSubtitle')}</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Export */}
        <div className="card settings-section">
          <h3>{t('settingsExportTitle')}</h3>
          <p className="muted">
            {t('settingsExportDescription')}
          </p>
          <div className="settings-actions">
            <button className="ghost success" onClick={handleExportJSON}>
              {t('settingsExportJSON')}
            </button>
            <button className="ghost" onClick={handleExportCSV}>
              {t('settingsExportCSV')}
            </button>
          </div>
          <div className="settings-info">
            <small className="muted">
              {t('settingsExportInfo1')}<br/>
              {t('settingsExportInfo2')}
            </small>
          </div>
        </div>

        {/* Import */}
        <div className="card settings-section">
          <h3>{t('settingsImportTitle')}</h3>
          <p className="muted">
            {t('settingsImportDescription')}
          </p>
          <div className="settings-actions">
            <button
              className="ghost info"
              onClick={handleImportClick}
              disabled={isImporting}
            >
              {isImporting ? t('settingsImporting') : t('settingsImportButton')}
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
              {t('settingsImportError', { first: importError })}
            </div>
          )}
          <div className="settings-info">
            <small className="muted">
              {t('settingsImportWarning')}
            </small>
          </div>
        </div>

        {/* Storage statistics */}
        <div className="card settings-section">
          <h3>{t('settingsStorageTitle')}</h3>
          <p className="muted">{t('settingsStorageDescription')}</p>
          <div className="storage-stats">
            <div className="stat-row">
              <span className="stat-label">{t('settingsStorageResources')}</span>
              <span className="stat-value">{db.media?.length || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">{t('settingsStorageNomenclatures')}</span>
              <span className="stat-value">{db.nomenclatures?.length || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">{t('settingsStorageReview')}</span>
              <span className="stat-value">{db.reviewList?.length || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">{t('settingsStorageQuiz')}</span>
              <span className="stat-value">{db.quizzList?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Reset */}
        <div className="card settings-section danger-zone">
          <h3>{t('settingsDangerZone')}</h3>
          <p className="muted">
            {t('settingsDangerDescription')}
          </p>
          {showResetConfirm ? (
            <div className="confirm-reset">
              <p className="warning-text">
                {t('settingsDangerWarning')}
              </p>
              <div className="settings-actions">
                <button className="ghost danger" onClick={handleReset}>
                  {t('settingsConfirmReset')}
                </button>
                <button className="ghost" onClick={cancelReset}>
                  {t('settingsCancelButton')}
                </button>
              </div>
            </div>
          ) : (
            <button className="ghost danger" onClick={handleReset}>
              {t('settingsResetButton')}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
