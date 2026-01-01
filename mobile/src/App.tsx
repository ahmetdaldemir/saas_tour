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

const Stack = createStackNavigator();

export default function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <PaperProvider>
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
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

