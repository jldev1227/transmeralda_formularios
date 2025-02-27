import React from 'react';
import { Alert, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LeftArrowCircle from '../components/LeftArrowCircle';
import { Controller, useForm } from 'react-hook-form';
import MailIcon from '../components/MailIcon';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { SOLICITAR_CAMBIO_PASSWORD } from 'graphql/mutation';
import { useMutation } from '@apollo/client';
import AuthLayout from '../layouts/AuthLayout';

const schema = Yup.object().shape({
  correo: Yup.string().email('Correo no válido').required('El correo es obligatorio')
});

export default function ForgetPassword({ navigation }: any) {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const [solicitarCambioPassword, { loading }] = useMutation(SOLICITAR_CAMBIO_PASSWORD);

  const onSubmit = async (data: { correo: string }) => {
    try {
      const response = await solicitarCambioPassword({
        variables: { correo: data.correo },
      });

      if (response?.data?.solicitarCambioPassword) {
        Alert.alert(
          "Solicitud exitosa",
          response.data.solicitarCambioPassword,
          [
            {
              text: "OK",
              onPress: () => {
                // Navega al screen NuevoPassword
                navigation.navigate("NuevoPassword", {
                  correo: data.correo
                });
              },
            },
          ],
          { cancelable: false } // Opcional: evita que cierren el Alert dando clic fuera
        );
      }
    } catch (err: any) {
      console.error("Error en el cliente:", err);

      const errorMessage = err?.graphQLErrors?.[0]?.message || "Error inesperado";
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <AuthLayout>
      <SafeAreaView style={styles.container}>
        <View>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <View style={styles.touchableContainer}>
                <LeftArrowCircle />
              </View>
            </TouchableOpacity>
            <Text style={styles.headerText}>Olvide mi contraseña</Text>
          </View>
          <Text style={styles.description}>Por favor ingresa tu correo para restaurar la contraseña</Text>
        </View>
        <View>
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

        <TouchableOpacity style={styles.buttonSubmit} onPress={handleSubmit(onSubmit)}>
          <Text style={styles.buttonSubmitText}>
            {loading ? 'Cargando...' : 'Solicitar instrucciones'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>

      <View style={{
        flex: 1
      }}>
        <Image
          style={styles.image}
          source={require("assets/codi.png")} // Ajusta la ruta de tu imagen
          resizeMode="contain"
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 15
  },
  touchableContainer: {
    borderRadius: 50, // Esto asegura que el área clickeable sea circular
    overflow: 'hidden', // Requerido para el efecto ripple en Android
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    color: '#888888'
  },
  inputContainer: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9e9e9',
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
  },
});
