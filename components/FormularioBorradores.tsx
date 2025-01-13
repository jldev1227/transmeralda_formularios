import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { useFormulario } from 'context/FormularioContext';
import CardBorrador from './CardBorrador';
import { useNavigation } from '@react-navigation/native';

export default function BorradoresScreen() {
  const navigation = useNavigation();
  const { state, obtenerBorradoresOffline } = useFormulario();
  const [borradores, setBorradores] = useState<any[]>([]);

  useEffect(() => {
    cargarBorradores();
  }, []);

  const cargarBorradores = async () => {
    try {
      const data = await obtenerBorradoresOffline();
      setBorradores(data);
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un problema al cargar los borradores.', [
        { text: 'Aceptar' },
      ]);
    }
  };

  // Esta función navega a tu pantalla de formulario, pasando los params
    const handleSeleccionarBorrador = (borrador: any) => {
      navigation.navigate('Detalles del formulario', {
        id: borrador.formularioId,
        nombre: borrador.Nombre,
        descripcion: borrador.Descripcion,
        detalles: borrador.detalles, // Indica que ya se respondió (modo enviado)
      });
    }
  

  return (
    <View style={styles.container}>
      {borradores.length === 0 ? (
        <Text style={styles.emptyText}>No tienes borradores guardados.</Text>
      ) : (
        <FlatList
          data={borradores}
          keyExtractor={(_item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            // item = { formularioId, UsuarioId, respuestas, etc. }

            // Puedes buscar meta si lo deseas, p.ej:
            const meta = state.formularios.find(
              (f: any) => f.FormularioId === item.formularioId
            );
            const nombre = meta?.Nombre || 'Sin nombre';
            const descripcion = meta?.Descripcion || 'Sin descripción';
            const imagen = meta?.Imagen; // o 'undefined'

            // Le pasas la función onPress que llama handleSeleccionarBorrador(item)
            return (
              <CardBorrador
                nombre={nombre}
                descripcion={descripcion}
                imagen={imagen ?? ''}
                onPress={() => handleSeleccionarBorrador(item)}
              />
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flexDirection: 'column',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#777',
    fontSize: 16,
  },
});
