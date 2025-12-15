import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../constants';

// MongoDB ile bağlantı için servis katmanı
// Not: Bu bir placeholder'dır. Gerçek MongoDB bağlantısı için bir backend API gereklidir.

class DatabaseService {
  constructor() {
    this.storageKey = 'pomodoro_sessions';
  }

  // Oturum kaydetme
  async saveSession(sessionData) {
    try {
      const sessions = await this.getAllSessions();
      const newSession = {
        id: Date.now().toString(),
        ...sessionData,
        timestamp: new Date().toISOString(),
      };
      
      sessions.push(newSession);
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(sessions));
      
      // MongoDB'ye kaydetmek için backend API çağrısı
      // await this.syncToMongoDB(newSession);
      
      return newSession;
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  // Tüm oturumları getirme
  async getAllSessions() {
    try {
      const sessionsJson = await AsyncStorage.getItem(this.storageKey);
      return sessionsJson ? JSON.parse(sessionsJson) : [];
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  }

  // Bugünün oturumlarını getirme
  async getTodaySessions() {
    try {
      const sessions = await this.getAllSessions();
      const today = new Date().toDateString();
      return sessions.filter(session => {
        const sessionDate = new Date(session.timestamp).toDateString();
        return sessionDate === today;
      });
    } catch (error) {
      console.error('Error getting today sessions:', error);
      return [];
    }
  }

  // Son 7 günün oturumlarını getirme
  async getLastWeekSessions() {
    try {
      const sessions = await this.getAllSessions();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      return sessions.filter(session => {
        const sessionDate = new Date(session.timestamp);
        return sessionDate >= weekAgo;
      });
    } catch (error) {
      console.error('Error getting last week sessions:', error);
      return [];
    }
  }

  // Kategoriye göre oturumları getirme
  async getSessionsByCategory() {
    try {
      const sessions = await this.getAllSessions();
      const categoryStats = {};
      
      sessions.forEach(session => {
        const category = session.category || 'Diğer';
        if (!categoryStats[category]) {
          categoryStats[category] = {
            count: 0,
            totalDuration: 0,
          };
        }
        categoryStats[category].count += 1;
        categoryStats[category].totalDuration += session.duration || 0;
      });
      
      return categoryStats;
    } catch (error) {
      console.error('Error getting sessions by category:', error);
      return {};
    }
  }

  // İstatistikleri hesaplama
  async getStats() {
    try {
      const allSessions = await this.getAllSessions();
      const todaySessions = await this.getTodaySessions();
      
      const totalDuration = allSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
      const todayDuration = todaySessions.reduce((sum, session) => sum + (session.duration || 0), 0);
      const totalDistractions = allSessions.reduce((sum, session) => sum + (session.distractions || 0), 0);
      
      return {
        totalDuration,
        todayDuration,
        totalDistractions,
        totalSessions: allSessions.length,
        todaySessions: todaySessions.length,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalDuration: 0,
        todayDuration: 0,
        totalDistractions: 0,
        totalSessions: 0,
        todaySessions: 0,
      };
    }
  }

  // MongoDB'ye senkronizasyon (opsiyonel - backend API gerektirir)
  async syncToMongoDB(sessionData) {
    try {
      // Backend API'nize göre düzenleyin
      // const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SESSIONS}`, sessionData);
      // return response.data;
      console.log('MongoDB sync would happen here:', sessionData);
    } catch (error) {
      console.error('Error syncing to MongoDB:', error);
    }
  }

  // Tüm verileri temizleme (test için)
  async clearAllData() {
    try {
      await AsyncStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
}

export default new DatabaseService();
