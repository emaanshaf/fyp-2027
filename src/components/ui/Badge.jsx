// Badge Component - Config-driven from theme
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useComponents, useColors, useBorderRadius } from '../../hooks/useTheme';

export function Badge({
  variant = 'default',
  children,
  style,
  dot = false,
  dotColor,
  ...props
}) {
  const components = useComponents();
  const colors = useColors();
  const borderRadius = useBorderRadius();

  const badgeConfig = components.badge || {};

  const variantStyles = {
    default: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      color: colors.gold,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    success: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      color: colors.emerald,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    warning: {
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      color: colors.amber,
      borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    danger: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      color: colors.red,
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    info: {
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      color: colors.blue,
      borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.gold,
      borderColor: colors.gold,
      borderWidth: 1,
    },
  };

  const vStyle = variantStyles[variant] || variantStyles.default;

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: badgeConfig.paddingVertical || 4,
      paddingHorizontal: badgeConfig.paddingHorizontal || 12,
      borderRadius: badgeConfig.borderRadius || 20,
      borderWidth: vStyle.borderWidth || 0,
      borderColor: vStyle.borderColor,
      backgroundColor: vStyle.backgroundColor,
      gap: 6,
    },
    text: {
      color: vStyle.color,
      fontSize: badgeConfig.fontSize || 11,
      fontWeight: badgeConfig.fontWeight || 'bold',
      letterSpacing: badgeConfig.letterSpacing || 1,
      textTransform: badgeConfig.textTransform || 'uppercase',
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: dotColor || vStyle.color,
    },
  });

  return (
    <View style={[styles.container, style]} {...props}>
      {dot && <View style={styles.dot} />}
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

export default Badge;