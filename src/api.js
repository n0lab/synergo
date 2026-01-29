/**
 * API Client for Synergo backend
 */

const API_BASE = '/api';

async function fetchApi(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============ DATABASE OPERATIONS ============

export async function loadDatabase() {
  return fetchApi('/database');
}

export async function importDatabase(data) {
  return fetchApi('/database/import', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function resetDatabase() {
  return fetchApi('/database/reset', {
    method: 'POST',
  });
}

// ============ UPLOAD OPERATIONS ============

export async function getResourceFiles() {
  return fetchApi('/upload/files');
}

export async function uploadFile(file, filename) {
  const formData = new FormData();
  // IMPORTANT: filename must be appended BEFORE file for multer to read it
  // during the filename callback (multipart fields are processed sequentially)
  if (filename) {
    formData.append('filename', filename);
  }
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============ MEDIA OPERATIONS ============

export async function getAllMedia() {
  return fetchApi('/media');
}

export async function getMediaById(id) {
  return fetchApi(`/media/${encodeURIComponent(id)}`);
}

export async function createMedia(media) {
  return fetchApi('/media', {
    method: 'POST',
    body: JSON.stringify(media),
  });
}

export async function updateMedia(id, updates) {
  return fetchApi(`/media/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteMedia(id) {
  return fetchApi(`/media/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function getNextResourceNumber(datePrefix, sourcePrefix, subjectPrefix) {
  return fetchApi(`/media/next-id?datePrefix=${encodeURIComponent(datePrefix)}&sourcePrefix=${encodeURIComponent(sourcePrefix)}&subjectPrefix=${encodeURIComponent(subjectPrefix)}`);
}

// ============ NOMENCLATURES OPERATIONS ============

export async function getAllNomenclatures() {
  return fetchApi('/nomenclatures');
}

export async function createNomenclature(nomenclature) {
  return fetchApi('/nomenclatures', {
    method: 'POST',
    body: JSON.stringify(nomenclature),
  });
}

export async function syncNomenclature(nomenclature) {
  return fetchApi('/nomenclatures/sync', {
    method: 'POST',
    body: JSON.stringify(nomenclature),
  });
}

export async function updateNomenclature(id, updates) {
  return fetchApi(`/nomenclatures/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteNomenclature(id) {
  return fetchApi(`/nomenclatures/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ============ REVIEW LIST OPERATIONS ============

export async function getReviewList() {
  return fetchApi('/lists/review');
}

export async function addToReviewList(mediaId) {
  return fetchApi('/lists/review', {
    method: 'POST',
    body: JSON.stringify({ mediaId }),
  });
}

export async function addManyToReviewList(mediaIds) {
  return fetchApi('/lists/review/bulk', {
    method: 'POST',
    body: JSON.stringify({ mediaIds }),
  });
}

export async function removeFromReviewList(mediaId) {
  return fetchApi(`/lists/review/${encodeURIComponent(mediaId)}`, {
    method: 'DELETE',
  });
}

// ============ QUIZ LIST OPERATIONS ============

export async function getQuizList() {
  return fetchApi('/lists/quiz');
}

export async function addToQuizList(mediaId) {
  return fetchApi('/lists/quiz', {
    method: 'POST',
    body: JSON.stringify({ mediaId }),
  });
}

export async function addManyToQuizList(mediaIds) {
  return fetchApi('/lists/quiz/bulk', {
    method: 'POST',
    body: JSON.stringify({ mediaIds }),
  });
}

export async function removeFromQuizList(mediaId) {
  return fetchApi(`/lists/quiz/${encodeURIComponent(mediaId)}`, {
    method: 'DELETE',
  });
}
