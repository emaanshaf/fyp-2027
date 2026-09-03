// Section Component - Section title + content
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useScreens, useColors, useTypography } from '../../hooks/useTheme';

export function Section({
  title,
  subtitle,
  action,
  children,
  style,
  titleStyle,
  subtitleStyle,
  actionStyle,
  contentStyle,
  divider = false,
  dividerStyle,
  marginBottom = 24,
}) {
  const screens = useScreens();
  const colors = useColors();
  const typography = useTypography();

  const sectionConfig = screens.sectionTitle || {};

  const styles = StyleSheet.create({
    container: {
      marginBottom,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: sectionConfig.marginBottom || 16,
    },
    title: {
      color: sectionConfig.color || colors.textPrimary,
      fontSize: sectionConfig.fontSize || typography.fontSize.xl,
      fontWeight: sectionConfig.fontWeight || typography.fontWeight.black,
      letterSpacing: typography.letterSpacing.tight,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: typography.fontSize.sm,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginVertical: 16,
    },
    content: {},
  });

  return (
    <View style={[styles.container, style]}>
      {(title || action) && (
        <View style={[styles.header]}>
          <View>
            {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
            {subtitle && <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>}
          </View>
          {action && <View style={actionStyle}>{action}</View>}
        </View>
      )}
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
      {divider && <View style={[styles.divider, dividerStyle]} />}
    </View>
  );
}

export default Section;