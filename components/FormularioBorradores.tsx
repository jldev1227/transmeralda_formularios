import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { useFormulario } from 'context/FormularioContext';
import CardBorrador from './CardBorrador';
import { useNavigation } from '@react-navigation/native';

export default function BorradoresScreen() {
  const navigation = useNavigation();
  const { state, obtenerBorradoresOffline, borrarBorradorOffline } = useFormulario();
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

  // Maneja la selección de un borrador para navegar a su detalle
  const handleSeleccionarBorrador = (borrador) => {
    navigation.navigate('Detalles del formulario', {
      // Asegúrate de usar borrador.id
      id: borrador.id,
  
      // (el resto de props que necesites)
      FormularioId: borrador.FormularioId,
      nombre: borrador.Nombre,
      descripcion: borrador.Descripcion,
      detalles: borrador.detalles,
      modo: 'borrador',
      creacion: borrador.creacion,
      modificacion: borrador.modificacion
    });
  };
  

  const handleEliminarBorrador = async (id: string) => {
    try {
      const borradoresActualizados = await borrarBorradorOffline(id); // Ahora usa el `id` en lugar del índice
      setBorradores(borradoresActualizados); // Actualiza la lista después de eliminar
    } catch (error) {
      console.error('Error al borrar borrador offline:', error);
      // Solo muestra el mensaje de error sin generar una nueva alerta
    }
  };

  return (
    <View style={styles.container}>
      {borradores.length === 0 ? (
        <Text style={styles.emptyText}>No tienes borradores guardados.</Text>
      ) : (
        <FlatList
          data={borradores}
          keyExtractor={(item) => item.id} // Usa el `id` único como clave
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const meta = state.formularios.find(
              (f: any) => f.FormularioId === item.FormularioId
            );
            const nombre = meta?.Nombre || 'Sin nombre';
            const descripcion = meta?.Descripcion || 'Sin descripción';
            const imagen = meta?.Imagen;

            return (
              <CardBorrador
                id={item.id}
                nombre={nombre}
                descripcion={descripcion}
                creacion={item.creacion}
                modificacion={item.modificacion}
                imagen={imagen ?? ''}
                onPress={() => handleSeleccionarBorrador(item)}
                onDelete={() => handleEliminarBorrador(item.id)} // Pasa el `id` único
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
