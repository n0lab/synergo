// src/hooks/useKeyboardShortcuts.js
import { useEffect } from 'react';

/**
 * Hook to manage keyboard shortcuts
 * @param {Object} shortcuts - Object mapping keys to actions
 * @param {boolean} enabled - Enables or disables shortcuts
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
      // Ignore if we're in an input/textarea
      const target = event.target;
      const isInput = target.tagName === 'INPUT' || 
                     target.tagName === 'TEXTAREA' ||
                     target.isContentEditable;

      // Build the shortcut key
      const parts = [];
      if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
      if (event.altKey) parts.push('Alt');
      if (event.shiftKey) parts.push('Shift');
      parts.push(event.key);
      
      const key = parts.join('+');
      const action = shortcuts[key];

      // If we have an action and we're not in an input, execute it
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
 * Predefined keyboard shortcuts
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
