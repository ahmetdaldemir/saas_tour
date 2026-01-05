import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
// @ts-ignore - @expo/vector-icons types may not be available
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TodayTasksScreen from '../screens/TodayTasksScreen';
import SearchTasksScreen from '../screens/SearchTasksScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OperationsHomeScreen from '../screens/OperationsHomeScreen';
import UploadCenterScreen from '../screens/UploadCenterScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TodayTasksStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TodayTasks"
        component={TodayTasksScreen}
        options={{ title: 'Bugünün Görevleri' }}
      />
    </Stack.Navigator>
  );
}

export default function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Today') {
            iconName = focused ? 'calendar-today' : 'calendar-outline';
          } else if (route.name === 'Search') {
            iconName = 'magnify';
          } else if (route.name === 'Operations') {
            iconName = focused ? 'car-multiple' : 'car-multiple-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'cog' : 'cog-outline';
          } else {
            iconName = 'help-circle';
          }

          return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingTop: 8,
          paddingBottom: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Today" component={TodayTasksStack} options={{ title: 'Bugün' }} />
      <Tab.Screen name="Search" component={SearchTasksScreen} options={{ title: 'Ara' }} />
      <Tab.Screen name="Operations" component={OperationsHomeScreen} options={{ title: 'Operasyonlar' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ayarlar' }} />
    </Tab.Navigator>
  );
}

