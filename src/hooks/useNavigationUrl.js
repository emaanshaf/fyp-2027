import { useEffect, useRef, useCallback } from 'react';
import { Platform, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { ROUTE_PATHS, MODULE_ROLES, pathToRoute, paramsFromPath } from '../config/routes';

// Route data lives in src/config/routes.js. This file used to carry its own
// copies of ROUTE_PATHS, pathToRoute and the role table; they had already
// drifted from the navigator's.

export function useNavigationUrl() {
  const navigation = useNavigation();
  const isMountedRef = useRef(false);
  const previousRouteRef = useRef(null);

  const updateUrl = useCallback((routeName) => {
    if (!isMountedRef.current) return;
    
    // Everything here is web-only. The URL used to be built *before* this
    // guard, and `window.location` is undefined on native — so this threw a
    // TypeError on every navigation on Android and iOS while working fine on
    // web, which is why it went unnoticed.
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined' || !window.location || !window.history) return;

    const path = ROUTE_PATHS[routeName] || '/';
    try {
      window.history.replaceState({}, '', `${window.location.origin}${path}`);
    } catch (e) {
      console.warn('Failed to update URL:', e);
    }
  }, []);

  const navigateTo = useCallback((routeName, params = {}) => {
    updateUrl(routeName);
    navigation.navigate(routeName, params);
  }, [navigation, updateUrl]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const route = navigation.getState()?.routes[navigation.getState()?.index];
      if (route && route.name !== previousRouteRef.current) {
        previousRouteRef.current = route.name;
        updateUrl(route.name);
      }
    }, [navigation, updateUrl])
  );

  return { navigateTo, updateUrl };
}

export function useDeepLinking() {
  const navigation = useNavigation();
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    const handleUrl = ({ url }) => {
      if (!isMountedRef.current) return;
      
      try {
        const path = url.replace(/^.*?\/\/[^/]+/, '') || '/';
        navigation.dispatch({
          type: 'NAVIGATE',
          payload: { name: pathToRoute(path) || 'Dashboard' },
        });
      } catch (e) {
        console.warn('Deep link error:', e);
      }
    };

    if (Platform.OS !== 'web') {
      // RN 0.65 removed Linking.removeEventListener; unsubscribe via the handle.
      const subscription = Linking.addEventListener('url', handleUrl);
      return () => subscription.remove();
    } else {
      const handlePopState = () => {
        const path = window.location.pathname;
        navigation.dispatch({
          type: 'NAVIGATE',
          payload: { name: pathToRoute(path) || 'Dashboard' },
        });
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [navigation]);

  return null;
}

/** Role-gating helpers backed by the shared route table. */
export function useRoleAccess(userRole) {
  const check = useCallback(
    moduleName => (MODULE_ROLES[moduleName] || []).includes(userRole || 'user'),
    [userRole]
  );

  const getAccessibleModules = useCallback(
    () => Object.keys(MODULE_ROLES).filter(m => MODULE_ROLES[m].includes(userRole || 'user')),
    [userRole]
  );

  return { hasAccess: check, getAccessibleModules };
}

export { ROUTE_PATHS, pathToRoute, paramsFromPath };
