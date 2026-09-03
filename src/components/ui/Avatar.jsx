// Avatar Component - Config-driven from theme
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useComponents, useColors, useBorderRadius } from '../../hooks/useTheme';

export function Avatar({
  source,
  name,
  size = 'md',
  style,
  icon = 'person',
  iconColor,
  backgroundColor,
  ...props
}) {
  const components = useComponents();
  const colors = useColors();
  const borderRadius = useBorderRadius();

  const avatarConfig = components.avatar || {};

  const sizeMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 72,
    xxl: 96,
  };

  const dimension = sizeMap[size] || sizeMap.md;
  const radius = avatarConfig[size]?.borderRadius || borderRadius.full;
  const fontSize = dimension * 0.4;

  const styles = StyleSheet.create({
    container: {
      width: dimension,
      height: dimension,
      borderRadius,
      backgroundColor: backgroundColor || 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    image: {
      width: dimension,
      height: dimension,
      borderRadius,
    },
    initials: {
      color: iconColor || colors.gold,
      fontSize,
      fontWeight: '700',
    },
    icon: {
      color: iconColor || colors.gold,
      fontSize: dimension * 0.5,
    },
  });

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={[styles.container, style]} {...props}>
      {source ? (
        <Image source={source} style={styles.image} />
      ) : name ? (
        <Text style={styles.initials}>{getInitials(name)}</Text>
      ) : (
        <Ionicons name={icon} size={dimension * 0.5} style={styles.icon} color={iconColor || colors.gold} />
      )}
    </View>
  );
}

export default Avatar;