import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { useLazyQuery } from '@apollo/client';
import { OBTENER_OPCIONES } from '../graphql/querys';
import { CampoType } from 'types';

export default function CampoSelector({
  campo,
  formData,
  setFormData,
  disabled,
  handleInputChange,
  defaultValue, // <--- nueva prop
}) {
  const [pickerItems, setPickerItems] = useState([]);
  const [loadOpciones, { loading, error, data }] = useLazyQuery(OBTENER_OPCIONES);

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

  useEffect(() => {
    if (data?.obtenerOpciones?.length) {
      const items = data.obtenerOpciones.map((opcion) => ({
        label: opcion.Label,
        value: opcion.Valor,
      }));
      setPickerItems(items);
    }
  }, [data]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0000ff" />
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

  if (!pickerItems.length) {
    return (
      <Text style={styles.errorText}>
        Cargando opciones, por favor espere...
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{campo.Nombre}</Text>

      <RNPickerSelect
        onValueChange={(value) => {
          const seleccionado = data?.obtenerOpciones.find(
            (item) => item.Valor === value
          );
          if (seleccionado) {
            // Guarda en formData la info que necesites
            setFormData((prev) => ({
              ...prev,
              [campo.CampoId]: seleccionado.datosVehiculo,
            }));
          }
        }}
        items={pickerItems}
        placeholder={{
          label: campo.Descripcion || `${campo.Nombre}`,
          value: null,
        }}
        // Usamos la prop "defaultValue" para marcar el "value" actual
        // (Si necesitas usar "campo.Parametro", ajusta la lógica)
        value={defaultValue ?? null}
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