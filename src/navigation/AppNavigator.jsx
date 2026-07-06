import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS, globalStyles } from '../theme';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import QuranScreen from '../screens/QuranScreen';
import HadithScreen from '../screens/HadithScreen';
import DuasScreen from '../screens/DuasScreen';
import PrayerTimesScreen from '../screens/PrayerTimesScreen';
import ZakatScreen from '../screens/ZakatScreen';
import TasbihScreen from '../screens/TasbihScreen';
import RemindersScreen from '../screens/RemindersScreen';
import BookmarksScreen from '../screens/BookmarksScreen';
import GeneratorScreen from '../screens/GeneratorScreen';
import AIChatScreen from '../screens/AIChatScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

const TAB_SCREENS = [
  { name: 'Home', component: HomeScreen, icon: 'home-outline', activeIcon: 'home', label: 'Home' },
  { name: 'Quran', component: QuranScreen, icon: 'book-outline', activeIcon: 'book', label: 'Quran' },
  { name: 'Prayer', component: PrayerTimesScreen, icon: 'time-outline', activeIcon: 'time', label: 'Prayer' },
  { name: 'Duas', component: DuasScreen, icon: 'heart-outline', activeIcon: 'heart', label: 'Duas' },
];

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bgSecondary,
          borderTopColor: COLORS.glassBorder,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ focused, color, size }) => {
          const screen = TAB_SCREENS.find(s => s.name === route.name);
          const iconName = focused ? screen?.activeIcon : screen?.icon;
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      {TAB_SCREENS.map(s => (
        <Tab.Screen key={s.name} name={s.name} component={s.component} options={{ tabBarLabel: s.label }} />
      ))}
    </Tab.Navigator>
  );
}

function CustomDrawerContent(props) {
  const { navigation } = props;

  const handleLogout = async () => {
    await AsyncStorage.removeItem('qitab_user_name');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const drawerItems = [
    { name: 'Hadith', icon: 'shield-checkmark-outline', label: 'Authentic Hadith' },
    { name: 'Zakat', icon: 'calculator-outline', label: 'Zakat & Ushr' },
    { name: 'Tasbih', icon: 'radio-button-on-outline', label: 'Tasbih Counter' },
    { name: 'Reminders', icon: 'notifications-outline', label: 'Reminders' },
    { name: 'Generator', icon: 'grid-outline', label: 'Content Creator' },
    { name: 'Bookmarks', icon: 'bookmark-outline', label: 'My Library' },
    { name: 'AIChat', icon: 'chatbubbles-outline', label: 'Islamic AI' },
    { name: 'Settings', icon: 'settings-outline', label: 'Settings' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgSecondary }}>
      <View style={styles.drawerHeader}>
        <View style={styles.drawerLogoWrap}>
          <Ionicons name="moon" size={28} color={COLORS.gold} />
        </View>
        <Text style={styles.drawerTitle}>Qitab-e-Noor</Text>
        <Text style={styles.drawerSubtitle}>Your Spiritual Companion</Text>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs')}
          style={styles.drawerItem}
        >
          <Ionicons name="home-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.drawerItemText}>Dashboard</Text>
        </TouchableOpacity>

        <View style={styles.drawerSectionLabel}>
          <Text style={{ color: COLORS.gold, fontSize: 10, fontWeight: '800', letterSpacing: 2 }}>MODULES</Text>
        </View>

        {drawerItems.map(item => (
          <TouchableOpacity
            key={item.name}
            onPress={() => navigation.navigate(item.name)}
            style={styles.drawerItem}
          >
            <Ionicons name={item.icon} size={20} color={COLORS.textSecondary} />
            <Text style={styles.drawerItemText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </DrawerContentScrollView>

      <View style={styles.drawerFooter}>
        <TouchableOpacity onPress={handleLogout} style={[styles.drawerItem, { marginBottom: 0 }]}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.red} />
          <Text style={[styles.drawerItemText, { color: COLORS.red }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MainDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.bgSecondary },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: { fontWeight: '700', color: COLORS.gold },
        drawerStyle: { backgroundColor: COLORS.bgSecondary, width: 300 },
        drawerActiveTintColor: COLORS.gold,
        drawerInactiveTintColor: COLORS.textSecondary,
        sceneStyle: { backgroundColor: COLORS.bg },
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={BottomTabs}
        options={{
          title: 'Qitab-e-Noor',
          drawerLabel: 'Dashboard',
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="moon" size={20} color={COLORS.gold} />
              <Text style={{ color: COLORS.gold, fontWeight: '800', fontSize: 18 }}>Qitab-e-Noor</Text>
            </View>
          ),
        }}
      />
      <Drawer.Screen name="Hadith" component={HadithScreen} options={{ title: 'Authentic Hadith' }} />
      <Drawer.Screen name="Zakat" component={ZakatScreen} options={{ title: 'Zakat & Ushr' }} />
      <Drawer.Screen name="Tasbih" component={TasbihScreen} options={{ title: 'Tasbih Counter' }} />
      <Drawer.Screen name="Reminders" component={RemindersScreen} options={{ title: 'Reminders' }} />
      <Drawer.Screen name="Generator" component={GeneratorScreen} options={{ title: 'Content Creator' }} />
      <Drawer.Screen name="Bookmarks" component={BookmarksScreen} options={{ title: 'My Library' }} />
      <Drawer.Screen name="AIChat" component={AIChatScreen} options={{ title: 'Islamic AI Assistant' }} />
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('qitab_user_name').then(name => {
      setInitialRoute(name ? 'Main' : 'Login');
    });
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="moon" size={48} color={COLORS.gold} />
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainDrawer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 24,
    paddingTop: 56,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
    backgroundColor: 'rgba(212,175,55,0.04)',
  },
  drawerLogoWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(212,175,55,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  drawerTitle: {
    color: COLORS.gold,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  drawerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  drawerSectionLabel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    borderRadius: 14,
    marginBottom: 2,
  },
  drawerItemText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
});
