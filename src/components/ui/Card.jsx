import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColors, useShadows, useBorderRadius, useTypography, useComponents } from '../../hooks/useTheme';

export function Card({
  variant = 'default',
  children,
  style,
  onPress,
  pressedOpacity = 0.9,
  ...props
}) {
  const components = useComponents();
  const shadows = useShadows();
  const borderRadius = useBorderRadius();

  const cardConfig = components.card || {};
  const shadowConfig = shadows.md || {};

  const containerStyle = {
    backgroundColor: cardConfig.backgroundColor || '#1e293b',
    borderRadius: borderRadius.lg || 20,
    borderWidth: cardConfig.borderWidth || 1,
    borderColor: cardConfig.borderColor || 'rgba(255, 255, 255, 0.1)',
    padding: cardConfig.padding || 16,
    ...shadowConfig,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[containerStyle, style]}
        onPress={onPress}
        activeOpacity={pressedOpacity}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[containerStyle, style]} {...props}>
      {children}
    </View>
  );
}

export function CardHeader({ title, subtitle, action, style }) {
  const colors = useColors();
  const typography = useTypography();

  return (
    <View style={[headerStyles.container, style]}>
      <View style={headerStyles.titleWrap}>
        {title && <Text style={[headerStyles.title, { color: colors.textPrimary, fontSize: typography?.fontSize?.lg || 18 }]}>{title}</Text>}
        {subtitle && <Text style={[headerStyles.subtitle, { color: colors.textSecondary, fontSize: typography?.fontSize?.sm || 12 }]}>{subtitle}</Text>}
      </View>
      {action}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  titleWrap: { flex: 1 },
  title: { fontWeight: '700' },
  subtitle: { marginTop: 2 },
});

export function CardContent({ children, style }) {
  return <View style={style}>{children}</View>;
}

export function CardFooter({ children, style, bordered = true }) {
  const colors = useColors();

  return (
    <View style={[footerStyles.container, { borderTopColor: colors.divider || 'rgba(255,255,255,0.1)' }, bordered && footerStyles.bordered, style]}>
      {children}
    </View>
  );
}

const footerStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 12, paddingTop: 12 },
  bordered: { borderTopWidth: 1 },
});

export default Card;
