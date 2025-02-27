import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { Text, StyleSheet, TouchableWithoutFeedback, Animated } from 'react-native';
import { images } from 'utils/images';
import IconClipboardOutline from './IconClipboardOutline';
import { FormularioType } from 'types';

type CardProps = {
  formulario: FormularioType;
  onPress: () => void;
};

export const CardFormulario: React.FC<CardProps> = ({ formulario, onPress }) => {
  const [scale] = useState(new Animated.Value(1)); // Estado inicial de la escala

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95, // Reduce ligeramente el tamaño
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1, // Restaura el tamaño original
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        {formulario.Imagen && (
          <Image
            source={images[formulario.Imagen]}
            style={styles.image}
          />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {formulario.Nombre}
          </Text>
          <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
            {formulario.Descripcion}
          </Text>
        </View>
        <IconClipboardOutline />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    width: '100%',
    gap: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    alignItems: 'center'
  },
  image: {
    width: 54,
    height: 54,
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 1, // Ocupa el espacio restante
    flexShrink: 1, // Se ajusta si el espacio es insuficiente
    justifyContent: 'center',
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
});

export default CardFormulario;
