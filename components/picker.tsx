import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { useLazyQuery } from '@apollo/client';
import { OBTENER_OPCIONES } from '../graphql/querys';
import { CampoType } from 'types';

export default function CampoSelector({ campo, formData, setFormData, disabled }: {
  campo: CampoType,
  formData: any,
  setFormData: any,
  disabled: boolean,
  handleInputChange: (campoNombre: string, value: any) => void;
}) {
  const [pickerItems, setPickerItems] = useState([]);
  const [loadOpciones, { loading, error, data }] = useLazyQuery(OBTENER_OPCIONES);

  useEffect(() => {
    if (campo.Fuente && campo.Parametro) {
      loadOpciones({
        variables: {
          fuente: campo.Fuente, // Asegúrate de que este valor coincide con tu backend
          parametro: campo.Parametro,  // Asegúrate de que este valor existe en tus datos
        },
      });
    }
  }, [campo.Fuente, campo.Parametro]);

  useEffect(() => {
    if (data?.obtenerOpciones?.length) {
      const items = data.obtenerOpciones.map((opcion: {
        Label: string,
        Valor: string,
      }) => ({
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
    return <Text style={styles.errorText}>Error al cargar opciones: {error.message}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{campo.Nombre}</Text>
      <RNPickerSelect
        onValueChange={(value) => {
          const seleccionado = data.obtenerOpciones.find((item: { Label: string; Valor: string }) => item.Valor === value);

          if (seleccionado) {
            setFormData((prev) => ({
              ...prev,
              [campo.Nombre]: seleccionado.datosVehiculo, // Guarda el objeto completo del vehículo
            }));
          }
        }}
        items={pickerItems}
        placeholder={{ label: campo.Descripcion || `${campo.Nombre}`, value: null }}
        value={campo.Parametro ? formData[campo.Nombre]?.[campo.Parametro] : null} // Valida campo.Parametro
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={false}
        disabled={disabled} // Deshabilita el picker
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