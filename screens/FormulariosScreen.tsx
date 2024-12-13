import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { OBTENER_FORMULARIOS } from '../graphql/querys';
import {
  Text,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Formulario } from 'types';
import { CardFormulario } from 'components/CardFormulario';
import { RootStackParamList } from 'types'; // Asegúrate de importar tu tipo
import HeaderLayout from 'layouts/HeaderLayout';

export default function FormulariosScreen() {
  const { loading, error, data } = useQuery(OBTENER_FORMULARIOS);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  const formularios = data.obtenerFormularios;

  return (
    <ScrollView>
      <HeaderLayout screen={'Formularios'}/>
      <View style={styles.container}>
        {formularios.length > 0 ? (
          formularios.map((formulario: Formulario) => (
            <CardFormulario
              key={formulario.FormularioId}
              formulario={formulario}
              onPress={() => navigation.navigate("Detalles del formulario", { id: formulario.FormularioId })}
            />
          ))
        ) : (
          <Text>No hay formularios disponibles por el momento</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20
  },
  formulario: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000', // Color de la sombra
    shadowOffset: { width: 0, height: 2 }, // Desplazamiento de la sombra
    shadowOpacity: 0.2, // Opacidad de la sombra
    shadowRadius: 4, // Radio de difuminación de la sombra
    elevation: 3, // Sombra para Android
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  descripcion: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
});
