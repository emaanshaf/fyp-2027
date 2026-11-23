import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { getAIAnswer } from '../ai/assistant';
import { recordAIUsage } from '../services/aiUsage';
import FormattedText from '../components/FormattedText';
import ZakatBreakdown from '../components/ZakatBreakdown';

const GOLD_NISAB_GRAMS = 87.48;
const SILVER_NISAB_GRAMS = 612.36;
const ZAKAT_RATE = 0.025;

const DEFAULT_GOLD_PRICE = 25000;
const DEFAULT_SILVER_PRICE = 320;

const fetchMetalPrices = async () => {
  try {
    const res = await fetch('https://api.metals.live/v1/spot');
    const data = await res.json();
    const gold = data.find(m => m.metal === 'gold');
    const silver = data.find(m => m.metal === 'silver');
    if (gold && silver) {
      const usdToPkr = 278;
      return {
        gold: Math.round(gold.price * usdToPkr),
        silver: Math.round(silver.price * usdToPkr),
      };
    }
  } catch {}
  return { gold: DEFAULT_GOLD_PRICE, silver: DEFAULT_SILVER_PRICE };
};

const USHR_RULES = [
  { label: 'Rain-watered crops', value: 0.10, icon: 'rainy-outline' },
  { label: 'Irrigated crops', value: 0.05, icon: 'water-outline' },
  { label: 'Both (mixed)', value: 0.075, icon: 'partly-sunny-outline' },
];

