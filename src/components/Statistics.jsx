// src/components/Statistics.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { getResourceFiles } from '../api.js';

export default function Statistics({ media, nomenclatures, t }) {
  const [resourceFiles, setResourceFiles] = useState([]);

  // Fetch resource files on mount
  useEffect(() => {
    getResourceFiles()
      .then(data => setResourceFiles(data.files || []))
      .catch(() => setResourceFiles([]));
  }, []);

  const stats = useMemo(() => {
    const tagFrequency = {};
    const typeDistribution = { video: 0, photo: 0 };

    let totalAnnotations = 0;
    let totalPhotoAnnotations = 0;
    let totalTags = 0;
    const usedNomenclatures = new Set();
    const unusedNomenclatures = [];

    // Calculate statistics
    media.forEach(item => {
      typeDistribution[item.type]++;

      if (item.annotations) {
        totalAnnotations += item.annotations.length;
        if (item.type === 'photo') {
          totalPhotoAnnotations += item.annotations.length;
        }
      }

      item.tags.forEach(tag => {
        totalTags++;
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
        usedNomenclatures.add(tag);
      });
    });

    // Unused nomenclatures
    nomenclatures.forEach(nom => {
      if (!usedNomenclatures.has(nom.label)) {
        unusedNomenclatures.push(nom);
      }
    });

    // Top 10 most used tags
    const mostUsedTags = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Averages
    const avgTagsPerMedia = media.length > 0 ? (totalTags / media.length).toFixed(1) : 0;
    const videoCount = media.filter(m => m.type === 'video').length;
    const photoCount = media.filter(m => m.type === 'photo').length;
    const avgAnnotationsPerVideo = videoCount > 0
      ? (totalAnnotations / videoCount).toFixed(1)
      : 0;
    const avgAnnotationsPerPhoto = photoCount > 0
      ? (totalPhotoAnnotations / photoCount).toFixed(1)
      : 0;

    return {
      totalMedia: media.length,
      totalNomenclatures: nomenclatures.length,
      totalAnnotations,
      totalTags,
      typeDistribution,
      mostUsedTags,
      unusedNomenclatures,
      avgTagsPerMedia,
      avgAnnotationsPerVideo,
      avgAnnotationsPerPhoto,
      usageRate: nomenclatures.length > 0
        ? ((usedNomenclatures.size / nomenclatures.length) * 100).toFixed(1)
        : 0
    };
  }, [media, nomenclatures]);

  // Calculate unused files (files in resources not used in media)
  const unusedFiles = useMemo(() => {
    // Get all filenames used in media (local files only, not external URLs)
    const usedFilenames = new Set();
    media.forEach(item => {
      if (item.filename && !item.filename.startsWith('http')) {
        usedFilenames.add(item.filename);
      }
    });

    // Filter resource files that are not used
    return resourceFiles.filter(file => !usedFilenames.has(file));
  }, [media, resourceFiles]);

  return (
    <div className="statistics-page oracle">
      <div className="header-row">
        <div>
          <h2>{t?.('statisticsTitle') || 'Statistiques'}</h2>
          <p>{t?.('statisticsSubtitle') || 'Vue d\'ensemble de votre bibliothèque'}</p>
        </div>
      </div>

      <div className="stats-grid">
        {/* Vue d'ensemble */}
        <div className="card stats-card">
          <h3>📊 Vue d'ensemble</h3>
          <div className="stat-row">
            <span className="stat-label">Ressources totales</span>
            <span className="stat-value">{stats.totalMedia}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Vidéos</span>
            <span className="stat-value accent-purple">{stats.typeDistribution.video}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Photos</span>
            <span className="stat-value accent-green">{stats.typeDistribution.photo}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Nomenclatures</span>
            <span className="stat-value">{stats.totalNomenclatures}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Annotations horodatées</span>
            <span className="stat-value">{stats.totalAnnotations}</span>
          </div>
        </div>

        {/* Moyennes */}
        <div className="card stats-card">
          <h3>📈 Moyennes</h3>
          <div className="stat-row">
            <span className="stat-label">Tags par ressource</span>
            <span className="stat-value">{stats.avgTagsPerMedia}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Annotations par photo</span>
            <span className="stat-value">{stats.avgAnnotationsPerPhoto}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Annotations par vidéo</span>
            <span className="stat-value">{stats.avgAnnotationsPerVideo}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Taux d'utilisation</span>
            <span className="stat-value">{stats.usageRate}%</span>
          </div>
        </div>

        {/* Fichiers non utilisés */}
        <div className="card stats-card double-width">
          <h3>📁 Fichiers non utilisés</h3>
          {unusedFiles.length > 0 ? (
            <div className="unused-files-list">
              {unusedFiles.map(file => (
                <div key={file} className="unused-file-item">
                  <span className="file-name">{file}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted">Tous les fichiers sont utilisés</div>
          )}
        </div>

        {/* Top tags */}
        <div className="card stats-card full-width">
          <h3>🏆 Top 10 nomenclatures utilisées</h3>
          <div className="tag-frequency-list">
            {stats.mostUsedTags.map(({ tag, count }, index) => (
              <div key={tag} className="frequency-item">
                <span className="rank">#{index + 1}</span>
                <span className="badge">{tag}</span>
                <div className="frequency-bar">
                  <div 
                    className="frequency-fill" 
                    style={{ 
                      width: `${(count / stats.mostUsedTags[0].count) * 100}%` 
                    }}
                  />
                </div>
                <span className="count">{count}</span>
              </div>
            ))}
            {stats.mostUsedTags.length === 0 && (
              <div className="muted">Aucune nomenclature utilisée</div>
            )}
          </div>
        </div>

        {/* Unused nomenclatures */}
        {stats.unusedNomenclatures.length > 0 && (
          <div className="card stats-card">
            <h3>⚠️ Nomenclatures non utilisées</h3>
            <div className="unused-list">
              {stats.unusedNomenclatures.slice(0, 10).map(nom => (
                <span key={nom.id} className="badge badge--outline">
                  {nom.label}
                </span>
              ))}
              {stats.unusedNomenclatures.length > 10 && (
                <span className="muted">
                  +{stats.unusedNomenclatures.length - 10} autres
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}