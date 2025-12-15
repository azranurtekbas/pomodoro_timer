import React, { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  AppState,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CATEGORIES, DEFAULT_POMODORO_TIME } from '../constants';
import DatabaseService from '../services/database';

const TimerScreen = () => {
  const [timeLeft, setTimeLeft] = useState(DEFAULT_POMODORO_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [distractionCount, setDistractionCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [customTime, setCustomTime] = useState(25);
  
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const sessionStartTime = useRef(null);
  const scheduledNotificationId = useRef(null);

  // AppState listener for distraction tracking
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Request notification permission and set handler
    (async () => {
      try {
        await Notifications.requestPermissionsAsync();
      } catch (e) {
        console.warn('Notification permission request failed', e);
      }
    })();

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    return () => {
      subscription.remove();
    };
  }, [isRunning]);

  // Timer effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const cancelScheduledNotification = async () => {
    if (scheduledNotificationId.current) {
      try {
        await Notifications.cancelScheduledNotificationAsync(scheduledNotificationId.current);
      } catch (e) {
        console.warn('Failed to cancel scheduled notification', e);
      }
      scheduledNotificationId.current = null;
    }
  };

  const scheduleNotification = async (body, seconds = 5) => {
    await cancelScheduledNotification();
    try {
      // Check permissions first
      const perms = await Notifications.getPermissionsAsync();
      if (!perms.granted && !perms.ios?.status === 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        if (!req.granted) {
          console.warn('Notification permission not granted');
          if (__DEV__) Alert.alert('Bildirim izni yok', 'Lütfen bildirim izinlerini etkinleştirin.');
          return;
        }
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Sayaç duraklatıldı',
          body,
          data: { type: 'paused' },
        },
        trigger: { seconds },
      });
      scheduledNotificationId.current = id;
      console.log('Scheduled notification id:', id);
      if (__DEV__) Alert.alert('Bildirim planlandı', `ID: ${id} — ${seconds}s sonra gösterilecek`);
    } catch (e) {
      console.warn('Failed to schedule notification', e);
      if (__DEV__) Alert.alert('Bildirim hata', String(e));
    }
  };

  const handleAppStateChange = async (nextAppState) => {
    // User leaves app while timer is running
    if (isRunning && appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
      setDistractionCount((prev) => prev + 1);
      setIsRunning(false);

      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Uygulamadan ayrıldınız',
            body: 'Seans duraklatıldı. Geri döndüğünüzde devam etmek ister misiniz yoksa sıfırlamak mı?',
            data: { type: 'paused-by-leave' },
          },
          trigger: { seconds: 5 },
        });
        scheduledNotificationId.current = id;
      } catch (e) {
        console.warn('Failed to schedule notification', e);
      }
    }

    // User returns to app from background/inactive
    if (appState.current.match(/inactive|background/) && nextAppState.match(/active/)) {
      await cancelScheduledNotification();

      if (!isRunning) {
        Alert.alert(
          'Uygulamaya Dönüldü',
          'Seansa devam etmek ister misiniz yoksa sıfırlamak mı?',
          [
            { text: 'Devam Et', onPress: () => setIsRunning(true) },
            { text: 'Sıfırla', onPress: () => resetTimer(), style: 'destructive' },
            { text: 'İptal', style: 'cancel' },
          ]
        );
      }
    }

    appState.current = nextAppState;
  };

  const handleTimerComplete = async () => {
    setIsRunning(false);
    await cancelScheduledNotification();
    const duration = Math.floor((customTime * 60 - timeLeft) / 60);
    setSessionDuration(duration);
    
    // Save session to database
    await saveSession(duration);
    setShowSummary(true);
  };

  const saveSession = async (duration) => {
    try {
      const sessionData = {
        category: selectedCategory.name,
        duration: duration,
        distractions: distractionCount,
        completedAt: new Date().toISOString(),
      };
      
      await DatabaseService.saveSession(sessionData);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const startTimer = async () => {
    // Cancel any scheduled notifications when resuming
    await cancelScheduledNotification();
    if (!isRunning) {
      sessionStartTime.current = Date.now();
      setIsRunning(true);
    }
  };

  const pauseTimer = async () => {
    if (isRunning) {
      setIsRunning(false);
      // Schedule a notification to remind the user after a short delay
      await scheduleNotification('Seans duraklatıldı. Geri döndüğünüzde devam etmek ister misiniz yoksa sıfırlamak mı?');
    }
  };

  const resetTimer = async () => {
    setIsRunning(false);
    await cancelScheduledNotification();
    setTimeLeft(customTime * 60);
    setDistractionCount(0);
    sessionStartTime.current = null;
  };

  const stopAndSave = async () => {
    setIsRunning(false);
    await cancelScheduledNotification();
    const duration = Math.floor((customTime * 60 - timeLeft) / 60);
    setSessionDuration(duration);
    await saveSession(duration);
    setShowSummary(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const closeSummary = () => {
    setShowSummary(false);
    resetTimer();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Pomodoro Zamanlayıcı</Text>

        {/* Category Picker */}
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Kategori Seçin:</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedCategory.id}
              onValueChange={(itemValue) => {
                const category = CATEGORIES.find((cat) => cat.id === itemValue);
                setSelectedCategory(category);
              }}
              style={styles.picker}
              enabled={!isRunning}
            >
              {CATEGORIES.map((category) => (
                <Picker.Item
                  key={category.id}
                  label={category.name}
                  value={category.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Time Adjustment */}
        <View style={styles.timeAdjustment}>
          <Text style={styles.label}>Süre (Dakika):</Text>
          <View style={styles.timeButtons}>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => {
                if (!isRunning && customTime > 5) {
                  setCustomTime(customTime - 5);
                  setTimeLeft((customTime - 5) * 60);
                }
              }}
              disabled={isRunning}
            >
              <Text style={styles.timeButtonText}>-5</Text>
            </TouchableOpacity>
            <Text style={styles.timeValue}>{customTime} dk</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => {
                if (!isRunning && customTime < 60) {
                  setCustomTime(customTime + 5);
                  setTimeLeft((customTime + 5) * 60);
                }
              }}
              disabled={isRunning}
            >
              <Text style={styles.timeButtonText}>+5</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Timer Display */}
        <View style={styles.timerContainer}>
          <View
            style={[
              styles.timerCircle,
              { borderColor: selectedCategory.color },
            ]}
          >
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>
        </View>

        {/* Distraction Counter */}
        <View style={styles.distractionContainer}>
          <Text style={styles.distractionLabel}>Dikkat Dağınıklığı:</Text>
          <Text style={styles.distractionCount}>{distractionCount}</Text>
        </View>

        {/* Control Buttons */}
        <View style={styles.buttonContainer}>
          {!isRunning ? (
            <TouchableOpacity
              style={[styles.button, styles.startButton]}
              onPress={startTimer}
            >
              <Text style={styles.buttonText}>Başlat</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.pauseButton]}
              onPress={pauseTimer}
            >
              <Text style={styles.buttonText}>Duraklat</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={resetTimer}
          >
            <Text style={styles.buttonText}>Sıfırla</Text>
          </TouchableOpacity>

          {isRunning && (
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={stopAndSave}
            >
              <Text style={styles.buttonText}>Bitir ve Kaydet</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Session Summary Modal */}
        <Modal
          visible={showSummary}
          animationType="slide"
          transparent={true}
          onRequestClose={closeSummary}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Seans Özeti</Text>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Kategori:</Text>
                <Text style={styles.summaryValue}>{selectedCategory.name}</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Süre:</Text>
                <Text style={styles.summaryValue}>{sessionDuration} dakika</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Dikkat Dağınıklığı:</Text>
                <Text style={styles.summaryValue}>{distractionCount}</Text>
              </View>

              <TouchableOpacity
                style={[styles.button, styles.startButton]}
                onPress={closeSummary}
              >
                <Text style={styles.buttonText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  picker: {
    height: 50,
  },
  timeAdjustment: {
    marginBottom: 30,
  },
  timeButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeButton: {
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  timeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 30,
    color: '#333',
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  timerCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  timerText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#333',
  },
  distractionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  distractionLabel: {
    fontSize: 18,
    color: '#666',
    marginRight: 10,
  },
  distractionCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4ECDC4',
  },
  pauseButton: {
    backgroundColor: '#FFA07A',
  },
  resetButton: {
    backgroundColor: '#95E1D3',
  },
  stopButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default TimerScreen;
