import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import LeftArrowCircle from "../components/LeftArrowCircle";
import { Controller, useForm } from "react-hook-form";
import KeyIcon from "../components/KeyIcon";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { CAMBIAR_PASSWORD } from "graphql/mutation";
import { useMutation } from "@apollo/client";
import AuthLayout from "../layouts/AuthLayout";

const schema = Yup.object().shape({
  nuevaPassword: Yup.string()
    .min(6, "Mínimo 6 caracteres")
    .required("La contraseña es obligatoria"),
});

export default function NuevoPassword({ navigation, route }: any) {
  const { control, watch, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });
  const [areFieldsFilled, setAreFieldsFilled] = useState(false);
  const [cambiarPassword, { loading }] = useMutation(CAMBIAR_PASSWORD);

  const fields = watch();
  const token = route.params?.token;

  console.log(token)

  useEffect(() => {
    if (!token) {
      throw new Error("Token inválido o ausente");
    }
  }, [token]);

  const onSubmit = async (data: { nuevaPassword: string }) => {
    try {
      const response = await cambiarPassword({
        variables: { token, nuevaPassword: data.nuevaPassword },
      });

      if (response?.data?.cambiarPassword) {
        Alert.alert(
          "Solicitud exitosa",
          response.data.cambiarPassword,
          [{ text: "OK", onPress: () => navigation.replace("Login") }] // Redirige al cerrar el alerta
        );
      }
    } catch (err: any) {
      console.error("Error en el cliente:", err);
      const errorMessage = err?.graphQLErrors?.[0]?.message || "Error inesperado";
      Alert.alert("Error", errorMessage);
    }
  };

  useEffect(() => {
    const allFilled = Object.values(fields).every((field) => {
      return typeof field === "string" && field.trim() !== ""; // Verificar que sea una cadena y no esté vacía
    });
    setAreFieldsFilled(allFilled);
  }, [fields]);

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace("Login");
    }
  };

  return (
    <AuthLayout>
      <View style={styles.container}>
        <View>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleGoBack}>
              <View style={styles.touchableContainer}>
                <LeftArrowCircle />
              </View>
            </TouchableOpacity>
            <Text style={styles.headerText}>Nueva contraseña</Text>
          </View>
          <Text style={styles.description}>Por favor ingresa tu nueva contraseña</Text>
        </View>
        <View>
          <Controller
            control={control}
            name="nuevaPassword"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <KeyIcon />
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa tu nueva contraseña"
                  placeholderTextColor={"#888888"}
                  secureTextEntry
                  onChangeText={onChange}
                  value={value}
                />
              </View>
            )}
          />
          {errors.nuevaPassword && <Text style={styles.error}>{errors.nuevaPassword.message}</Text>}
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
            {loading ? "Cargando..." : "Realizar cambio"}
          </Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flex: 1,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 15,
  },
  touchableContainer: {
    borderRadius: 50, // Esto asegura que el área clickeable sea circular
    overflow: "hidden", // Requerido para el efecto ripple en Android
  },
  headerText: {
    fontSize: 20,
    fontWeight: "700",
  },
  description: {
    fontSize: 14,
    color: "#888888",
  },
  inputContainer: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#F3F3EC",
    padding: 12,
    paddingHorizontal: 10,
    borderRadius: 5,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
  },
  error: {
    color: "red",
    fontSize: 12,
  },
  buttonSubmit: {
    backgroundColor: "#2E8B57",
    padding: 15,
    borderRadius: 8,
  },
  buttonSubmitText: {
    color: "#fff",
    textAlign: "center",
  },
  disabledButton: {
    backgroundColor: "#eeeeee", // Cambia a un color gris cuando está deshabilitado
  },
  disabledText: {
    color: "#808080", // Cambia el texto a gris cuando está deshabilitado
  },
});
