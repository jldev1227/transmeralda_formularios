// CardBorrador.tsx
import React, { useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { images } from 'utils/images';
import IconBorrador from './IconBorrador';

interface CardBorradorProps {
  nombre: string;
  descripcion: string;
  imagen: string | null;
  item: any
  onPress?: () => void; // Función opcional a ejecutar al pulsar
}

export default function CardBorrador({ nombre, descripcion, imagen, onPress }: CardBorradorProps) {
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

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress} // Usa la prop onPress
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Image source={images[imagen ?? '']} style={styles.image} />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {nombre}
          </Text>
          <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
            {descripcion}
          </Text>
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
