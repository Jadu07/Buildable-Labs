export const AVATAR_COLORS = [
  'E63946', '1D3557', '2A9D8F', 'D97706', '059669', '7C3AED',
  'DB2777', '4F46E5', '9333EA', 'C026D3', '0284C7', 'B45309',
  '15803D', 'BE123C', '3F6212', '0F766E'
];

export const stringToColor = (str: string) => {
  if (!str) return '#3E6AE1'; // Default fallback
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % AVATAR_COLORS.length;
  return '#' + AVATAR_COLORS[colorIndex];
};

export const getAvatarUrl = (name: string, email?: string) => {
  const identifier = email || name || 'User';
  return `https://api.dicebear.com/10.x/rings/svg?seed=${encodeURIComponent(identifier)}`;
};
