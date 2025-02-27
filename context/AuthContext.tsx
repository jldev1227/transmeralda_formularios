import React, {
  createContext,
  useReducer,
  useContext,
  ReactNode,
  Dispatch,
  useEffect,
  useState,
} from "react";
import { useQuery } from "@apollo/client";
import NetInfo from "@react-native-community/netinfo";
import { openDatabase } from "../database"; // Reutilizamos la función de apertura de base de datos

import { OBTENER_USUARIO } from "graphql/querys";
import {
  authReducer,
  initialAuthState,
  AuthState,
  AuthAction,
} from "../reducer/authReducer";

interface AuthContextProps {
  state: AuthState;
  dispatch: Dispatch<AuthAction>;
  isOnline: boolean;
  setIsOnline: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const db = openDatabase(); // Instancia de la base de datos

  // Suscripción a NetInfo
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState) => {
      setIsOnline(netState.isInternetReachable || false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Crear tabla de usuarios
  const createUserTable = async () => {
    try {
      const db = await openDatabase(); // Abrir la base de datos

      // Crear tabla "User"
      const query = `
        CREATE TABLE IF NOT EXISTS User (
          id INTEGER PRIMARY KEY,
          nombre TEXT,
          apellido TEXT,
          correo TEXT,
          rol TEXT,
          telefono TEXT,
          imagen TEXT
        )
      `;

      db.transaction((tx) => {
        tx.executeSql(
          query,
          [],
          () => console.log('Tabla "User" creada correctamente.'),
          (_, error) => console.error('Error al crear la tabla "User":', error)
        );
      });
    } catch (error) {
      console.error('Error inicializando SQLite:', error);
    }
  };

  // Ejecutar creación de la tabla al montar el componente
  useEffect(() => {
    createUserTable();
  }, []);

  // Verificar si el usuario está autenticado (Offline)
  const checkOfflineAuth = async () => {
    try {
      const db = await openDatabase(); // Abrir la base de datos
      const query = `SELECT * FROM User LIMIT 1`;

      await db.transaction(
        (tx) => {
          tx.executeSql(
            query,
            [],
            (_, { rows }) => {
              if (rows.length > 0) {
                const user = rows.item(0);
                dispatch({ type: "SET_AUTH", payload: user });
              } else {
                console.log("No se encontraron usuarios en la base de datos.");
              }
            },
            (_, error) => {
              console.error("Error al consultar la tabla User:", error);
              return true;
            }
          );
        },
        (error) => console.error("Error en la transacción:", error),
        () => console.log("Transacción completada para consultar usuario.")
      )
    } catch (error) {

    }

  };

  // Guardar el usuario en SQLite
  const saveUserToDatabase = async (usuario: any) => {
    const db = await openDatabase()
    try {
      await db.transaction(async (tx) => {
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
          () => {
            dispatch({ type: "SET_AUTH", payload: usuario });
          },
          (_, error) => {
            throw new Error(`Error al insertar usuario en la tabla "User": ${error.message}`);
          }
        );
      });
    } catch (error) {
      console.error(error, 'Error insertando al usuario en la db')      
    }
  };

  // Query para obtener usuario de Apollo
  const { loading, error, data } = useQuery(OBTENER_USUARIO, {
    skip: !isOnline, // Solo realiza la consulta cuando estamos online
  });

  // Guardar el usuario al recibir datos desde Apollo
  useEffect(() => {
    if (data?.obtenerUsuario && isOnline) {
      saveUserToDatabase(data.obtenerUsuario);
    }
  }, [data, isOnline]);

  // Chequear autenticación offline cuando no estamos online
  useEffect(() => {
    if (!isOnline) {
      checkOfflineAuth();
    }
  }, [isOnline]);

  // Manejo de loading y error
  if (loading) return null;
  if (error) {
    console.error("Error al autenticar:", error);
  }

  return (
    <AuthContext.Provider value={{ state, dispatch, isOnline, setIsOnline }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth debe ser usado dentro de un AuthProvider"
    );
  }
  return context;
};
