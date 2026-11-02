import React, { useEffect, useState, useRef, useImperativeHandle } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';
import { backend } from '../services/backend';
import { hasAuthToken } from '../services/authToken';
import { syncService } from '../services/sync';

import { useColors, useThemeName, useSetTheme, useThemedStyles } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import { useShare } from '../context/ShareContext';
import { screenFor } from './screenRegistry';
import LandingScreen, { LANDING_SEEN_KEY } from '../screens/LandingScreen';
import TodaysRemindersPopup from '../components/TodaysRemindersPopup';
import LoginScreen from '../screens/LoginScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import { RoleProvider, useRole } from '../context/RoleContext';
import {
  MODULES, TAB_MODULES, DRAWER_MODULES, DRAWER_GROUPS, ROUTE_PATHS,
  hasAccess, buildLinkingConfig, buildPath, accentFor, moduleByName,
} from '../config/routes';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

function BottomTabs({ navigation }) {
  const userRole = useRole();
  const COLORS = useColors();
  const { moduleTitle } = useLanguage();

  // Always show at least Home screen, filter others by role
  const accessibleTabs = TAB_MODULES.filter(
    s => s.name === 'Home' || hasAccess(userRole, s.name)
  );

  // If no tabs accessible, show Home anyway
  const tabsToRender = accessibleTabs.length > 0
    ? accessibleTabs
    : [TAB_MODULES.find(s => s.name === 'Home')];

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={() => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
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
            tabBarLabel: moduleTitle(s.name, s.title),
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

      {/* In-app reminder sheet over the tabs. OS notifications can miss a day
          when the app is closed; this re-checks today's list every five
          minutes while the app is open. */}
      <TodaysRemindersPopup navigation={navigation} />
    </View>
  );
}

