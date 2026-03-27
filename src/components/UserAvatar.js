import React from 'react';
import '../styles/UserAvatar.css';
import { getImage } from '../cache/imageCache';

// termId is optional — speeds up lookup if you know which term to check

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#f43f5e', '#a855f7', '#0ea5e9', '#22c55e',
];

function colorForName(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

// username  — used to look up cache
// name      — first name (for initials + color)
// surname   — last name  (for initials + color)
// className — forwarded so parent CSS (.details-image, .liv-user-avatar, etc.) controls size
export default function UserAvatar({ username, name = '', surname = '', className = '', termId }) {
  const cached = getImage(username, termId);

  if (cached) {
    return (
      <img
        src={`data:image/jpeg;base64,${cached}`}
        alt={`${name} ${surname}`}
        className={className}
      />
    );
  }

  const initials = `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase() || '?';
  const bg = colorForName(name + surname);

  return (
    <div
      className={`ua-initials ${className}`}
      style={{ background: bg }}
      title={`${name} ${surname}`}
      aria-label={`${name} ${surname}`}
    >
      {initials}
    </div>
  );
}
