import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as SecureStore from 'expo-secure-store';

const LogoutButton = ({ navigation }) => {
  const { dispatch } = useAuth();

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken'); // Elimina el token del almacenamiento
      dispatch({ type: 'LOGOUT' }); // Cambia el estado global
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); // Navega de vuelta al flujo de autenticación
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleLogout}>
      <Text style={styles.buttonText}>Cerrar sesión</Text>
    </TouchableOpacity>
  )
};

export default LogoutButton;


const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFD6D6',
    padding: 15,
    borderRadius: 8,
    marginTop: 'auto'
  },
  buttonText: {
    color: '#FF6262',
  }
})