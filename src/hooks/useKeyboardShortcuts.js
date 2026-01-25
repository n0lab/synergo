// src/hooks/useKeyboardShortcuts.js
import { useEffect } from 'react';

/**
 * Hook pour gérer les raccourcis clavier
 * @param {Object} shortcuts - Objet mappant les touches aux actions
 * @param {boolean} enabled - Active ou désactive les raccourcis
 * 
 * @example
 * useKeyboardShortcuts({
 *   'Ctrl+k': () => console.log('Search'),
 *   'Escape': () => closeModal(),
 *   'n': () => createNew(),
 * });
 */
export function useKeyboardShortcuts(shortcuts, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (event) => {
      // Ignore si on est dans un input/textarea
      const target = event.target;
      const isInput = target.tagName === 'INPUT' || 
                     target.tagName === 'TEXTAREA' ||
                     target.isContentEditable;

      // Construire la clé du raccourci
      const parts = [];
      if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
      if (event.altKey) parts.push('Alt');
      if (event.shiftKey) parts.push('Shift');
      parts.push(event.key);
      
      const key = parts.join('+');
      const action = shortcuts[key];

      // Si on a une action et qu'on n'est pas dans un input, l'exécuter
      if (action && (!isInput || key.includes('Ctrl') || key === 'Escape')) {
        event.preventDefault();
        action(event);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts, enabled]);
}

/**
 * Raccourcis clavier prédéfinis
 */
export const SHORTCUTS = {
  SEARCH: 'Ctrl+k',
  NEW: 'Ctrl+n',
  SAVE: 'Ctrl+s',
  CLOSE: 'Escape',
  HELP: '?',
  NEXT: 'ArrowRight',
  PREV: 'ArrowLeft',
};
