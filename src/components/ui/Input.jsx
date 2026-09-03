// Input Component - Config-driven from theme
import React, { forwardRef, useImperativeHandle } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useComponents, useColors } from '../../hooks/useTheme';

const Input = forwardRef(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  containerStyle,
  labelStyle,
  ...props
}, ref) => {
  const components = useComponents();
  const colors = useColors();
  const [focused, setFocused] = React.useState(false);

  const inputConfig = components.input || {};
  const focusConfig = components.inputFocus || {};

  const styles = StyleSheet.create({
    container: {
      gap: 6,
      width: '100%',
    },
    label: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: focused ? focusConfig.backgroundColor : inputConfig.backgroundColor,
      borderWidth: inputConfig.borderWidth,
      borderColor: focused ? focusConfig.borderColor : inputConfig.borderColor,
      borderRadius: inputConfig.borderRadius,
      paddingHorizontal: inputConfig.paddingHorizontal,
      paddingVertical: inputConfig.paddingVertical,
    },
    input: {
      flex: 1,
      color: inputConfig.color,
      fontSize: inputConfig.fontSize,
      paddingVertical: 0,
      paddingHorizontal: 0,
    },
    icon: {
      color: colors.textSecondary,
      marginHorizontal: 8,
    },
    errorText: {
      color: colors.red,
      fontSize: 11,
      fontWeight: '600',
    },
    helperText: {
      color: colors.textSecondary,
      fontSize: 11,
    },
  });

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    clear: () => inputRef.current?.clear(),
  }));

  const inputRef = React.useRef(null);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View style={styles.inputWrap}>
        {leftIcon && (
          <Ionicons name={leftIcon} size={20} style={styles.icon} color={focused ? colors.gold : colors.textSecondary} />
        )}
        <TextInput
          ref={inputRef}
          style={[styles.input, inputStyle]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.icon}>
            <Ionicons name={rightIcon} size={20} color={focused ? colors.gold : colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
});

Input.displayName = 'Input';

export { Input };
export default Input;