import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  TouchableHighlight,
  Animated,
  Keyboard,
  BackHandler,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useMutation } from "@apollo/client";
import * as SecureStore from "expo-secure-store";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { AUTENTICAR_USUARIO } from "../graphql/mutation";
import RightArrowCircle from "components/RightArrowCircle";
import MailIcon from "components/MailIcon";
import KeyIcon from "components/KeyIcon";
import AuthLayout from "../layouts/AuthLayout";
import { useAuth } from "context/AuthContext";
import SQLite from "react-native-sqlite-storage";

const schema = Yup.object().shape({
  correo: Yup.string()
    .email("Correo no válido")
    .required("El correo es obligatorio"),
  password: Yup.string()
    .min(6, "Mínimo 6 caracteres")
    .required("La contraseña es obligatoria"),
});

export default function LoginScreen({ navigation }: any) {
  const { dispatch } = useAuth();
  const {
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const [areFieldsFilled, setAreFieldsFilled] = useState(false);
  const [imageSize] = useState(new Animated.Value(1));
  const fields = watch();
  const [autenticarUsuario, { loading }] = useMutation(AUTENTICAR_USUARIO);

  useEffect(() => {
    const allFilled = Object.values(fields).every(
      (field) => typeof field === "string" && field.trim() !== ""
    );
    setAreFieldsFilled(allFilled);
  }, [fields]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      Alert.alert("Salir de la aplicación", "¿Deseas salir de la aplicación?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Salir", onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    });
    return () => backHandler.remove();
  }, []);

  const openDatabase = () => {
    return SQLite.openDatabase(
      {
        name: "MyDatabase.db",
        location: "default",
      },
      () => console.log("Base de datos abierta correctamente"),
      (error) => console.error("Error al abrir la base de datos:", error)
    );
  };


  const onSubmit = async (data: { correo: string; password: string }) => {
    const db = await openDatabase();
    try {
      // Autenticar al usuario
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
      await SecureStore.setItemAsync("userToken", token);

      // Verificar que `db` esté disponible antes de usarla
      if (!db) {
        console.error("Error: La base de datos no está inicializada.");
        return;
      }

      // Crear tabla "User" si no existe
      await db.transaction(async (tx) => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS User (
            id TEXT PRIMARY KEY,
            nombre TEXT,
            apellido TEXT,
            correo TEXT,
            imagen TEXT,
            rol TEXT,
            telefono TEXT
          )`,
          [],
          () => console.log('Tabla "User" creada o ya existente.'),
          (_, error) => {
            throw new Error(`Error al crear la tabla "User": ${error.message}`);
          }
        );

        // Insertar usuario en la tabla "User"
        tx.executeSql(
          `INSERT OR REPLACE INTO User (id, nombre, apellido, correo, imagen, rol, telefono)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            usuario.id,
            usuario.nombre,
            usuario.apellido,
            usuario.correo,
            usuario.imagen,
            usuario.rol,
            usuario.telefono,
          ],
          () => console.log('Usuario insertado o actualizado correctamente.'),
          (_, error) => {
            throw new Error(`Error al insertar usuario en la tabla "User": ${error.message}`);
          }
        );
      });

      // Alert.alert('Login exitoso', `Bienvenido, ${usuario.nombre}`);
      // navigation.reset({
      //   index: 0,
      //   routes: [{ name: 'Formularios' }],
      // });
      dispatch({ type: 'SET_AUTH', payload: usuario });

    } catch (err: any) {
      console.error("Error en el cliente:", err);

      // Manejo de errores más detallado
      const errorMessage = err?.graphQLErrors?.[0]?.message || err?.message || "Error inesperado";
      Alert.alert("Error", errorMessage);
    }
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () =>
      Animated.timing(imageSize, {
        toValue: 0.6,
        duration: 150,
        useNativeDriver: true,
      }).start()
    );
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () =>
      Animated.timing(imageSize, {
        toValue: 1,
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
        style={[styles.imageContainer, { transform: [{ scale: imageSize }] }]}
      >
        <Image
          style={styles.image}
          source={require("assets/codi.png")}
          resizeMode="contain"
        />
      </Animated.View>

      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Ingresa a tu cuenta</Text>
          <Text style={styles.description}>
            Gestiona tus tareas y mantén tu información actualizada en
            Transmeralda, todo desde un solo lugar.
          </Text>
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
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
              </View>
            )}
          />
          {errors.correo && (
            <Text style={styles.error}>{errors.correo.message}</Text>
          )}
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
                  placeholderTextColor={"#888888"}
                  secureTextEntry
                  onChangeText={onChange}
                  value={value}
                  autoCapitalize="none"
                />
              </View>
            )}
          />
          {errors.password && (
            <Text style={styles.error}>{errors.password.message}</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.buttonSubmit, !areFieldsFilled && styles.disabledButton]}
          onPress={handleSubmit(onSubmit)}
          disabled={!areFieldsFilled}
        >
          <Text
            style={[
              styles.buttonSubmitText,
              !areFieldsFilled && styles.disabledText,
            ]}
          >
            {loading ? "Cargando..." : "Ingresar"}
          </Text>
        </TouchableOpacity>

        <TouchableHighlight
          style={styles.forgetPassword}
          underlayColor="#DFFFED"
          onPress={() => navigation.navigate("ForgetPassword")}
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
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
  },
  description: {
    fontSize: 14,
    color: "#888888",
  },
  fieldContainer: {
    marginBottom: 15,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: "#e9e9e9",
    padding: 12,
    paddingHorizontal: 10,
    borderRadius: 5,
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
  image: {
    width: 500,
    height: 350,
  },
  forgetPassword: {
    margin: "auto",
    width: 250,
    padding: 10,
    borderRadius: 30,
  },
  content: {
    flexDirection: "row",
    margin: 'auto',
    alignItems: "center",
    gap: 10,
  },
  forgetPasswordText: {
    fontSize: 16,
    color: "#2E8B57",
    textAlign: "center",
  },
  imageContainer: {
    flex: 1,
  },
  disabledButton: {
    backgroundColor: "#eeeeee",
  },
  disabledText: {
    color: "#808080",
  },
});
