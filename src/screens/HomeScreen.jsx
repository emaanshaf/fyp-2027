import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, Dimensions, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, globalStyles } from '../theme';
import { getContextualDua } from '../data/duas';

const { width } = Dimensions.get('window');

const MODULES = [
  { id: 'quran',    title: 'Noble Quran',      desc: 'Read, listen & explore',        icon: 'book-outline',            color: '#d4af37', screen: 'Quran' },
  { id: 'hadith',   title: 'Hadith',           desc: 'Verified traditions',            icon: 'shield-checkmark-outline', color: '#10b981', screen: 'Hadith' },
  { id: 'prayer',   title: 'Prayer Times',     desc: 'Timings & Qibla',               icon: 'time-outline',            color: '#3b82f6', screen: 'Prayer' },
  { id: 'duas',     title: 'Daily Duas',       desc: 'Supplications for every need',  icon: 'heart-outline',           color: '#f43f5e', screen: 'Duas' },
  { id: 'zakat',    title: 'Zakat & Ushr',     desc: 'Calculate your dues',           icon: 'calculator-outline',      color: '#8b5cf6', screen: 'Zakat' },
  { id: 'tasbih',   title: 'Tasbih Counter',   desc: 'Digital dhikr companion',       icon: 'radio-button-on-outline', color: '#ec4899', screen: 'Tasbih' },
  { id: 'remind',   title: 'Reminders',        desc: 'Prayer & custom alerts',        icon: 'notifications-outline',   color: '#f59e0b', screen: 'Reminders' },
  { id: 'gen',      title: 'Content Creator',  desc: 'Design Islamic graphics',       icon: 'grid-outline',            color: '#06b6d4', screen: 'Generator' },
  { id: 'library',  title: 'My Library',       desc: 'Saved verses & notes',          icon: 'bookmark-outline',        color: '#a855f7', screen: 'Bookmarks' },
  { id: 'ai',       title: 'Islamic AI',       desc: 'Ask anything about Islam',      icon: 'chatbubbles-outline',     color: '#22d3ee', screen: 'AIChat' },
];

