import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as SecureStore from 'expo-secure-store';
import SQLite from 'react-native-sqlite-storage'; // Usamos react-native-sqlite-storage

// Configuración inicial de SQLite
SQLite.DEBUG(true);
SQLite.enablePromise(true);

// Abrir la base de datos
const openDatabase = () => {
  return SQLite.openDatabase(
    {
      name: 'MyDatabase.db',
      location: 'default',
    },
    () => console.log('Base de datos abierta correctamente'),
    (error) => console.error('Error al abrir la base de datos:', error)
  );
};

const LogoutButton = ({ navigation }) => {
  const { dispatch } = useAuth();

  const handleLogout = async () => {
    try {
      // Eliminar el token del almacenamiento seguro
      await SecureStore.deleteItemAsync('userToken');

      // Abrir la base de datos
      const db = await openDatabase();

      // Cerrar la conexión a la base de datos
      db.close(
        () => console.log('Base de datos cerrada correctamente.'),
        (error) => console.error('Error al cerrar la base de datos:', error)
      );

      // Eliminar la base de datos
      SQLite.deleteDatabase(
        {
          name: 'MyDatabase.db',
          location: 'default',
        },
        () => console.log('Base de datos eliminada correctamente.'),
        (error) => console.error('Error al eliminar la base de datos:', error)
      );

      // Cambiar el estado global de autenticación
      dispatch({ type: 'LOGOUT' });

      // Navegar a la pantalla de inicio de sesión
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleLogout}>
      <Text style={styles.buttonText}>Cerrar sesión</Text>
    </TouchableOpacity>
  );
};

export default LogoutButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFD6D6',
    padding: 15,
    borderRadius: 8,
    marginTop: 'auto',
  },
  buttonText: {
    color: '#FF6262',
  },
});
