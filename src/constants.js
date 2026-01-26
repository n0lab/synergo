/**
 * Frontend constants and configuration
 */

// Media file extensions
export const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

// Media types
export const MEDIA_TYPES = {
  VIDEO: 'video',
  PHOTO: 'photo'
};

// Default values
export const DEFAULT_FPS = 30;
export const DEBOUNCE_DELAY = 300;
export const TOAST_DURATION = 5000;

// Theme options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
};

// Languages
export const LANGUAGES = {
  EN: 'en',
  FR: 'fr'
};

// Sections/Routes
export const SECTIONS = {
  ORACLE: 'oracle',
  NOMENCLATURES: 'nomenclatures',
  REVIEWER: 'reviewer',
  QUIZZ: 'quizz',
  STATISTICS: 'statistics',
  SETTINGS: 'settings',
  ADD_RESOURCE: 'add-resource'
};

// Type filters
export const TYPE_FILTERS = {
  ALL: 'all',
  VIDEO: 'video',
  PHOTO: 'photo'
};

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  SEARCH: 'Ctrl+k',
  NEW_RESOURCE: 'Ctrl+n',
  ESCAPE: 'Escape'
};

// API endpoints
export const API_BASE = '/api';

// Validation limits
export const LIMITS = {
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_TAGS: 50,
  MAX_ANNOTATIONS: 100,
  MAX_BULK_ITEMS: 100
};

export default {
  VIDEO_EXTENSIONS,
  IMAGE_EXTENSIONS,
  MEDIA_TYPES,
  DEFAULT_FPS,
  DEBOUNCE_DELAY,
  TOAST_DURATION,
  THEMES,
  LANGUAGES,
  SECTIONS,
  TYPE_FILTERS,
  KEYBOARD_SHORTCUTS,
  API_BASE,
  LIMITS
};
