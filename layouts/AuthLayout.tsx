import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

interface AuthLayoutProps {
  children: React.ReactNode; // Los componentes hijos que serán renderizados dentro del layout
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.innerContainer}>{children}</View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7', // Fondo para las pantallas de autenticación
},
innerContainer: {
    flex: 1,
    padding: 20, // Padding horizontal uniforme
    alignItems: 'center', // Centra el contenido horizontalmente
  },
});

export default AuthLayout;
