import React, { Component, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.red} style={styles.icon} />
          <Text style={[styles.title, { color: COLORS.textPrimary }]}>Something went wrong</Text>
          <Text style={[styles.message, { color: COLORS.textSecondary }]}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          {__DEV__ && this.state.errorInfo && (
            <Text style={[styles.stack, { color: COLORS.textSecondary }]}>
              {this.state.errorInfo.componentStack}
            </Text>
          )}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.retryBtn} onPress={this.handleRetry}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.homeBtn} onPress={() => this.props.onReset?.()}>
              <Text style={styles.homeText}>Go Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: COLORS.bg,
  },
  icon: { marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  message: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  stack: { fontSize: 11, fontFamily: 'monospace', textAlign: 'left', maxWidth: '100%' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  retryBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { color: '#000', fontWeight: '700', fontSize: 14 },
  homeBtn: {
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  homeText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
});

export default ErrorBoundary;

export function useErrorHandler() {
  const [error, setError] = useState(null);
  const handleError = useCallback((err) => {
    console.error('Error caught:', err);
    setError(err);
  }, []);
  const clearError = useCallback(() => setError(null), []);
  return { error, handleError, clearError };
}
