import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { useLazyQuery } from '@apollo/client';
import { OBTENER_OPCIONES } from '../graphql/querys';

export default function CampoSelector({ campo, formData, setFormData, disabled }: {
  campo: {
    nombre: string,
    descripcion: string,
    fuente: string,
    parametro: string
  },
  formData: any,
  setFormData: any,
  disabled: boolean
}) {

  const [pickerItems, setPickerItems] = useState([]);
  const [loadOpciones, { loading, error, data }] = useLazyQuery(OBTENER_OPCIONES);

  useEffect(() => {
    if (campo.fuente && campo.parametro) {
      loadOpciones({
        variables: {
          fuente: campo.fuente, // Asegúrate de que este valor coincide con tu backend
          parametro: campo.parametro,  // Asegúrate de que este valor existe en tus datos
        },
      });
    }
  }, [campo.fuente, campo.parametro]);
  
  useEffect(() => {
    if (data?.obtenerOpciones?.length) {
      const items = data.obtenerOpciones.map((opcion: {
        label: string,
        valor: string,
      }) => ({
        label: opcion.label,
        value: opcion.valor,
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
      <Text style={styles.label}>{campo.nombre}</Text>
      <RNPickerSelect
        onValueChange={(value) => {
          const seleccionado = data.obtenerOpciones.find((item: {
            label: string,
            valor: string
          }) => item.valor === value);
          setFormData((prev: any) => ({
            ...prev,
            [campo.nombre]: seleccionado?.datosExtra, // Guarda el objeto completo
          }));
        }}
        items={pickerItems}
        placeholder={{ label: campo.descripcion || `Seleccione un ${campo.nombre}`, value: null }}
        value={formData[campo.nombre]?.[campo.parametro] || null}
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