export default function ZakatScreen() {
  // ── Live theme hooks (replaces frozen module-level COLORS) ────────────
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  const [tab, setTab] = useState('zakat');
  const [values, setValues] = useState({ cash: '', gold: '', silver: '', silverTolas: '', investments: '', debts: '' });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [histModal, setHistModal] = useState(false);
  const [metalPrices, setMetalPrices] = useState({ gold: DEFAULT_GOLD_PRICE, silver: DEFAULT_SILVER_PRICE });
  const [pricesLoading, setPricesLoading] = useState(true);
  const [cropValue, setCropValue] = useState('');
  const [ushrRate, setUshrRate] = useState(0.10);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('qitab_zakat_history').then(v => v && setHistory(JSON.parse(v)));
    fetchMetalPrices().then(prices => {
      setMetalPrices(prices);
      setPricesLoading(false);
    });
  }, []);

  const set = (key, val) => setValues(prev => ({ ...prev, [key]: val }));

  const num = (k) => parseFloat(values[k]) || 0;

  const calculate = () => {
    const goldGrams = num('gold');
    const silverGrams = (num('silverTolas') * 11.664) + num('silver');
    const goldValue = goldGrams * metalPrices.gold;
    const silverValue = silverGrams * metalPrices.silver;
    const goldNisab = GOLD_NISAB_GRAMS * metalPrices.gold;
    const silverNisab = SILVER_NISAB_GRAMS * metalPrices.silver;
    const nisab = Math.min(goldNisab, silverNisab);

    const totalAssets = num('cash') + goldValue + silverValue + num('investments');
    const totalLiabilities = num('debts');
    const netWealth = totalAssets - totalLiabilities;

    const zakatDue = netWealth >= nisab;
    const zakatAmount = zakatDue ? netWealth * ZAKAT_RATE : 0;

    setResult({
      totalAssets, totalLiabilities, netWealth, zakatDue, zakatAmount, nisab,
      goldValue, silverValue,
      // Per-category values, kept for the breakdown chart.
      parts: {
        cash: num('cash'),
        gold: goldValue,
        silver: silverValue,
        investments: num('investments'),
      },
    });
  };

  const saveHistory = async () => {
    if (!result || result.zakatAmount <= 0) return;
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('en-PK'),
      netWealth: result.netWealth,
      zakatAmount: result.zakatAmount,
      zakatDue: result.zakatDue,
    };
    const next = [entry, ...history].slice(0, 10);
    setHistory(next);
    await AsyncStorage.setItem('qitab_zakat_history', JSON.stringify(next));
  };

  const ushrAmount = () => {
    const v = parseFloat(cropValue) || 0;
    return (v * ushrRate).toFixed(0);
  };

  const FALLBACK_REPLY = "JazakAllah Khair for your question. Please consult a qualified Islamic scholar for your specific situation.";

  const handleAiQuery = async () => {
    const q = aiQuery.trim();
    if (!q || aiLoading) return;
    setAiLoading(true);
    setAiQuery('');
    try {
      const answer = await getAIAnswer(q);
      recordAIUsage(answer?.source || 'unavailable').catch(() => {});
      setAiResponse(answer ? answer.text : FALLBACK_REPLY);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {[['zakat', 'Zakat Calculator'], ['ushr', 'Ushr (Crops)'], ['ai', 'Zakat AI']].map(([k, label]) => (
          <TouchableOpacity
            key={k}
            onPress={() => setTab(k)}
            style={[styles.tab, tab === k && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === k && { color: '#fff' }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {tab === 'zakat' && (
          <>
            {/* Input Fields */}
            <Text style={globalStyles.sectionTitle}>Enter Your Assets</Text>

            {/* Live Metal Prices */}
            <View style={styles.priceBanner}>
              <Ionicons name="trending-up-outline" size={14} color={COLORS.emerald} />
              <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginLeft: 6 }}>
                {pricesLoading ? 'Loading prices...' : `Live: Gold ${metalPrices.gold.toLocaleString()} PKR/g • Silver ${metalPrices.silver.toLocaleString()} PKR/g`}
              </Text>
            </View>

            {[
              ['cash', 'Cash & Savings (PKR)', 'cash-outline'],
              ['gold', 'Gold (grams)', 'ellipse-outline'],
              ['silverTolas', 'Silver (Tolas)', 'ellipse-outline'],
              ['silver', 'Silver (grams)', 'ellipse-outline'],
              ['investments', 'Investments & Stocks (PKR)', 'trending-up-outline'],
              ['debts', 'Debts / Liabilities (PKR)', 'remove-circle-outline'],
            ].map(([key, label, icon]) => (
              <View key={key} style={{ marginBottom: 12 }}>
                <Text style={globalStyles.label}>{label.toUpperCase()}</Text>
                <View style={[globalStyles.input]}>
                  <Ionicons name={icon} size={18} color={COLORS.textSecondary} />
                  <TextInput
                    style={{ flex: 1, color: COLORS.textPrimary, fontSize: 15, marginLeft: 8 }}
                    value={values[key]}
                    onChangeText={v => set(key, v.replace(/[^0-9.]/g, ''))}
                    placeholder="0"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            ))}

            <View style={[globalStyles.row, { gap: 10, marginTop: 8 }]}>
              <TouchableOpacity
                style={[globalStyles.btnPrimary, { flex: 1 }]}
                onPress={calculate}
                accessibilityRole="button"
                accessibilityLabel="Calculate Zakat"
              >
                <Ionicons name="calculator-outline" size={18} color="#000" />
                <Text style={globalStyles.btnPrimaryText}>Calculate Zakat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.histBtn]}
                onPress={() => setHistModal(true)}
              >
                <Ionicons name="time-outline" size={20} color={COLORS.gold} />
              </TouchableOpacity>
            </View>

            {/* Result */}
            {result && (
              <View style={styles.resultCard}>
                <Text style={[globalStyles.sectionTitle, { marginBottom: 16 }]}>Result</Text>

                {[
                  ['Total Assets', result.totalAssets],
                  ['Liabilities', result.totalLiabilities],
                  ['Net Wealth', result.netWealth],
                  ['Nisab Threshold', result.nisab],
                ].map(([label, val]) => (
                  <View key={label} style={[globalStyles.spaceBetween, { marginBottom: 10 }]}>
                    <Text style={{ color: COLORS.textSecondary }}>{label}</Text>
                    <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>PKR {val.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</Text>
                  </View>
                ))}

                <View style={globalStyles.divider} />

                {result.zakatDue ? (
                  <View style={styles.zakatDueBox}>
                    <Text style={styles.zakatDueLabel}>ZAKAT DUE</Text>
                    <Text style={styles.zakatAmount}>PKR {result.zakatAmount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 4 }}>2.5% of Net Wealth</Text>
                  </View>
                ) : (
                  <View style={styles.belowNisabBox}>
                    <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} />
                    <Text style={{ color: COLORS.textSecondary, fontSize: 14, flex: 1 }}>Your net wealth is below the Nisab threshold. Zakat is not obligatory.</Text>
                  </View>
                )}

                {result.parts ? (
                  <ZakatBreakdown result={result} parts={result.parts} />
                ) : null}

                {result.zakatDue && (
                  <TouchableOpacity style={[globalStyles.btnPrimary, { marginTop: 16 }]} onPress={saveHistory}>
                    <Ionicons name="save-outline" size={18} color="#000" />
                    <Text style={globalStyles.btnPrimaryText}>Save Calculation</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}

        {tab === 'ushr' && (
          <>
            <Text style={globalStyles.sectionTitle}>Ushr Calculator</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 20 }}>
              Ushr is the Islamic tax on agricultural produce. It is due immediately upon harvest and does not require one lunar year.
            </Text>

            <Text style={globalStyles.label}>CROP VALUE (PKR)</Text>
            <View style={[globalStyles.input, { marginBottom: 20 }]}>
              <Ionicons name="leaf-outline" size={18} color={COLORS.emerald} />
              <TextInput
                style={{ flex: 1, color: COLORS.textPrimary, fontSize: 15, marginLeft: 8 }}
                value={cropValue}
                onChangeText={v => setCropValue(v.replace(/[^0-9.]/g, ''))}
                placeholder="e.g. 500000"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>

            <Text style={[globalStyles.label, { marginBottom: 10 }]}>WATER SOURCE</Text>
            {USHR_RULES.map(r => (
              <TouchableOpacity
                key={r.label}
                onPress={() => setUshrRate(r.value)}
                style={[styles.ushrOption, ushrRate === r.value && { borderColor: COLORS.emerald, backgroundColor: 'rgba(255, 255, 255,0.08)' }]}
              >
                <Ionicons name={r.icon} size={20} color={ushrRate === r.value ? COLORS.emerald : COLORS.textSecondary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: ushrRate === r.value ? COLORS.emerald : COLORS.textPrimary, fontWeight: '700' }}>{r.label}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{(r.value * 100)}% of crop value</Text>
                </View>
                {ushrRate === r.value && <Ionicons name="checkmark-circle" size={20} color={COLORS.emerald} />}
              </TouchableOpacity>
            ))}

            {cropValue ? (
              <View style={[styles.resultCard, { marginTop: 20 }]}>
                <Text style={[globalStyles.label, { marginBottom: 8 }]}>USHR DUE</Text>
                <Text style={{ color: COLORS.emerald, fontSize: 36, fontWeight: '900' }}>
                  PKR {parseInt(ushrAmount()).toLocaleString('en-PK')}
                </Text>
                <Text style={{ color: COLORS.textSecondary, marginTop: 4 }}>
                  {(ushrRate * 100)}% of PKR {parseFloat(cropValue).toLocaleString('en-PK')}
                </Text>
              </View>
            ) : null}
          </>
        )}

        {tab === 'ai' && (
          <>
            <Text style={globalStyles.sectionTitle}>Zakat Assistant</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 20 }}>
              Ask questions about Zakat rules, Nisab, or Islamic finance.
            </Text>

            <View style={[globalStyles.input, { marginBottom: 12, alignItems: 'flex-start', paddingTop: 12 }]}>
              <TextInput
                style={{ flex: 1, color: COLORS.textPrimary, fontSize: 15, minHeight: 80, textAlignVertical: 'top' }}
                value={aiQuery}
                onChangeText={setAiQuery}
                placeholder="e.g. Is Zakat due on gold jewelry?"
                placeholderTextColor={COLORS.textSecondary}
                multiline
              />
            </View>
            <TouchableOpacity
              style={[globalStyles.btnPrimary, (!aiQuery.trim() || aiLoading) && { opacity: 0.5 }]}
              onPress={handleAiQuery}
              disabled={!aiQuery.trim() || aiLoading}
            >
              <Ionicons name="send" size={16} color="#000" />
              <Text style={globalStyles.btnPrimaryText}>{aiLoading ? 'Thinking…' : 'Ask'}</Text>
            </TouchableOpacity>

            {aiResponse ? (
              <View style={styles.aiResponse}>
                <View style={[globalStyles.row, { gap: 8, marginBottom: 12 }]}>
                  <Ionicons name="sparkles" size={18} color={COLORS.gold} />
                  <Text style={{ color: COLORS.gold, fontWeight: '800' }}>Zakat AI Response</Text>
                </View>
                <FormattedText
                  text={aiResponse}
                  style={{ color: COLORS.textPrimary, lineHeight: 24, fontSize: 14 }}
                  boldStyle={{ color: COLORS.gold }}
                />
                <View style={styles.disclaimer}>
                  <Ionicons name="warning-outline" size={14} color={COLORS.amber} />
                  <Text style={{ color: COLORS.amber, fontSize: 11, flex: 1 }}>For specific rulings, consult a qualified scholar.</Text>
                </View>
              </View>
            ) : null}

            {/* Quick Questions */}
            <Text style={[globalStyles.label, { marginTop: 24, marginBottom: 12 }]}>QUICK QUESTIONS</Text>
            {['What is Nisab?', 'How is gold Zakat calculated?', 'Can I deduct debts?', 'What is Ushr?'].map(q => (
              <TouchableOpacity
                key={q}
                onPress={() => { setAiQuery(q); }}
                style={styles.quickQ}
              >
                <Ionicons name="help-circle-outline" size={16} color={COLORS.gold} />
                <Text style={{ color: COLORS.textPrimary, fontSize: 14 }}>{q}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      {/* History Modal */}
      <Modal visible={histModal} transparent animationType="slide" onRequestClose={() => setHistModal(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View style={{ backgroundColor: COLORS.bgSecondary, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '75%' }}>
            <View style={[globalStyles.spaceBetween, { marginBottom: 16 }]}>
              <Text style={{ color: COLORS.textPrimary, fontWeight: '900', fontSize: 20 }}>Calculation History</Text>
              <TouchableOpacity onPress={() => setHistModal(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {history.length === 0 ? (
                <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginTop: 20 }}>No saved calculations yet.</Text>
              ) : history.map(h => (
                <View key={h.id} style={[styles.histItem]}>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{h.date}</Text>
                  <View style={[globalStyles.spaceBetween, { marginTop: 6 }]}>
                    <View>
                      <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>Net Wealth</Text>
                      <Text style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: '900' }}>PKR {h.netWealth.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Zakat Due</Text>
                      <Text style={{ color: COLORS.gold, fontSize: 18, fontWeight: '900' }}>PKR {h.zakatAmount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  priceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255,0.2)',
    padding: 10,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    margin: 12,
    backgroundColor: COLORS.glass,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 12 },
  histBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCard: {
    marginTop: 20,
    backgroundColor: COLORS.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 20,
  },
  zakatDueBox: {
    alignItems: 'center',
    marginTop: 8,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255,0.2)',
  },
  zakatDueLabel: { color: COLORS.gold, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  zakatAmount: { color: COLORS.gold, fontSize: 38, fontWeight: '900', marginTop: 8 },
  belowNisabBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    alignItems: 'flex-start',
    marginTop: 8,
  },
  ushrOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glass,
  },
  aiResponse: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255,0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255,0.2)',
    padding: 18,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
    alignItems: 'flex-start',
  },
  quickQ: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: COLORS.glass,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 8,
    alignItems: 'center',
  },
  histItem: {
    padding: 16,
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 10,
  },
});
