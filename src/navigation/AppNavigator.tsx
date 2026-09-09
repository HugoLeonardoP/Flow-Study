import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamilies } from '@/theme';

import { HomeScreen } from '@/screens/Home/HomeScreen';
import { MateriaFormScreen } from '@/screens/Materia/MateriaFormScreen';
import { MateriaDetailScreen } from '@/screens/Materia/MateriaDetailScreen';
import { PomodoroScreen } from '@/screens/Pomodoro/PomodoroScreen';
import { RevisaoScreen } from '@/screens/Revisao/RevisaoScreen';
import { EstatisticasScreen } from '@/screens/Estatisticas/EstatisticasScreen';

export type HomeStackParamList = {
  HomeMain: undefined;
  MateriaForm: { materiaId?: string } | undefined;
  MateriaDetail: { materiaId: string };
  Pomodoro: { materiaId?: string } | undefined;
};

export type RootTabParamList = {
  HomeStack: undefined;
  Revisoes: undefined;
  Estatisticas: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.paper },
  headerShadowVisible: false,
  headerTitleStyle: { fontFamily: fontFamilies.bodySemiBold, color: colors.ink, fontSize: 17 },
  headerTintColor: colors.ink,
  contentStyle: { backgroundColor: colors.paper },
};

function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'FlowStudy' }} />
      <Stack.Screen
        name="MateriaForm"
        component={MateriaFormScreen}
        options={{ title: 'Nova matéria' }}
      />
      <Stack.Screen
        name="MateriaDetail"
        component={MateriaDetailScreen}
        options={{ title: 'Matéria' }}
      />
      <Stack.Screen
        name="Pomodoro"
        component={PomodoroScreen}
        options={{ title: 'Sessão de foco', headerBackTitle: 'Sair' }}
      />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.amberDark,
          tabBarInactiveTintColor: colors.inkFaint,
          tabBarStyle: {
            backgroundColor: colors.paperRaised,
            borderTopColor: colors.border,
            height: 62,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontFamily: fontFamilies.bodyMedium, fontSize: 11 },
          tabBarIcon: ({ color, size }) => {
            const iconesPorRota: Record<string, keyof typeof Ionicons.glyphMap> = {
              HomeStack: 'home',
              Revisoes: 'repeat',
              Estatisticas: 'stats-chart',
            };
            return <Ionicons name={iconesPorRota[route.name]} size={size - 2} color={color} />;
          },
        })}
      >
        <Tab.Screen name="HomeStack" component={HomeStackNavigator} options={{ title: 'Início' }} />
        <Tab.Screen name="Revisoes" component={RevisaoScreen} options={{ title: 'Revisões' }} />
        <Tab.Screen
          name="Estatisticas"
          component={EstatisticasScreen}
          options={{ title: 'Estatísticas' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
