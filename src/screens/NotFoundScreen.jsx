import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, globalStyles } from '../theme';

/**
 * Shown when a URL doesn't match any route.
 *
 * Reachable in practice: a shared deep link to a module the user's role can't
 * open, a typo'd URL on web, or a link from an older build whose paths have
 * since changed.
 */
export default function NotFoundScreen({ navigation, route }) {
  const attempted = route?.params?.path;

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <View style={[{ flex: 1, padding: 32 }, globalStyles.center]}>
        <View style={styles.ring}>
          <Ionicons name="compass-outline" size={44} color={COLORS.gold} />
        </View>

        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.sub}>
          We couldn&apos;t find that page. It may have moved, or the link may be
          incomplete.
        </Text>

        {attempted ? <Text style={styles.path}>{attempted}</Text> : null}

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        >
          <Ionicons name="home" size={16} color={COLORS.bg} />
          <Text style={styles.primaryBtnText}>Go to Home</Text>
        </TouchableOpacity>

        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={16} color={COLORS.gold} />
            <Text style={styles.secondaryBtnText}>Go back</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: 92, height: 92, borderRadius: 46,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.gold + '40', backgroundColor: COLORS.gold + '12',
  },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900', marginTop: 22 },
  sub: {
    color: COLORS.textSecondary, fontSize: 14, textAlign: 'center',
    marginTop: 10, lineHeight: 21,
  },
  path: {
    color: COLORS.textSecondary, fontSize: 12, marginTop: 14,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: COLORS.glass, fontFamily: 'monospace',
  },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.gold, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 28, marginTop: 30,
  },
  primaryBtnText: { color: COLORS.bg, fontWeight: '800', fontSize: 15 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, padding: 8 },
  secondaryBtnText: { color: COLORS.gold, fontWeight: '700', fontSize: 14 },
});
