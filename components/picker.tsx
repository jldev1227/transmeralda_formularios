import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { useLazyQuery } from '@apollo/client';
import { OBTENER_OPCIONES } from '../graphql/querys';
import { CampoType } from 'types';

export default function CampoSelector({
  campo,
  defaultValue,
  handleInputChange,
  disabled,
}) {

  const [pickerItems, setPickerItems] = useState([]);
  const [loadOpciones, { loading, error, data }] = useLazyQuery(OBTENER_OPCIONES);
  const [selected, setSelected] = useState('');


  useEffect(() => {
    if (defaultValue) {
      setSelected(defaultValue);
    }
  }, [defaultValue]);

  useEffect(() => {
    if (data?.obtenerOpciones?.length) {
      const items = data.obtenerOpciones.map((opcion) => ({
        label: opcion.Label,
        value: opcion.Valor,
      }));
      setPickerItems(items);
    }
  }, [data]);

  useEffect(() => {
    if (campo.Fuente && campo.Parametro) {
      loadOpciones({
        variables: {
          fuente: campo.Fuente,
          parametro: campo.Parametro,
        },
      });
    }
  }, [campo.Fuente, campo.Parametro]);

  if (loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10
      }}>
        <ActivityIndicator size="large" color="#2E8B57" />;
        <Text style={{
          fontSize: 16,
          color: '#2E8B57',
        }}>Cargando opciones...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <Text style={styles.errorText}>
        Error al cargar opciones: {error.message}
      </Text>
    );
  }

  if (!data?.obtenerOpciones?.length) return

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{campo.Nombre}</Text>

      <RNPickerSelect
        onValueChange={(value) => {
          setSelected(value);

          const seleccionado = data?.obtenerOpciones?.find(
            (item) => item.Valor === value // Asegúrate de que el valor coincida exactamente
          );

          if (seleccionado) {
            handleInputChange(campo.CampoId, seleccionado);
          }
        }}

        items={pickerItems}
        placeholder={{
          label: campo.Placeholder,
          valor: null,
        }}
        // Usamos la prop "defaultValue" para marcar el "value" actual
        // (Si necesitas usar "campo.Parametro", ajusta la lógica)
        value={selected}
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={false}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
  },
  loadingContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    color: 'black',
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    color: 'black',
    paddingRight: 30,
  },
};