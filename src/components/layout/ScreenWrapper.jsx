// ScreenWrapper Component - Applies screen config from theme
import React from 'react';
import { View, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { useScreens, useColors } from '../../hooks/useTheme';

export function ScreenWrapper({
  children,
  style,
  scrollable = true,
  safeArea = true,
  safeAreaEdges = ['bottom'],
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  refreshControl,
  onRefresh,
  ...props
}) {
  const screens = useScreens();
  const colors = useColors();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: screens.backgroundColor || colors.bg,
    },
    content: {
      paddingHorizontal: screens.paddingHorizontal,
      paddingVertical: screens.paddingVertical,
      paddingBottom: scrollable ? screens.paddingVertical + 20 : screens.paddingVertical,
    },
  });

  const ContentComponent = scrollable ? ScrollView : View;
  const contentProps = scrollable
    ? {
        contentContainerStyle: [styles.content, contentContainerStyle],
        showsVerticalScrollIndicator,
        keyboardShouldPersistTaps,
        refreshControl,
        onRefresh,
      }
    : { style: [styles.content, contentContainerStyle] };

  const content = (
    <ContentComponent {...contentProps} {...props}>
      {children}
    </ContentComponent>
  );

  if (safeArea) {
    return (
      <SafeAreaView style={styles.container} edges={safeAreaEdges}>
        {content}
      </SafeAreaView>
    );
  }

  return <View style={[styles.container, style]}>{content}</View>;
}

export default ScreenWrapper;