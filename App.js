import 'react-native-gesture-handler';
import React from 'react';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#05070a" translucent={false} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

registerRootComponent(App);

export default App;
