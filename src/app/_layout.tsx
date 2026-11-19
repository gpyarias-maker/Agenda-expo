import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ContactosProvider } from '@/context/ContactosContext';
import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <ContactosProvider>
        <AnimatedSplashOverlay />
        <Tabs
          screenOptions={{
            headerShown: true,
            tabBarActiveTintColor: '#2563EB',
            tabBarInactiveTintColor: '#64748B',
            tabBarStyle: {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderTopColor: isDark ? '#334155' : '#E2E8F0',
              height: 60,
              paddingBottom: 8,
              paddingTop: 6,
            },
            headerStyle: {
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
            },
            headerTintColor: isDark ? '#F8FAFC' : '#0F172A',
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 18,
            },
          }}>
          {/* VISTA 1: LISTADO DE CONTACTOS */}
          <Tabs.Screen
            name="index"
            options={{
              title: 'Contactos',
              headerTitle: 'Agenda de Contactos',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? 'people' : 'people-outline'}
                  size={size || 22}
                  color={String(color || '#2563EB')}
                />
              ),
            }}
          />

          {/* VISTA 2: REGISTRAR NUEVO CONTACTO */}
          <Tabs.Screen
            name="nuevo"
            options={{
              title: 'Nuevo',
              headerTitle: 'Registrar Contacto',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? 'person-add' : 'person-add-outline'}
                  size={size || 22}
                  color={String(color || '#2563EB')}
                />
              ),
            }}
          />

          {/* VISTA 3: FAVORITOS Y RESUMEN */}
          <Tabs.Screen
            name="favoritos"
            options={{
              title: 'Favoritos',
              headerTitle: 'Favoritos y Estadísticas',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? 'star' : 'star-outline'}
                  size={size || 22}
                  color={String(color || '#2563EB')}
                />
              ),
            }}
          />

          {/* RUTAS SECUNDARIAS / OCULTAS DE LA BARRA DE PESTAÑAS */}
          <Tabs.Screen
            name="explore"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="contactos"
            options={{
              href: null,
            }}
          />
        </Tabs>
      </ContactosProvider>
    </ThemeProvider>
  );
}
