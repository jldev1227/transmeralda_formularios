import React, { useState, useEffect } from 'react';
import { ApolloProvider } from '@apollo/client';
import client from './ApolloClient';
import { DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from 'RootNavigator';
import { AuthProvider } from 'context/AuthContext';

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#fff',
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <ApolloProvider client={client}>
          <AuthProvider>
            <RootNavigator theme={MyTheme}/>
          </AuthProvider>
        </ApolloProvider>
      </GestureHandlerRootView>
  );
}
