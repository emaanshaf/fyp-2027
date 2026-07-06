import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { COLORS, globalStyles } from '../theme';
import { isClaudeConfigured } from '../ai/claudeClient';
import { KNOWLEDGE_BASE } from '../ai/islamicKnowledge';

export default function SettingsScreen({ navigation }) {
  const [userName, setUserName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const claudeOn = isClaudeConfigured();

  useEffect(() => {
    AsyncStorage.getItem('qitab_user_name').then(n => setUserName(n || 'Guest'));
  }, []);

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    await AsyncStorage.setItem('qitab_user_name', trimmed);
    setUserName(trimmed);
    setEditingName(false);
  };

  const clearCache = () => {
    Alert.alert(
      'Clear Cached Data',
      'This clears cached prayer times so they refresh from the internet next time. Your bookmarks, notes, favorites, and history are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear', style: 'destructive',
          onPress: async () => {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(k => k.includes('timings') || k.includes('_ts'));
            await AsyncStorage.multiRemove(cacheKeys);
            Alert.alert('Done', 'Cached prayer time data cleared.');
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('qitab_user_name');
    navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <Text style={[globalStyles.sectionTitle, { marginBottom: 12 }]}>Profile</Text>
        <View style={styles.card}>
          {editingName ? (
            <View style={{ gap: 12 }}>
              <View style={globalStyles.input}>
                <TextInput
                  style={{ flex: 1, color: COLORS.textPrimary, fontSize: 15 }}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Your name"
                  placeholderTextColor={COLORS.textSecondary}
                  autoFocus
                />
              </View>
              <View style={[globalStyles.row, { gap: 10 }]}>
                <TouchableOpacity style={[globalStyles.btnPrimary, { flex: 1 }]} onPress={saveName}>
                  <Text style={globalStyles.btnPrimaryText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[globalStyles.btnPrimary, { flex: 1, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder }]}
                  onPress={() => setEditingName(false)}
                >
                  <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={globalStyles.spaceBetween}>
              <View style={[globalStyles.row, { gap: 12 }]}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color={COLORS.gold} />
                </View>
                <Text style={{ color: COLORS.textPrimary, fontWeight: '800', fontSize: 16 }}>{userName}</Text>
              </View>
              <TouchableOpacity onPress={() => { setNameInput(userName === 'Guest' ? '' : userName); setEditingName(true); }}>
                <Ionicons name="pencil-outline" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* AI Assistant status */}
        <Text style={[globalStyles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Islamic AI Assistant</Text>
        <View style={styles.card}>
          <View style={[globalStyles.row, { gap: 10, marginBottom: 10 }]}>
            <View style={[styles.statusDot, { backgroundColor: claudeOn ? COLORS.emerald : COLORS.amber }]} />
            <Text style={{ color: COLORS.textPrimary, fontWeight: '800', fontSize: 15 }}>
              {claudeOn ? 'Live AI connected (Claude)' : 'Offline knowledge base only'}
            </Text>
          </View>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 }}>
            {claudeOn
              ? `Questions are answered live by Anthropic's Claude model, with the ${KNOWLEDGE_BASE.length}-topic offline knowledge base as a backup if the connection fails.`
              : `No live AI is configured — this is not a custom-trained model, just a pretrained model you can optionally connect to. Right now, answers come only from the built-in ${KNOWLEDGE_BASE.length}-topic offline knowledge base. Add an API key in .env (see README) to enable live answers.`}
          </Text>
        </View>

        {/* App info */}
        <Text style={[globalStyles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>About</Text>
        <View style={styles.card}>
          <View style={[globalStyles.spaceBetween, { marginBottom: 10 }]}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>Version</Text>
            <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 13 }}>
              {Constants.expoConfig?.version || '1.0.0'}
            </Text>
          </View>
          <View style={globalStyles.spaceBetween}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>Platform</Text>
            <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 13 }}>{Platform.OS}</Text>
          </View>
        </View>

        {/* Data & Session */}
        <Text style={[globalStyles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Data & Session</Text>
        <TouchableOpacity style={styles.actionRow} onPress={clearCache}>
          <Ionicons name="trash-bin-outline" size={20} color={COLORS.amber} />
          <Text style={styles.actionText}>Clear Cached Prayer Data</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.red} />
          <Text style={[styles.actionText, { color: COLORS.red }]}>Logout</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.glass,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 16,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, backgroundColor: COLORS.glass, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 10,
  },
  actionText: { flex: 1, color: COLORS.textPrimary, fontWeight: '700', fontSize: 14 },
});
