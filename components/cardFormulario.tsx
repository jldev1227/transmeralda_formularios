import React, { useState } from 'react';
import { Text, StyleSheet, TouchableWithoutFeedback, Animated } from 'react-native';
import { Formulario } from 'types';

type CardProps = {
  formulario: Formulario;
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
        <Text style={styles.title}>{formulario.Nombre}</Text>
        <Text style={styles.description}>{formulario.Descripcion}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
});

export default CardFormulario;