function CustomDrawerContent(props) {
  const { navigation } = props;
  const userRole = useRole();
  const COLORS = useColors();
  const styles = useThemedStyles(makeStyles);
  const { t, moduleTitle, language, toggleLanguage } = useLanguage();
  const brandTitle = t('app.brand', 'Qitab-e-Noor');
  const homeLabel = moduleTitle('Home', 'Dashboard');

  const accessibleItems = DRAWER_MODULES.filter(item => hasAccess(userRole, item.name));
  const groups = DRAWER_GROUPS
    .map(group => ({
      ...group,
      items: accessibleItems.filter(item => item.group === group.id),
    }))
    .filter(group => group.items.length > 0);

  const renderItem = (item, options = {}) => {
    const accent = accentFor(COLORS, item.name);
    const label = moduleTitle(item.name, item.title);
    return (
      <TouchableOpacity
        key={item.name}
        onPress={() => navigation.navigate(item.name)}
        style={styles.drawerItem}
        accessibilityRole="button"
        accessibilityLabel={label}
        {...options}
      >
        <View style={[styles.drawerIconPlate, { backgroundColor: accent + '1F' }]}>
          <Ionicons name={item.icon} size={17} color={accent} />
        </View>
        <Text style={styles.drawerItemText}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgSecondary }}>
      <View style={styles.drawerHeader}>
        <View style={styles.drawerLogoWrap}>
          <Ionicons name="book" size={26} color={COLORS.gold} />
        </View>
        <Text style={styles.drawerTitle}>{brandTitle}</Text>
        <Text style={styles.drawerSubtitle}>{t('app.tagline')}</Text>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          style={styles.drawerItem}
          accessibilityRole="button"
          accessibilityLabel={homeLabel}
        >
          <View style={[styles.drawerIconPlate, { backgroundColor: COLORS.gold + '1F' }]}>
            <Ionicons name="home-outline" size={17} color={COLORS.gold} />
          </View>
          <Text style={styles.drawerItemText}>{homeLabel}</Text>
        </TouchableOpacity>

        {groups.map(group => (
          <View key={group.id}>
            <View style={styles.drawerSectionLabel}>
              <Text style={{ color: COLORS.gold, fontSize: 10, fontWeight: '800', letterSpacing: 2 }}>
                {group.fallback.toUpperCase()}
              </Text>
            </View>
            {group.items.map(item => renderItem(item))}
          </View>
        ))}
      </DrawerContentScrollView>

      <View style={styles.drawerFooter}>
        <TouchableOpacity
          onPress={() => navigation.navigate('AIChat')}
          style={styles.drawerItem}
          accessibilityRole="button"
          accessibilityLabel={moduleTitle('AIChat', 'Islamic AI Assistant')}
        >
          <View style={[styles.drawerIconPlate, { backgroundColor: COLORS.cyan + '1F' }]}>
            <Ionicons name="chatbubbles-outline" size={17} color={COLORS.cyan} />
          </View>
          <Text style={styles.drawerItemText}>{moduleTitle('AIChat', 'Ask the AI Assistant')}</Text>
        </TouchableOpacity>

        {/* The language control is deliberately in the drawer, not buried in
            Settings: switching to Urdu should be one tap from anywhere. */}
        <TouchableOpacity
          onPress={toggleLanguage}
          style={styles.drawerItem}
          accessibilityRole="button"
          accessibilityLabel={language === 'ur' ? 'Switch to English' : 'اردو میں تبدیل کریں'}
        >
          <View style={[styles.drawerIconPlate, { backgroundColor: COLORS.purple + '1F' }]}>
            <Ionicons name="language-outline" size={17} color={COLORS.purple} />
          </View>
          <Text style={styles.drawerItemText}>
            {language === 'ur' ? 'English' : 'اردو'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={[styles.drawerItem, { marginBottom: 0 }]}
          accessibilityRole="button"
          accessibilityLabel={moduleTitle('Settings', 'Settings')}
        >
          <View style={[styles.drawerIconPlate, { backgroundColor: COLORS.blue + '1F' }]}>
            <Ionicons name="settings-outline" size={17} color={COLORS.blue} />
          </View>
          <Text style={styles.drawerItemText}>{moduleTitle('Settings', 'Settings')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MainDrawer() {
  const userRole = useRole();
  // Live theme values so the nav bar repaints when the user switches theme.
  const LCOLORS = useColors();
  const themeName = useThemeName();
  const setTheme = useSetTheme();
  const { t, moduleTitle } = useLanguage();
  const { share } = useShare();
  const brandTitle = t('app.brand', 'Qitab-e-Noor');

  const toggleTheme = () => setTheme(themeName === 'light' ? 'default' : 'light');
  const isDark = themeName !== 'light';

  /**
   * Share whatever screen is open, including any deep-link parameters.
   *
   * The drawer header also wraps MainTabs, so the drawer's own route only says
   * "MainTabs". Reading the live navigation state at press time (rather than
   * the possibly-stale route prop) finds the active tab — otherwise sharing
   * from the Quran tab shared the dashboard instead of the open surah.
   */
  const shareCurrent = (navigation, route) => {
    let target = route;
    try {
      const state = navigation.getState();
      target = state.routes[state.index ?? state.routes.length - 1];
      while (target?.state?.routes?.length) {
        target = target.state.routes[target.state.index ?? target.state.routes.length - 1];
      }
    } catch { /* fall back to the route prop */ }

    if (target?.name === 'MainTabs') target = { name: 'Home' };

    const module = moduleByName(target?.name);
    const title = module
      ? moduleTitle(module.name, module.title)
      : brandTitle;
    const url = module ? buildPath(module.name, target?.params || {}) : '/';
    share({ title, message: t('share.invite'), url });
  };

  const iconButtonStyle = {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
  };

  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation, route }) => ({
        headerStyle: { backgroundColor: LCOLORS.bgSecondary },
        headerTintColor: LCOLORS.textPrimary,
        headerTitleStyle: { fontWeight: '700', color: LCOLORS.gold },
        drawerStyle: { backgroundColor: LCOLORS.bgSecondary, width: 300 },
        drawerActiveTintColor: LCOLORS.gold,
        drawerInactiveTintColor: LCOLORS.textSecondary,
        sceneStyle: { backgroundColor: LCOLORS.bg },
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Reachable from every module, so each screen has the same
                WhatsApp / Instagram / Copy Link sheet as the content cards. */}
            <TouchableOpacity
              onPress={() => shareCurrent(navigation, route)}
              style={iconButtonStyle}
              accessibilityRole="button"
              accessibilityLabel={t('share.pageLabel', 'Share this page')}
            >
              <Ionicons name="share-social-outline" size={17} color={LCOLORS.gold} />
            </TouchableOpacity>
            {route.name !== 'AIChat' ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('AIChat')}
                style={iconButtonStyle}
                accessibilityRole="button"
                accessibilityLabel={moduleTitle('AIChat', 'Ask the AI Assistant')}
              >
                <Ionicons name="chatbubbles-outline" size={18} color={LCOLORS.cyan} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={toggleTheme}
              style={[iconButtonStyle, { marginRight: 14 }]}
              accessibilityRole="button"
              accessibilityLabel={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
            >
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={18}
                color={isDark ? LCOLORS.gold : LCOLORS.primary}
              />
            </TouchableOpacity>
          </View>
        ),
      })}
    >
      <Drawer.Screen
        name="MainTabs"
        component={BottomTabs}
        options={{
          title: brandTitle,
          drawerLabel: t('nav.dashboard'),
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="book" size={19} color={LCOLORS.gold} />
              <Text style={{ color: LCOLORS.gold, fontWeight: '800', fontSize: 18 }}>
                {brandTitle}
              </Text>
            </View>
          ),
        }}
      />
      {MODULES.filter(m => !m.tab && hasAccess(userRole, m.name)).map(({ name, path, title }) => (
        <Drawer.Screen
          key={name}
          name={name}
          component={screenFor(name)}
          options={{
            title: moduleTitle(name, title),
            href: `/${path}`,
          }}
        />
      ))}

      {/* Catch-all. React Navigation resolves unmatched URLs here via the
          `NotFound: '*'` entry in the linking config. */}
      <Drawer.Screen
        name="NotFound"
        component={screenFor('NotFound')}
        options={{
          title: moduleTitle('NotFound', 'Not Found'),
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer.Navigator>
  );
}

