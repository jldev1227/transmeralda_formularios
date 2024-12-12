import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Image, TouchableHighlight, Animated,
  Keyboard, BackHandler
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useMutation } from '@apollo/client';
import * as SecureStore from 'expo-secure-store';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { AUTENTICAR_USUARIO } from '../graphql/mutation';
import RightArrowCircle from 'components/RightArrowCircle';
import MailIcon from 'components/MailIcon';
import KeyIcon from 'components/KeyIcon';
import AuthLayout from '../layouts/AuthLayout';
import { useAuth } from 'context/AuthContext';

const schema = Yup.object().shape({
  correo: Yup.string().email('Correo no válido').required('El correo es obligatorio'),
  password: Yup.string().min(6, 'Mínimo 6 caracteres').required('La contraseña es obligatoria'),
});

export default function LoginScreen({ navigation }: any) {
  const { dispatch } = useAuth();

  const { control, watch, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  // Estado para controlar si todos los campos están llenos
  const [areFieldsFilled, setAreFieldsFilled] = useState(false);

  const [imageSize] = useState(new Animated.Value(1)); // Escala inicial de la imagen

  // Observar todos los campos en tiempo real
  const fields = watch();

  // Comprobar si todos los campos están llenos
  useEffect(() => {
    const allFilled = Object.values(fields).every((field) => {
      return typeof field === 'string' && field.trim() !== ''; // Verificar que sea una cadena y no esté vacía
    });
    setAreFieldsFilled(allFilled);
  }, [fields]);


  const [autenticarUsuario, { loading }] = useMutation(AUTENTICAR_USUARIO);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Bloquea el botón "Atrás"
      Alert.alert(
        'Salir de la aplicación',
        '¿Deseas salir de la aplicación?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', onPress: () => BackHandler.exitApp() },
        ]
      );
      return true; // Previene la acción predeterminada
    });

    return () => backHandler.remove(); // Limpia el evento
  }, []);

  const onSubmit = async (data: { correo: string; password: string }) => {
    try {
      const response = await autenticarUsuario({
        variables: {
          input: {
            correo: data.correo,
            password: data.password,
          },
        },
      });

      const { token, usuario } = response.data.autenticarUsuario;

      // Guardar el token en SecureStore
      await SecureStore.setItemAsync('userToken', token);

      Alert.alert('Login exitoso', `Bienvenido, ${usuario.nombre}`);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Formularios' }],
      });
      dispatch({ type: 'SET_AUTH', payload: usuario });
    } catch (err: any) {
      console.error("Error en el cliente:", err);
      const errorMessage = err?.graphQLErrors?.[0]?.message || "Error inesperado";
      Alert.alert("Error", errorMessage);
    }
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () =>
      Animated.timing(imageSize, {
        toValue: 0.75, // Reducir la imagen al 50%
        duration: 150,
        useNativeDriver: true,
      }).start()
    );
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () =>
      Animated.timing(imageSize, {
        toValue: 1, // Restaurar la imagen
        duration: 150,
        useNativeDriver: true,
      }).start()
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <AuthLayout>
      <Animated.View
        style={[
          styles.imageContainer,
          { transform: [{ scale: imageSize }] }, // Aplicar escala animada
        ]}
      >
        <Image
          style={styles.image}
          source={require("assets/codi.png")} // Ajusta la ruta de tu imagen
          resizeMode="contain"
        />
      </Animated.View>

      <View style={{
        flex: 1,
      }}>
        <View style={styles.header}>
          <Text style={styles.title}>Ingresa a tu cuenta</Text>
          <Text style={styles.description}>Gestiona tus tareas y mantén tu información actualizada en Transmeralda, todo desde un solo lugar.</Text>
        </View>

        <View style={styles.fieldContainer}>
          <Controller
            control={control}
            name="correo"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <MailIcon />
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa tu correo"
                  placeholderTextColor="#888888"
                  onChangeText={onChange}
                  value={value}
                  keyboardType="email-address" // Muestra teclado optimizado para correos
                  autoCapitalize="none" // No capitaliza texto automáticamente
                  autoComplete="email" // Activa la autocompletación para correos
                  textContentType="emailAddress" // Sugerencias basadas en correos guardados
                />
              </View>
            )}
          />
          {errors.correo && <Text style={styles.error}>{errors.correo.message}</Text>}
        </View>

        <View style={styles.fieldContainer}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <KeyIcon />
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor={'#888888'}
                  secureTextEntry
                  onChangeText={onChange}
                  value={value}
                />
              </View>
            )}
          />
          {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
        </View>

        <TouchableOpacity
          style={[
            styles.buttonSubmit,
            !areFieldsFilled && styles.disabledButton, // Aplica estilo si está deshabilitado
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={!areFieldsFilled} // Deshabilita el botón si los campos no están llenos
        >
          <Text
            style={[
              styles.buttonSubmitText,
              !areFieldsFilled && styles.disabledText, // Cambia el color del texto si está deshabilitado
            ]}
          >
            {loading ? "Cargando..." : "Ingresar"}
          </Text>
        </TouchableOpacity>

        <TouchableHighlight
          style={styles.forgetPassword}
          underlayColor="#DFFFED" // Fondo verde claro al presionar
          onPress={() => {
            navigation.navigate('ForgetPassword')
          }}
        >
          <View style={styles.content}>
            <Text style={styles.forgetPasswordText}>Olvidé mi contraseña</Text>
            <RightArrowCircle />
          </View>
        </TouchableHighlight>

      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  description: {
    fontSize: 14,
    color: '#888888'
  },
  fieldContainer: {
    marginBottom: 15
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#F3F3EC',
    padding: 12,
    paddingHorizontal: 10,
    borderRadius: 5,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  input: {
    flex: 1,
  },
  error: {
    color: 'red',
    fontSize: 12,
  },
  buttonSubmit: {
    backgroundColor: '#2E8B57',
    padding: 15,
    borderRadius: 8
  },
  buttonSubmitText: {
    color: '#fff',
    textAlign: 'center'
  },
  image: {
    width: 500,
    height: 350,
    marginTop: 'auto'
  },
  forgetPassword: {
    margin: 'auto',
    width: 250,
    padding: 10,
    borderRadius: 30
  },
  content: {
    margin: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  forgetPasswordText: {
    fontSize: 16,
    color: '#2E8B57',
    textAlign: 'center'
  },
  imageContainer: {
    flex: 1,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: "#eeeeee", // Cambia a un color gris cuando está deshabilitado
  },
  disabledText: {
    color: "#808080", // Cambia el texto a gris cuando está deshabilitado
  }
});
