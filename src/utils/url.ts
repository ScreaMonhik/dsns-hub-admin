export const getFullUrl = (path?: string | null): string => {
  if (!path) return '';
  
  // Якщо шлях вже є абсолютним або це base64 data-URL, повертаємо як є
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  
  // Беремо базовий URL з конфігу і прибираємо слеш в кінці (якщо він там є)
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
  
  // Прибираємо слеш на початку шляху файлу (якщо він там є)
  const cleanPath = path.replace(/^\//, '');
  
  return `${baseUrl}/${cleanPath}`;
};