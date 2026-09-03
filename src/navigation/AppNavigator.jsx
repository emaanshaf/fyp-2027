import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Platform, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';
import { backend } from '../services/backend';
import { syncService } from '../services/sync';

import { COLORS, globalStyles } from '../theme';
import { screenFor } from './screenRegistry';
import LandingScreen, { LANDING_SEEN_KEY } from '../screens/LandingScreen';
import { RoleProvider, useRole } from '../context/RoleContext';
import {
  MODULES, TAB_MODULES, DRAWER_MODULES, ROUTE_PATHS, SCREEN_TITLES,
  hasAccess, buildLinkingConfig, accentFor,
} from '../config/routes';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

function BottomTabs() {
  const userRole = useRole();
  // Always show at least Home screen, filter others by role
  const accessibleTabs = TAB_MODULES.filter(
    s => s.name === 'Home' || hasAccess(userRole, s.name)
  );
  
  // If no tabs accessible, show Home anyway
  const tabsToRender = accessibleTabs.length > 0 ? accessibleTabs : [TAB_MODULES.find(s => s.name === 'Home')];
  
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
      })}
    >
      {tabsToRender.map(s => (
        <Tab.Screen
          key={s.name}
          name={s.name}
          component={screenFor(s.name)}
          options={{
            tabBarLabel: s.title,
            // The tab bar rendered labels only; icon names were already in the
            // route table but were never wired up.
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? s.icon.replace('-outline', '') : s.icon}
                size={size ?? 22}
                color={color}
              />
            ),
            href: ROUTE_PATHS[s.name],
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

function CustomDrawerContent(props) {
  const { navigation, drawerContentOptions } = props;
  const { userRole } = drawerContentOptions || {};


  const accessibleItems = DRAWER_MODULES.filter(item => hasAccess(userRole, item.name));

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgSecondary }}>
      <View style={styles.drawerHeader}>
        <View style={styles.drawerLogoWrap}>
          <Ionicons name="book" size={26} color={COLORS.gold} />
        </View>
        <Text style={styles.drawerTitle}>Qitab-e-Noor</Text>
        <Text style={styles.drawerSubtitle}>Your Spiritual Companion</Text>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          style={styles.drawerItem}
        >
          <View style={[styles.drawerIconPlate, { backgroundColor: COLORS.gold + '1F' }]}>
            <Ionicons name="home-outline" size={17} color={COLORS.gold} />
          </View>
          <Text style={styles.drawerItemText}>Dashboard</Text>
        </TouchableOpacity>

        <View style={styles.drawerSectionLabel}>
          <Text style={{ color: COLORS.gold, fontSize: 10, fontWeight: '800', letterSpacing: 2 }}>MODULES</Text>
        </View>

        {accessibleItems.map(item => {
          // Each row carries its module's accent on a tinted plate, so the
          // drawer can be scanned by colour instead of read line by line.
          const accent = accentFor(COLORS, item.name);
          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => navigation.navigate(item.name)}
              style={styles.drawerItem}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <View style={[styles.drawerIconPlate, { backgroundColor: accent + '1F' }]}>
                <Ionicons name={item.icon} size={17} color={accent} />
              </View>
              <Text style={styles.drawerItemText}>{item.title}</Text>
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>

      {/* Settings replaces the old Logout row: with no sign-in there is no
          session to end, and resetting local data lives in Settings. */}
      <View style={styles.drawerFooter}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={[styles.drawerItem, { marginBottom: 0 }]}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <View style={[styles.drawerIconPlate, { backgroundColor: COLORS.blue + '1F' }]}>
            <Ionicons name="settings-outline" size={17} color={COLORS.blue} />
          </View>
          <Text style={styles.drawerItemText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MainDrawer() {
  const userRole = useRole();
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} drawerContentOptions={{ userRole }} />}
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
        initialParams={{ userRole }}
        options={{
          title: 'Qitab-e-Noor',
          drawerLabel: 'Dashboard',
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="book" size={19} color={COLORS.gold} />
              <Text style={{ color: COLORS.gold, fontWeight: '800', fontSize: 18 }}>Qitab-e-Noor</Text>
            </View>
          ),
          href: ROUTE_PATHS.Dashboard,
        }}
      />
      {MODULES.filter(m => !m.tab && hasAccess(userRole, m.name)).map(({ name, path }) => {
        return (
          <Drawer.Screen
            key={name}
            name={name}
            component={screenFor(name)}
            options={{ 
              title: SCREEN_TITLES[name] || name,
              href: `/${path}`,
            }}
          />
        );
      })}

      {/* Catch-all. React Navigation resolves unmatched URLs here via the
          `NotFound: '*'` entry in the linking config. */}
      <Drawer.Screen
        name="NotFound"
        component={screenFor('NotFound')}
        options={{ title: 'Not Found', drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
}

// Generated from src/config/routes.js so URLs, permissions and drawer
// entries cannot drift apart.
const linking = buildLinkingConfig();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [isReady, setIsReady] = useState(false);
  // null until read from storage, so the landing page never flashes for a
  // returning user and the app never flashes for a first-time one.
  const [showLanding, setShowLanding] = useState(null);
  // Route the landing page asked us to open once the navigator mounts.
  const [landingTarget, setLandingTarget] = useState(null);
  const navigationRef = useRef(null);

  const handleDeepLink = useCallback(async (url) => {
    if (!navigationRef.current || !url) return;
    
    try {
      await navigationRef.current.navigate(url);
    } catch (e) {
      console.log('Deep link navigation failed:', e);
    }
  }, []);

  // There is no sign-in screen. A silent anonymous Firebase session gives each
  // install a stable uid, so sync and cross-device restore keep working while
  // the user is never asked for credentials. If Firebase is unconfigured or
  // unreachable the app still opens — everything falls back to local storage.
  useEffect(() => {
    const initAuth = async () => {
      const resolveRole = async () => {
        try {
          const me = await backend.getMe();
          return me.user?.role || 'user';
        } catch {
          return 'user';
        }
      };

      try {
        if (!isFirebaseConfigured()) {
          setUserRole(await resolveRole());
          setInitialRoute('Main');
          syncService.syncAll();
          setIsReady(true);
          return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!user) {
            // No session yet: create an anonymous one. A failure here is not
            // fatal — the app opens local-only rather than blocking on network.
            try {
              await signInAnonymously(auth);
              return; // this listener fires again with the new user
            } catch (e) {
              console.warn('Anonymous sign-in unavailable, continuing offline:', e?.message);
              setInitialRoute('Main');
              setIsReady(true);
              return;
            }
          }
          setUserRole(await resolveRole());
          setInitialRoute('Main');
          syncService.syncAll();
          setIsReady(true);
        });
        return unsubscribe;
      } catch (e) {
        console.error('Auth init error:', e);
        setInitialRoute('Main');
        setIsReady(true);
      }
    };

    initAuth();

    AsyncStorage.getItem(LANDING_SEEN_KEY).then(seen => setShowLanding(!seen));

    if (Platform.OS !== 'web') {
      // Linking.removeEventListener was removed in React Native 0.65 and does
      // not exist in 0.76. Calling it threw from the cleanup, and a throw in a
      // cleanup propagates — the effect depends on handleDeepLink, so any
      // change to it re-ran the effect, crashed on teardown, and handed the
      // whole tree to the ErrorBoundary instead of the app.
      //
      // The old call could not have worked anyway: it passed a freshly created
      // arrow function, never the one that was registered, so every re-run
      // added another listener and removed none.
      const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
      return () => subscription.remove();
    }
  }, [handleDeepLink]);

  if (!isReady || showLanding === null) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="book" size={46} color={COLORS.gold} />
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 20 }} />
        <Text style={{ color: COLORS.textSecondary, marginTop: 16, fontSize: 14 }}>Loading Qitab-e-Noor...</Text>
      </View>
    );
  }

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="book" size={46} color={COLORS.gold} />
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 20 }} />
      </View>
    );
  }

  if (showLanding) {
    return (
      <LandingScreen
        onDone={route => {
          if (route) setLandingTarget(route);
          setShowLanding(false);
        }}
      />
    );
  }

  return (
    <RoleProvider role={userRole}>
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={() => {
        setIsReady(true);
        if (landingTarget) {
          navigationRef.current?.navigate(landingTarget);
          setLandingTarget(null);
        }
      }}
    >
      <Stack.Navigator 
        initialRouteName={initialRoute} 
        screenOptions={{ 
          headerShown: false,
          gestureEnabled: true,
        }}
      >
        {/* MainDrawer reads the role from RoleProvider rather than a prop.
            It used to be an inline arrow, which is a new component identity on
            every render — React Navigation unmounted and remounted the whole
            drawer, losing every screen's state, each time auth state settled. */}
        <Stack.Screen 
          name="Main" 
          component={MainDrawer}
          options={{ 
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
    </RoleProvider>
  );
}

const styles = StyleSheet.create({
  drawerIconPlate: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  drawerHeader: {
    padding: 24,
    paddingTop: 56,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
    backgroundColor: COLORS.glass,
  },
  drawerLogoWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
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