// Generated from src/config/routes.js so URLs, permissions and drawer
// entries cannot drift apart.
const linking = buildLinkingConfig();

function AppNavigator(props, ref) {
  const [initialRoute, setInitialRoute] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [isReady, setIsReady] = useState(false);
  // null until read from storage, so the landing page never flashes for a
  // returning user and the app never flashes for a first-time one.
  const [showLanding, setShowLanding] = useState(null);
  const [showLogin, setShowLogin] = useState(null);
  // Route the landing page asked us to open once the navigator mounts.
  const [landingTarget, setLandingTarget] = useState(null);
  const navigationRef = useRef(null);
  const COLORS = useColors();

  // Let App.js (the Quran reminder popup) drive navigation from outside the
  // navigator tree.
  useImperativeHandle(ref, () => ({
    navigate: (...args) => navigationRef.current?.navigate(...args),
    isReady: () => !!navigationRef.current,
  }), []);

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
    hasAuthToken().then(hasToken => setShowLogin(!hasToken));

    // Incoming links are handled inside NavigationContainer through the
    // generated `linking` config. The old native listener passed the full URL
    // to navigate(), which is not a route name and never worked.
  }, []);

  if (!isReady || showLanding === null || showLogin === null) {
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

  if (showLogin) {
    return (
      <LoginScreen
        onSuccess={() => setShowLogin(false)}
        onSkip={() => setShowLogin(false)}
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
          <Stack.Screen
            name="Login"
            options={{ headerShown: false }}
          >
            {(screenProps) => (
              <LoginScreen
                {...screenProps}
                onSuccess={() => screenProps.navigation.goBack()}
                onSkip={() => screenProps.navigation.goBack()}
              />
            )}
          </Stack.Screen>
          <Stack.Screen
            name="AdminPanel"
            component={AdminPanelScreen}
            options={{
              headerShown: true,
              title: 'Admin Panel',
              headerStyle: { backgroundColor: COLORS.bgSecondary },
              headerTintColor: COLORS.textPrimary,
              headerTitleStyle: { fontWeight: '700', color: COLORS.gold },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </RoleProvider>
  );
}

export default React.forwardRef(AppNavigator);

const makeStyles = COLORS => StyleSheet.create({
  // Circular plates, matching the dashboard's Islam-360-style module grid
  // rather than the rounded squares this used to be.
  drawerIconPlate: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  // Solid emerald banner, the same treatment as the dashboard hero.
  drawerHeader: {
    padding: 24,
    paddingTop: 56,
    backgroundColor: COLORS.primary,
  },
  drawerLogoWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  drawerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  drawerSubtitle: {
    color: 'rgba(255,255,255,0.75)',
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
