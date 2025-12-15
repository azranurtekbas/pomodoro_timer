// Constants for categories
export const CATEGORIES = [
  { id: '1', name: 'Ders Çalışma', color: '#FF6B6B' },
  { id: '2', name: 'Kodlama', color: '#4ECDC4' },
  { id: '3', name: 'Proje', color: '#45B7D1' },
  { id: '4', name: 'Kitap Okuma', color: '#FFA07A' },
  { id: '5', name: 'Diğer', color: '#95E1D3' },
];

// Default Pomodoro time in seconds (25 minutes)
export const DEFAULT_POMODORO_TIME = 25 * 60;

// API Configuration - MongoDB Atlas için backend API URL'inizi buraya ekleyin
export const API_CONFIG = {
  BASE_URL: 'YOUR_BACKEND_API_URL_HERE', // Örnek: 'https://your-api.herokuapp.com/api'
  ENDPOINTS: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    SESSIONS: '/sessions',
    STATS: '/stats',
  }
};
