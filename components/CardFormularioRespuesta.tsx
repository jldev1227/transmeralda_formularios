import React, { useState } from 'react';
import { Text, StyleSheet, TouchableWithoutFeedback, Animated, Image, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RespuestaFormulario, RootStackParamList } from 'types';
import { images } from 'utils/images';
import IconCheckmarkCircle from './IconCheckmarkCircle';
import { convertirTimestamp } from 'utils/convertirTimestamp';


type CardProps = {
  respuesta: RespuestaFormulario;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CardFormularioRespuesta: React.FC<CardProps> = ({ respuesta }) => {
  const navigation = useNavigation<NavigationProp>(); // typed navigation
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

  const handlePress = () => {
    navigation.navigate('Detalles del formulario', {
      FormularioId: respuesta.formulario.FormularioId,
      nombre: respuesta.formulario.Nombre,
      descripcion: respuesta.formulario.Descripcion,
      detalles: respuesta.detalles,
      modo: 'enviado'
    });
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        {respuesta.formulario.Imagen && (
          <Image
            source={images[respuesta.formulario.Imagen ?? '']}
            style={styles.image}
          />
        )}
        <View style={styles.textContainer}>
          <View>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {respuesta.formulario.Nombre}
            </Text>
            <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
              {respuesta.formulario.Descripcion}
            </Text>
          </View>
          <View>
            <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">
              Enviado: {convertirTimestamp(respuesta.createdAt)}
            </Text>
          </View>
        </View>
        <IconCheckmarkCircle />
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
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
  date: {
    color: '#666',
  },
});

export default CardFormularioRespuesta;
