// ─── User Image Cache (localStorage) ────────────────────────────────────────
// All images for a term are stored as ONE JSON object:
//   Key:   "user_images_<termId>"
//   Value: { "username1": "base64...", "username2": "base64...", ... }
//
// This keeps localStorage clean — one entry per term, not one per user.

const KEY = (termId) => `user_images_${termId}`;

// Internal: read the full map for a term (or empty object)
function readMap(termId) {
  try {
    const raw = localStorage.getItem(KEY(termId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Store all images for a term at once (called from Topics.js after fetch)
export function storeTermImages(termId, imageMap) {
  try {
    localStorage.setItem(KEY(termId), JSON.stringify(imageMap));
  } catch {
    // localStorage full — silently skip
  }
}

// Get a single user's image from whichever term cache has it
// termId is optional — if provided, only that term's cache is checked (faster)
export function getImage(username, termId) {
  if (!username) return null;
  if (termId) {
    return readMap(termId)[username] || null;
  }
  // Fallback: scan all user_images_* keys (covers navigation between terms)
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('user_images_')) {
      try {
        const map = JSON.parse(localStorage.getItem(k));
        if (map[username]) return map[username];
      } catch { /* skip */ }
    }
  }
  return null;
}

export function isTermPopulated(termId) {
  return !!localStorage.getItem(KEY(termId));
}

// Remove a single user's cached image (e.g. after they update their photo)
export function invalidateImage(username, termId) {
  if (termId) {
    const map = readMap(termId);
    if (map[username]) {
      delete map[username];
      storeTermImages(termId, map);
    }
  } else {
    // Remove from all term caches
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('user_images_')) {
        try {
          const map = JSON.parse(localStorage.getItem(k));
          if (map[username]) {
            delete map[username];
            localStorage.setItem(k, JSON.stringify(map));
          }
        } catch { /* skip */ }
      }
    }
  }
}
