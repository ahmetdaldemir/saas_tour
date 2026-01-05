import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from './store/auth.store';
import LoginScreen from './screens/LoginScreen';
import HomeTabs from './navigation/HomeTabs';
import TaskDetailScreen from './screens/TaskDetailScreen';
import CheckoutFlowScreen from './screens/CheckoutFlowScreen';
import ReturnFlowScreen from './screens/ReturnFlowScreen';
import OperationsHomeScreen from './screens/OperationsHomeScreen';
import OperationDetailScreen from './screens/OperationDetailScreen';
import UploadCenterScreen from './screens/UploadCenterScreen';
import { initDatabase } from './storage/database';
import { startQueueProcessor } from './queue/upload-queue';
import { theme } from './styles/theme';

const paperTheme = {
  colors: {
    primary: theme.colors.primary,
    accent: theme.colors.accent,
    background: theme.colors.background,
    surface: theme.colors.surface,
    error: theme.colors.error,
    text: theme.colors.text,
    onSurface: theme.colors.text,
    disabled: theme.colors.textTertiary,
    placeholder: theme.colors.textSecondary,
    backdrop: theme.colors.shadow,
  },
};

const Stack = createStackNavigator();

export default function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    // Initialize database
    initDatabase().catch(console.error);
    
    // Start upload queue processor
    startQueueProcessor();
    
    // Check auth
    checkAuth();
  }, []);

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <>
              <Stack.Screen name="Home" component={HomeTabs} />
              <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
              <Stack.Screen name="CheckoutFlow" component={CheckoutFlowScreen} />
              <Stack.Screen name="ReturnFlow" component={ReturnFlowScreen} />
              <Stack.Screen name="OperationsHome" component={OperationsHomeScreen} />
              <Stack.Screen name="OperationDetail" component={OperationDetailScreen} />
              <Stack.Screen name="UploadCenter" component={UploadCenterScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

