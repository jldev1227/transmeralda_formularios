import React, { useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableWithoutFeedback, View, Alert } from 'react-native';
import { images } from 'utils/images';
import IconBorrador from './IconBorrador';
import { formatearFechaPersonalizada } from 'utils/formatearFechaPersonalizada';

interface CardBorradorProps {
  RespuestaFormularioId: string;
  nombre: string;
  descripcion: string;
  creacion: string;
  modificacion: string;
  imagen: string | null;
  onPress?: () => void; // Función opcional a ejecutar al pulsar
  onDelete?: (id: string) => void; // Función opcional a ejecutar al confirmar eliminación
}

export default function CardBorrador({ RespuestaFormularioId, nombre, descripcion, imagen, creacion, modificacion, onPress, onDelete }: CardBorradorProps) {
  const [scale] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleLongPress = () => {
    Alert.alert(
      'Eliminar Borrador',
      '¿Estás seguro de que deseas eliminar este borrador?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          onPress: () => {
            if (onDelete) {
              onDelete(RespuestaFormularioId); // Llama a la función de eliminación si está definida
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress} // Usa la prop onPress
      onLongPress={handleLongPress} // Maneja el long press
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        {imagen && (
          <Image source={images[imagen ?? '']} style={styles.image} />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.description} numberOfLines={1} ellipsizeMode="tail">
            Borrador: {RespuestaFormularioId}
          </Text>
          <View>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {nombre}
            </Text>
            <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
              {descripcion}
            </Text>
          </View>
          <View>
            <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">
              Creación: {formatearFechaPersonalizada(creacion)}
            </Text>
            {modificacion && (
              <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">
                Modificación: {formatearFechaPersonalizada(modificacion)}
              </Text>
            )}
          </View>
        </View>
        <IconBorrador />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    width: '100%',
    gap: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    alignItems: 'center',
  },
  image: {
    width: 54,
    height: 54,
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 1,
    flexShrink: 1,
    justifyContent: 'center',
    gap: 10
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  description: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
  },
  date:{
    color: '#666',
  }
});
