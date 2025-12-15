import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import DatabaseService from '../services/database';
import { CATEGORIES } from '../constants';

const screenWidth = Dimensions.get('window').width;

const ReportsScreen = () => {
  const [stats, setStats] = useState({
    totalDuration: 0,
    todayDuration: 0,
    totalDistractions: 0,
    totalSessions: 0,
    todaySessions: 0,
  });
  const [weekData, setWeekData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get general stats
      const statsData = await DatabaseService.getStats();
      setStats(statsData);

      // Get last 7 days data
      await loadWeekData();

      // Get category data
      await loadCategoryData();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadWeekData = async () => {
    try {
      const sessions = await DatabaseService.getLastWeekSessions();
      
      // Create data for last 7 days
      const last7Days = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const daySessions = sessions.filter(session => {
          const sessionDate = new Date(session.timestamp).toISOString().split('T')[0];
          return sessionDate === dateString;
        });
        
        const dayDuration = daySessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        
        last7Days.push({
          date: date.getDate(),
          duration: dayDuration,
        });
      }
      
      setWeekData(last7Days);
    } catch (error) {
      console.error('Error loading week data:', error);
    }
  };

  const loadCategoryData = async () => {
    try {
      const categoryStats = await DatabaseService.getSessionsByCategory();
      
      const pieData = Object.keys(categoryStats).map((categoryName, index) => {
        const category = CATEGORIES.find(cat => cat.name === categoryName) || CATEGORIES[4];
        return {
          name: categoryName,
          duration: categoryStats[categoryName].totalDuration,
          color: category.color,
          legendFontColor: '#333',
          legendFontSize: 12,
        };
      });
      
      setCategoryData(pieData);
    } catch (error) {
      console.error('Error loading category data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}s ${mins}dk`;
    }
    return `${mins}dk`;
  };

  const chartConfig = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#4ECDC4',
    },
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <Text style={styles.title}>Raporlar ve İstatistikler</Text>

        {/* General Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Bugün</Text>
            <Text style={styles.statValue}>{formatDuration(stats.todayDuration)}</Text>
            <Text style={styles.statSubtext}>{stats.todaySessions} seans</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Toplam</Text>
            <Text style={styles.statValue}>{formatDuration(stats.totalDuration)}</Text>
            <Text style={styles.statSubtext}>{stats.totalSessions} seans</Text>
          </View>

          <View style={[styles.statCard, styles.statCardFull]}>
            <Text style={styles.statLabel}>Toplam Dikkat Dağınıklığı</Text>
            <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
              {stats.totalDistractions}
            </Text>
          </View>
        </View>

        {/* Bar Chart - Last 7 Days */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Son 7 Gün - Odaklanma Süreleri</Text>
          {weekData.length > 0 ? (
            <BarChart
              data={{
                labels: weekData.map(item => item.date.toString()),
                datasets: [
                  {
                    data: weekData.map(item => item.duration || 0),
                  },
                ],
              }}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              yAxisSuffix=" dk"
              fromZero
              showValuesOnTopOfBars
            />
          ) : (
            <Text style={styles.noDataText}>Henüz veri yok</Text>
          )}
        </View>

        {/* Pie Chart - Categories */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Kategorilere Göre Dağılım</Text>
          {categoryData.length > 0 ? (
            <PieChart
              data={categoryData}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="duration"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <Text style={styles.noDataText}>Henüz veri yok</Text>
          )}
        </View>

        {/* Clear Data Button (for testing) */}
        <TouchableOpacity
          style={styles.clearButton}
          onPress={async () => {
            await DatabaseService.clearAllData();
            await loadData();
          }}
        >
          <Text style={styles.clearButtonText}>Tüm Verileri Temizle (Test)</Text>
        </TouchableOpacity>
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statCardFull: {
    width: '100%',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 5,
  },
  statSubtext: {
    fontSize: 12,
    color: '#999',
  },
  chartContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    paddingVertical: 40,
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ReportsScreen;
