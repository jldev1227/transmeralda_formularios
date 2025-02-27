import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { useFormulario } from 'context/FormularioContext';
import CardBorrador from './CardBorrador';
import { useNavigation } from '@react-navigation/native';
import { BorradorFormulario, RootStackParamList } from 'types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';


type DetallesNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Detalles del formulario'>;

export default function BorradoresScreen() {
  const navigation = useNavigation<DetallesNavigationProp>();
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

  const handleSeleccionarBorrador = (borrador: BorradorFormulario) => {
    console.log(borrador)
    navigation.navigate("Detalles del formulario", {
      RespuestaFormularioId: borrador.RespuestaFormularioId,
      FormularioId: borrador.FormularioId,
      nombre: borrador.nombre ?? undefined,
      descripcion: borrador.descripcion,
      detalles: borrador.detalles.map(detalle => ({
        CampoId: detalle.CampoId,
        valor: detalle.Valor ?? undefined
      })),
      modo: "borrador",
      creacion: borrador.creacion ? new Date(borrador.creacion) : undefined, // Conversión de string a Date
      modificacion: borrador.modificacion ? new Date(borrador.modificacion) : undefined // Conversión de string a Date
    });
  };


  const handleEliminarBorrador = async (RespuestaFormularioId: string) => {
    try {
      const borradoresActualizados = await borrarBorradorOffline(RespuestaFormularioId); // Ahora usa el `id` en lugar del índice
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
                RespuestaFormularioId={item.RespuestaFormularioId}
                nombre={nombre}
                descripcion={descripcion}
                creacion={item.creacion}
                modificacion={item.modificacion}
                imagen={imagen ?? ''}
                onPress={() => handleSeleccionarBorrador(item)}
                onDelete={() => handleEliminarBorrador(item.RespuestaFormularioId)} // Pasa el `id` único
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
