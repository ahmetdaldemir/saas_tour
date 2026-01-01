import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TodayTasksScreen from '../screens/TodayTasksScreen';
import SearchTasksScreen from '../screens/SearchTasksScreen';
import SettingsScreen from '../screens/SettingsScreen';

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
            iconName = focused ? 'magnify' : 'magnify';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'cog' : 'cog-outline';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Today" component={TodayTasksStack} options={{ title: 'Bugün' }} />
      <Tab.Screen name="Search" component={SearchTasksScreen} options={{ title: 'Ara' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ayarlar' }} />
    </Tab.Navigator>
  );
}

