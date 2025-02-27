import React, { useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  Image,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
// GraphQL
import { useMutation } from "@apollo/client";
import { CAMBIAR_PASSWORD, COMFIRMAR_TOKEN_PASSWORD } from "graphql/mutation";
// Layout
import AuthLayout from "../layouts/AuthLayout";
import LeftArrowCircle from "components/LeftArrowCircle";
import KeyIcon from 'components/KeyIcon';

// 1. Esquema para validar el código
const codeSchema = Yup.object().shape({
  codigo: Yup.string()
    .required("El código es obligatorio")
    .length(6, "El código debe tener 6 dígitos"),
});

// 2. Esquema para validar la nueva contraseña
const passwordSchema = Yup.object().shape({
  nuevaPassword: Yup.string()
    .min(6, "Mínimo 6 caracteres")
    .required("La contraseña es obligatoria"),
});

export default function NuevoPassword({ route, navigation }: any) {

  // --------------------------------------------
  // A) FORM PARA VALIDAR CÓDIGO
  // --------------------------------------------
  const {
    control: controlCode,
    handleSubmit: handleSubmitCode,
    formState: { errors: errorsCode },
    setValue: setValueCode,
    watch: watchCode,
  } = useForm({
    resolver: yupResolver(codeSchema),
    defaultValues: { codigo: "" },
  });

  // Refs de inputs para los 6 dígitos
  const inputRefs = Array.from({ length: 6 }, () => useRef<TextInput>(null));

  // Mutation para confirmar token
  const [confirmarTokenPassword, { loading: loadingToken }] = useMutation(COMFIRMAR_TOKEN_PASSWORD);
  const [cambiarPassword, { loading: loadingPassword }] = useMutation(CAMBIAR_PASSWORD);

  // Valor actual de "codigo" (6 dígitos)
  const codigoValue = watchCode("codigo", "");

  // Estado que activa el segundo formulario una vez válido el código
  const [isValid, setIsValid] = useState(false);

  // Lógica para enviar código y validarlo en el servidor
  const onSubmitCode = async () => {
    try {
      // Llamada GraphQL para confirmar token
      const response = await confirmarTokenPassword({
        variables: {
          token: codigoValue, // Tu backend lo recibe como 'token'
        },
      });

      // Si el backend responde exitosamente
      if (response?.data?.confirmarTokenPassword) {
        Alert.alert("Solicitud exitosa", response.data.confirmarTokenPassword, [
          {
            text: "OK",
            onPress: () => setIsValid(true), // Aquí activamos la vista del nuevo password
          },
        ]);
      }
    } catch (err: any) {
      console.error("Error en el cliente:", err);
      const errorMessage = err?.graphQLErrors?.[0]?.message || "Error inesperado";
      Alert.alert("Error", errorMessage);
    }
  };

  // Manejo de cada dígito
  const handleDigitChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);

    const currentCode = codigoValue.split("");
    currentCode[index] = digit;
    const newCode = currentCode.join("");

    setValueCode("codigo", newCode, { shouldValidate: true });

    // Si ingresó un dígito y no es la última casilla, pasar foco al siguiente
    if (digit && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
    // Si está en la última casilla y llenó dígito, cierra el teclado
    if (index === 5 && digit) {
      Keyboard.dismiss();
    }
  };

  // --------------------------------------------
  // B) FORM PARA NUEVA CONTRASEÑA
  // --------------------------------------------
  const {
    control: controlPwd,
    handleSubmit: handleSubmitPwd,
    formState: { errors: errorsPwd },
  } = useForm({
    resolver: yupResolver(passwordSchema),
    defaultValues: { nuevaPassword: "" },
  });

  // Función que ejecuta la lógica final para cambiar la contraseña
  const onSubmitNewPassword = async (data: { nuevaPassword: string }) => {
    try {
      const response = await cambiarPassword({
        variables: {
          correo: route.params.correo,
          token: codigoValue, // Tu backend lo recibe como 'token'
          nuevaPassword: data.nuevaPassword, // Tu backend lo recibe como 'token'
        },
      });

      if (response?.data?.cambiarPassword) {
        Alert.alert(
          "Cambio de contraseña exitoso",
          response.data.cambiarPassword, [
            {
              text: "OK",
              onPress: () => navigation.replace("Login"), // Aquí activamos la vista del nuevo password
            },
          ]
        );
      }
      // Si deseas redirigir luego
      // navigation.replace("Login");
    } catch (err) {
      Alert.alert("Error", "Ocurrió un error al cambiar la contraseña.");
    }
  };

  return (
    <AuthLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <View style={styles.touchableContainer}>
              <LeftArrowCircle />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nueva contraseña</Text>
        </View>

        {!isValid && (
          <>
            <Text style={styles.subtitle}>Por favor ingresa tu código de recuperación</Text>

            <View style={styles.codeContainer}>
              {Array.from({ length: 6 }).map((_, index) => (
                <Controller
                  key={index}
                  control={controlCode}
                  name="codigo"
                  render={() => (
                    <TextInput
                      ref={inputRefs[index]}
                      style={styles.digitInput}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={codigoValue[index] || ""}
                      onChangeText={(text) => handleDigitChange(text, index)}
                    />
                  )}
                />
              ))}
            </View>

            {errorsCode.codigo && (
              <Text style={styles.errorMessage}>{errorsCode.codigo.message}</Text>
            )}

            <TouchableOpacity
              style={[
                styles.buttonSubmit,
                codigoValue.length < 6 && styles.disabledButton,
              ]}
              onPress={handleSubmitCode(onSubmitCode)}
              disabled={codigoValue.length < 6 || loadingToken}
            >
              <Text style={styles.buttonText}>
                {loadingToken ? "Cargando..." : "Validar código"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {isValid && (
          <>
            <Text style={styles.subtitle}>Ingresa tu nueva contraseña</Text>

            <View style={styles.fieldContainer}>
          <Controller
            control={controlPwd}
            name="nuevaPassword"
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
                  autoCapitalize="none"
                />
              </View>
            )}
          />
          {errorsPwd.nuevaPassword && <Text style={styles.error}>{errorsPwd.nuevaPassword.message}</Text>}
        </View>

            <TouchableOpacity
              style={styles.buttonSubmit}
              onPress={handleSubmitPwd(onSubmitNewPassword)}
            >
              <Text style={styles.buttonText}>Cambiar contraseña</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={{ flex: 1 }}>
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
    width: "100%",
  },
  touchableContainer: {
    borderRadius: 50,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    color: "#888888",
    marginBottom: 20,
  },
  codeContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 35,
  },
  digitInput: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: "#2E8B57", // color de borde
    borderRadius: 8,
    textAlign: "center",
    fontSize: 18,
  },
  errorMessage: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  buttonSubmit: {
    backgroundColor: "#2E8B57",
    padding: 15,
    borderRadius: 8,
    alignSelf: "center",
    width: "100%",
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
  },
  newPassContainer: {
    borderWidth: 1,
    borderColor: "#2E8B57",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  newPassInput: {
    fontSize: 16,
    color: "#000",
  },
  image: {
    width: 500,
    height: 350,
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
  fieldContainer: {
    marginBottom: 15
  },
  error: {
    color: 'red',
    fontSize: 12,
  },
});