const getHijriDate = () => {
  try {
    return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date());
  } catch { return ''; }
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState('');
  const [hijriDate, setHijriDate] = useState('');
  const [nextPrayer, setNextPrayer] = useState({ name: '...', time: '--:--', remaining: '--:--:--' });
  const [timings, setTimings] = useState(null);
  const [contextDua] = useState(() => getContextualDua());
  const timerRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    AsyncStorage.getItem('qitab_user_name').then(n => setUserName(n || ''));
    setHijriDate(getHijriDate());
    fetchPrayer();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (!timings) return;
    timerRef.current = setInterval(updateCountdown, 1000);
    updateCountdown();
    return () => clearInterval(timerRef.current);
  }, [timings]);

  const fetchPrayer = async () => {
    try {
      const cached = await AsyncStorage.getItem('qitab_home_timings');
      const ts = await AsyncStorage.getItem('qitab_home_timings_ts');
      if (cached && ts && Date.now() - parseInt(ts) < 3600000) {
        setTimings(JSON.parse(cached)); return;
      }
      const res = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Islamabad&country=Pakistan&method=2');
      const data = await res.json();
      const t = data.data.timings;
      setTimings(t);
      await AsyncStorage.setItem('qitab_home_timings', JSON.stringify(t));
      await AsyncStorage.setItem('qitab_home_timings_ts', Date.now().toString());
    } catch {}
  };

  const updateCountdown = () => {
    if (!timings) return;
    const now = new Date();
    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    let next = null;
    for (const p of prayers) {
      const [h, m] = timings[p].split(':');
      const t = new Date(); t.setHours(+h, +m, 0, 0);
      if (t > now) { next = { name: p, date: t }; break; }
    }
    if (!next) {
      const [h, m] = timings['Fajr'].split(':');
      const t = new Date(); t.setDate(t.getDate() + 1); t.setHours(+h, +m, 0, 0);
      next = { name: 'Fajr', date: t };
    }
    const diff = next.date - now;
    const hh = Math.floor(diff / 3600000);
    const mm = Math.floor((diff % 3600000) / 60000);
    const ss = Math.floor((diff % 60000) / 1000);
    setNextPrayer({
      name: next.name,
      time: timings[next.name],
      remaining: `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
    });
  };

  const navigateTo = (screen) => {
    // Tab screens vs drawer screens
    const tabScreens = ['Quran', 'Prayer', 'Duas'];
    if (screen === 'Home') navigation.navigate('Home');
    else if (tabScreens.includes(screen)) navigation.navigate(screen);
    else navigation.getParent()?.navigate(screen);
  };

  const renderModule = ({ item }) => (
    <ModuleCard item={item} onPress={() => navigateTo(item.screen)} />
  );

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Hero */}
        <LinearGradient
          colors={['rgba(212,175,55,0.08)', 'transparent']}
          style={styles.hero}
        >
          <Text style={styles.greeting}>
            {getGreeting()}{userName ? `, ${userName}` : ''}
          </Text>
          <Text style={styles.welcomeText}>
            Welcome to <Text style={{ color: COLORS.gold }}>Qitab-e-Noor</Text>
          </Text>

          {hijriDate ? (
            <View style={[globalStyles.row, styles.dateChip]}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.gold} />
              <Text style={styles.dateText}>{hijriDate}</Text>
            </View>
          ) : null}
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          {/* Next Prayer */}
          <View style={[styles.statCard, { flex: 1 }]}>
            <View style={[globalStyles.spaceBetween, { marginBottom: 12 }]}>
              <View style={styles.statIconWrap}>
                <Ionicons name="time-outline" size={20} color={COLORS.gold} />
              </View>
              <Text style={styles.statLabel}>NEXT PRAYER</Text>
            </View>
            <Text style={styles.statValue}>{nextPrayer.name}</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 2 }}>
              at <Text style={{ color: '#fff', fontWeight: '700' }}>{nextPrayer.time}</Text>
            </Text>
            <View style={[globalStyles.row, { marginTop: 10, gap: 4 }]}>
              <Ionicons name="flash-outline" size={12} color={COLORS.emerald} />
              <Text style={{ color: COLORS.emerald, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                {nextPrayer.remaining}
              </Text>
            </View>
          </View>

          {/* Verse of Day */}
          <View style={[styles.statCard, { flex: 1 }]}>
            <View style={[globalStyles.spaceBetween, { marginBottom: 12 }]}>
              <View style={[styles.statIconWrap, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                <Ionicons name="star-outline" size={20} color={COLORS.emerald} />
              </View>
              <Text style={[styles.statLabel, { color: COLORS.emerald }]}>VERSE OF DAY</Text>
            </View>
            <Text style={{ color: '#f8fafc', fontStyle: 'italic', fontSize: 13, lineHeight: 20 }}>
              "Indeed, with hardship comes ease."
            </Text>
            <Text style={{ color: COLORS.gold, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 10 }}>
              ASH-SHARH 94:6
            </Text>
          </View>
        </View>

        {/* Contextual Dua — changes based on time of day / Friday */}
        {contextDua?.dua && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.duaCard]}
            onPress={() => navigateTo('Duas')}
          >
            <View style={[globalStyles.spaceBetween, { marginBottom: 14 }]}>
              <View style={[globalStyles.row, { gap: 8 }]}>
                <Ionicons name="heart" size={18} color="#f43f5e" />
                <Text style={{ color: COLORS.textPrimary, fontWeight: '800', fontSize: 15 }}>Dua for Right Now</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
            </View>
            <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '700', marginBottom: 10 }}>
              {contextDua.reason}
            </Text>
            <Text style={[styles.arabicDua]}>{contextDua.dua.arabic}</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 10 }}>
              "{contextDua.dua.translation}"
            </Text>
          </TouchableOpacity>
        )}

        {/* Modules */}
        <View style={styles.moduleSection}>
          <Text style={[globalStyles.sectionTitle, { paddingHorizontal: 20, marginBottom: 16 }]}>
            Explore Modules
          </Text>
          <FlatList
            data={MODULES}
            keyExtractor={i => i.id}
            renderItem={renderModule}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={{ paddingHorizontal: 12, gap: 12 }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        </View>
      </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ModuleCard({ item, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[styles.moduleCard, { borderBottomColor: item.color, borderBottomWidth: 3 }]}
      >
        <View style={[styles.moduleIcon, { backgroundColor: item.color + '18' }]}>
          <Ionicons name={item.icon} size={26} color={item.color} />
        </View>
        <Text style={styles.moduleTitle}>{item.title}</Text>
        <Text style={styles.moduleDesc}>{item.desc}</Text>
        <View style={[globalStyles.row, { marginTop: 12, gap: 4 }]}>
          <Text style={[styles.openLabel, { color: item.color }]}>OPEN</Text>
          <Ionicons name="chevron-forward" size={13} color={item.color} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 24,
    paddingBottom: 32,
  },
  greeting: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  welcomeText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    marginBottom: 14,
  },
  dateChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  dateText: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: COLORS.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 16,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: COLORS.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '900',
  },
  duaCard: {
    marginHorizontal: 16,
    marginBottom: 28,
    backgroundColor: COLORS.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 20,
  },
  arabicDua: {
    textAlign: 'right',
    writingDirection: 'rtl',
    color: COLORS.gold,
    fontSize: 20,
    lineHeight: 36,
  },
  moduleSection: {
    paddingBottom: 16,
  },
  moduleCard: {
    flex: 1,
    backgroundColor: COLORS.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 16,
    minHeight: 160,
  },
  moduleIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  moduleTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  moduleDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  openLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
