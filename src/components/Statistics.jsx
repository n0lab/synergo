// src/components/Statistics.jsx
import React, { useMemo } from 'react';
import { parseTag } from '../utils/search.js';

export default function Statistics({ media, nomenclatures, t }) {
  const stats = useMemo(() => {
    const tagFrequency = {};
    const categoryDistribution = {};
    const typeDistribution = { video: 0, photo: 0 };
    
    let totalAnnotations = 0;
    let totalTags = 0;
    const usedNomenclatures = new Set();
    const unusedNomenclatures = [];

    // Calculer les statistiques
    media.forEach(item => {
      typeDistribution[item.type]++;
      
      if (item.annotations) {
        totalAnnotations += item.annotations.length;
      }
      
      item.tags.forEach(tag => {
        totalTags++;
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
        usedNomenclatures.add(tag);
        
        const parsed = parseTag(tag);
        if (parsed.category) {
          categoryDistribution[parsed.category] = 
            (categoryDistribution[parsed.category] || 0) + 1;
        }
      });
    });

    // Nomenclatures non utilisées
    nomenclatures.forEach(nom => {
      if (!usedNomenclatures.has(nom.label)) {
        unusedNomenclatures.push(nom);
      }
    });

    // Top 10 tags les plus utilisés
    const mostUsedTags = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Distribution par catégorie
    const categoryStats = Object.entries(categoryDistribution)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => ({ category, count }));

    // Moyennes
    const avgTagsPerMedia = media.length > 0 ? (totalTags / media.length).toFixed(1) : 0;
    const avgAnnotationsPerVideo = media.filter(m => m.type === 'video').length > 0
      ? (totalAnnotations / media.filter(m => m.type === 'video').length).toFixed(1)
      : 0;

    return {
      totalMedia: media.length,
      totalNomenclatures: nomenclatures.length,
      totalAnnotations,
      totalTags,
      typeDistribution,
      mostUsedTags,
      categoryStats,
      unusedNomenclatures,
      avgTagsPerMedia,
      avgAnnotationsPerVideo,
      usageRate: nomenclatures.length > 0 
        ? ((usedNomenclatures.size / nomenclatures.length) * 100).toFixed(1)
        : 0
    };
  }, [media, nomenclatures]);

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
            <span className="stat-label">Annotations par vidéo</span>
            <span className="stat-value">{stats.avgAnnotationsPerVideo}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Taux d'utilisation</span>
            <span className="stat-value">{stats.usageRate}%</span>
          </div>
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

        {/* Distribution par catégorie */}
        {stats.categoryStats.length > 0 && (
          <div className="card stats-card">
            <h3>📂 Distribution par catégorie</h3>
            <div className="category-list">
              {stats.categoryStats.map(({ category, count }) => (
                <div key={category} className="stat-row">
                  <span className="badge">{category}</span>
                  <span className="stat-value">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nomenclatures non utilisées */}
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