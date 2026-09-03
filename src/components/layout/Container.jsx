// Container Component - Flexible layout container
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useColors, useSpacing } from '../../hooks/useTheme';

export function Container({
  children,
  style,
  variant = 'default',
  padding = true,
  centered = false,
  row = false,
  gap,
  fill = false,
  ...props
}) {
  const colors = useColors();
  const spacing = useSpacing();

  const variants = {
    default: {
      backgroundColor: 'transparent',
    },
    card: {
      backgroundColor: colors.cardBackground,
    },
    glass: {
      backgroundColor: colors.glass,
    },
    surface: {
      backgroundColor: colors.bgSecondary,
    },
  };

  const v = variants[variant] || variants.default;

  const styles = StyleSheet.create({
    base: {
      ...v,
      flex: fill ? 1 : undefined,
      flexDirection: row ? 'row' : 'column',
      alignItems: centered ? 'center' : undefined,
      justifyContent: centered ? 'center' : undefined,
      gap: gap !== undefined ? gap : spacing.md,
      padding: padding ? spacing.md : 0,
    },
  });

  return (
    <View style={[styles.base, style]} {...props}>
      {children}
    </View>
  );
}

export function Row({
  children,
  style,
  align = 'center',
  justify = 'space-between',
  gap,
  wrap = false,
  ...props
}) {
  const spacing = useSpacing();

  const styles = StyleSheet.create({
    base: {
      flexDirection: 'row',
      flexWrap: wrap ? 'wrap' : 'nowrap',
      alignItems: align,
      justifyContent: justify,
      gap: gap !== undefined ? gap : spacing.md,
    },
  });

  return (
    <View style={[styles.base, style]} {...props}>
      {children}
    </View>
  );
}

export function Column({
  children,
  style,
  align = 'stretch',
  justify = 'flex-start',
  gap,
  ...props
}) {
  const spacing = useSpacing();

  const styles = StyleSheet.create({
    base: {
      flexDirection: 'column',
      alignItems: align,
      justifyContent: justify,
      gap: gap !== undefined ? gap : spacing.md,
    },
  });

  return (
    <View style={[styles.base, style]} {...props}>
      {children}
    </View>
  );
}

export function Flex({
  children,
  style,
  flex = 1,
  ...props
}) {
  const styles = StyleSheet.create({
    base: { flex },
  });
  return <View style={[styles.base, style]} {...props}>{children}</View>;
}

export function Spacer({ size = 'md', horizontal = false }) {
  const spacing = useSpacing();
  return horizontal
    ? <View style={{ width: spacing[size] }} />
    : <View style={{ height: spacing[size] }} />;
}

export default { Container, Row, Column, Flex, Spacer };