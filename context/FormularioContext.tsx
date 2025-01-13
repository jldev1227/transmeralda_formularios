import { useQuery } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OBTENER_FORMULARIOS, OBTENER_RESPUESTAS_POR_USUARIO } from 'graphql/querys';
import { createContext, useReducer, useContext, ReactNode, Dispatch, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { FormularioAction, formularioReducer, FormularioState, initialFormularioState } from "reducer/formularioReducer";
import { useAuth } from './AuthContext';
import { BorradorFormulario, Formulario, RespuestaFormulario } from 'types';

interface FormularioContextProps {
  state: FormularioState;
  dispatch: Dispatch<FormularioAction>;
  guardarFormularioOffline: (formulario: Formulario) => Promise<void>;
  guardarRespuestasOffline: (formularioId: Formulario['FormularioId'], respuestas: BorradorFormulario) => Promise<void>;
  sincronizarFormularios: () => Promise<void>;
  obtenerBorradoresOffline: () => any;
}

const FormularioContext = createContext<FormularioContextProps | undefined>(undefined);

interface FormularioProviderProps {
  children: ReactNode;
}

export const FormularioProvider: React.FC<FormularioProviderProps> = ({ children }) => {
  const { state: auth } = useAuth();
  const [state, dispatch] = useReducer(formularioReducer, initialFormularioState);

  // Obtener formularios
  const { loading: loadingFormularios, error: errorFormularios, data: dataFormularios } = useQuery(OBTENER_FORMULARIOS);

  // Obtener respuestas por usuario
  const { loading: loadingRespuestas, error: errorRespuestas, data: dataRespuestas } = useQuery(OBTENER_RESPUESTAS_POR_USUARIO, {
    variables: { UsuarioId: auth.usuario?.id },
    skip: !auth.usuario?.id, // Evita ejecutar si no hay usuario
  });

  // Cargar formularios al state
  useEffect(() => {
    if (dataFormularios) {
      const formularios = dataFormularios.obtenerFormularios;
      dispatch({ type: 'SET_FORMULARIOS', payload: formularios });
    }
  }, [dataFormularios]);

  // Cargar respuestas al state
  useEffect(() => {
    if (dataRespuestas) {
      const respuestas = dataRespuestas.obtenerRespuestasPorUsuario;
      dispatch({ type: 'SET_RESPUESTAS', payload: respuestas });
    }
  }, [dataRespuestas]);

  // Guardar formularios offline
  const guardarFormularioOffline = async (formulario: any) => {
    try {
      const formulariosOffline = await AsyncStorage.getItem('formulariosOffline');
      const formularios = formulariosOffline ? JSON.parse(formulariosOffline) : [];
      const nuevosFormularios = [...formularios, formulario];

      await AsyncStorage.setItem('formulariosOffline', JSON.stringify(nuevosFormularios));
      dispatch({ type: 'ADD_FORMULARIO', payload: formulario });
    } catch (error) {
      console.error('Error guardando formulario offline:', error);
    }
  };

  const guardarRespuestasOffline = async (formularioId: Formulario['FormularioId'], respuestas: BorradorFormulario) => {
    try {
      const respuestasOffline = await AsyncStorage.getItem('respuestasOffline');
      const respuestasParsed = respuestasOffline ? JSON.parse(respuestasOffline) : [];
      const nuevasRespuestas = [
        ...respuestasParsed,
        { formularioId, UsuarioId: auth.usuario?.id, respuestas },
      ];

      await AsyncStorage.setItem('respuestasOffline', JSON.stringify(nuevasRespuestas));
    } catch (error) {
      console.error('Error guardando respuestas offline:', error);
    }
  };

  // Sincronizar formularios con el backend
  const sincronizarFormularios = async () => {
    try {
      const formulariosOffline = await AsyncStorage.getItem('formulariosOffline');
      if (formulariosOffline) {
        const formularios = JSON.parse(formulariosOffline);
        for (const formulario of formularios) {
        }
        await AsyncStorage.removeItem('formulariosOffline');
      }
    } catch (error) {
      console.error('Error sincronizando formularios:', error);
    }
  };

  const obtenerBorradoresOffline = async (): Promise<BorradorFormulario[]> => {
    try {
      const respuestasOffline = await AsyncStorage.getItem('respuestasOffline');
      return respuestasOffline ? JSON.parse(respuestasOffline) : [];
    } catch (error) {
      console.error('Error al obtener borradores offline:', error);
      return [];
    }
  };


  // Mostrar `loading` mientras se cargan los formularios o respuestas
  if (loadingFormularios || loadingRespuestas) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }

  if (errorFormularios || errorRespuestas) {
    return <Text style={styles.errorText}>Error: {errorFormularios?.message || errorRespuestas?.message}</Text>;
  }

  return (
    <FormularioContext.Provider value={{
      state,
      dispatch,
      guardarFormularioOffline,
      sincronizarFormularios,
      guardarRespuestasOffline,
      obtenerBorradoresOffline
    }}>
      {children}
    </FormularioContext.Provider>
  );
};

// Hook para usar el contexto
export const useFormulario = () => {
  const context = useContext(FormularioContext);
  if (!context) {
    throw new Error("useFormulario debe ser usado dentro de un FormularioProvider");
  }
  return context;
};

// Estilos
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
  },
});
