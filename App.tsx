import React, { useState, useEffect } from 'react';
import { ApolloProvider, ApolloClient } from '@apollo/client';
import { DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';
import { RootNavigator } from 'RootNavigator';
import { AuthProvider } from 'context/AuthContext';
import { createApolloClient } from 'createApolloClient';

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#fff',
  },
};

export default function App() {
  const [client, setClient] = useState<ApolloClient<any> | null>(null);
  const [isClientReady, setIsClientReady] = useState<boolean>(false);

  useEffect(() => {
    async function initClient() {
      try {
        const apolloClient = await createApolloClient();
        setClient(apolloClient);
        setIsClientReady(true);
      } catch (error) {
        console.error('Error creando ApolloClient con cache persist:', error);
      }
    }

    async function initApp() {
      await initClient(); // Inicializar ApolloClient
    }

    initApp();
  }, []);

  if (!isClientReady || !client) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ApolloProvider client={client}>
          <AuthProvider>
            <RootNavigator theme={MyTheme} />
          </AuthProvider>
        </ApolloProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
