import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { backend } from '../services/backend';

export default function AdminPanelScreen() {
  // ── Live theme hooks (replaces frozen module-level COLORS) ────────────
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('users'); // 'users' | 'stats'
  
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    checkRole();
  }, []);

  useEffect(() => {
    if (role === 'admin') {
      if (tab === 'users') loadUsers();
      else if (tab === 'stats') loadStats();
    }
  }, [role, tab]);

  const checkRole = async () => {
    try {
      const data = await backend.getMe();
      if (data?.user?.role) {
        setRole(data.user.role);
      } else {
        setRole('user');
      }
    } catch (e) {
      setRole('guest');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setDataLoading(true);
    try {
      // Endpoint should return users. For now assuming /auth/users
      const res = await backend.request('/auth/users');
      setUsers(res.users || res);
    } catch (e) {
      console.warn('Failed to load users:', e);
    } finally {
      setDataLoading(false);
    }
  };

  const loadStats = async () => {
    setDataLoading(true);
    try {
      const res = await backend.request('/auth/stats');
      setStats(res);
    } catch (e) {
      console.warn('Failed to load stats:', e);
    } finally {
      setDataLoading(false);
    }
  };

  const handleUserAction = (user) => {
    Alert.alert(
      'Manage User',
      `Manage role for ${user.name || user.email}`,
      [
        { text: 'Make Moderator', onPress: () => changeRole(user.id, 'moderator') },
        { text: 'Make User', onPress: () => changeRole(user.id, 'user') },
        { text: 'Remove Moderator', onPress: () => changeRole(user.id, 'user') },
        { text: 'Delete', onPress: () => deleteUser(user.id), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const changeRole = async (userId, newRole) => {
    try {
      await backend.request(`/auth/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      loadUsers();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const deleteUser = async (userId) => {
    try {
      await backend.request(`/auth/users/${userId}`, { method: 'DELETE' });
      loadUsers();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.emerald} />
      </View>
    );
  }

  if (role !== 'admin') {
    return (
      <View style={[globalStyles.container, styles.center]}>
        <View style={styles.deniedCard}>
          <Ionicons name="shield-alert" size={48} color={COLORS.red} />
          <Text style={styles.deniedTitle}>Access Denied</Text>
          <Text style={styles.deniedText}>Admin privileges required.</Text>
        </View>
      </View>
    );
  }

  const renderUser = ({ item }) => {
    let badgeColor = COLORS.emerald;
    if (item.role === 'admin') badgeColor = COLORS.red;
    if (item.role === 'moderator') badgeColor = COLORS.amber;

    return (
      <TouchableOpacity 
        style={styles.userRow}
        onLongPress={() => handleUserAction(item)}
        onPress={() => handleUserAction(item)}
      >
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name || 'No Name'}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badgeColor + '33', borderColor: badgeColor }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{item.role?.toUpperCase() || 'USER'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, tab === 'users' && styles.activeTab]}
          onPress={() => setTab('users')}
        >
          <Text style={[styles.tabText, tab === 'users' && styles.activeTabText]}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, tab === 'stats' && styles.activeTab]}
          onPress={() => setTab('stats')}
        >
          <Text style={[styles.tabText, tab === 'stats' && styles.activeTabText]}>Stats</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {dataLoading ? (
          <ActivityIndicator size="large" color={COLORS.emerald} style={{ marginTop: 40 }} />
        ) : tab === 'users' ? (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderUser}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard icon="people" label="Users" value={stats?.users} color={COLORS.blue} />
            <StatCard icon="bookmark" label="Bookmarks" value={stats?.bookmarks} color={COLORS.emerald} />
            <StatCard icon="document-text" label="Notes" value={stats?.notes} color={COLORS.gold} />
            <StatCard icon="heart" label="Favorites" value={stats?.favorites} color={COLORS.red} />
            <StatCard icon="notifications" label="Reminders" value={stats?.reminders} color={COLORS.purple} />
            <StatCard icon="beaker" label="Tasbih" value={stats?.tasbih} color={COLORS.cyan} />
          </View>
        )}
      </View>
    </View>
  );
}

function StatCard({ icon, label, value, color }) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value ?? '-'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: COLORS.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.emerald,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.emerald,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  deniedCard: {
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.red + '55',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  deniedTitle: {
    color: COLORS.red,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  deniedText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
});
