// Button Component - Config-driven from theme
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useButtons } from '../../hooks/useTheme';

const variantStyles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onPress,
  disabled,
  loading,
  style,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  ...props
}) {
  const buttons = useButtons();
  const config = buttons[variant] || buttons.primary;
  const sizeConfig = buttons.sizes[size] || buttons.sizes.md;

  const isDisabled = disabled || loading;
  const opacity = isDisabled ? config.disabledOpacity : 1;

  const styles = StyleSheet.create({
    container: {
      ...variantStyles.base,
      backgroundColor: config.backgroundColor,
      borderColor: config.borderColor,
      borderWidth: config.borderWidth,
      borderRadius: sizeConfig.borderRadius,
      height: sizeConfig.height,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      opacity,
      width: fullWidth ? '100%' : undefined,
    },
    text: {
      color: config.textColor,
      fontSize: sizeConfig.fontSize,
      fontWeight: '700',
    },
    icon: {
      width: sizeConfig.iconSize,
      height: sizeConfig.iconSize,
    },
  });

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={config.pressedOpacity}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={config.loadingColor || config.textColor} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Text style={styles.icon}>{icon}</Text>
          )}
          <Text style={styles.text}>{children}</Text>
          {icon && iconPosition === 'right' && (
            <Text style={styles.icon}>{icon}</Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

export default Button;