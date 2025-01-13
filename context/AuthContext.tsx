import React, { createContext, useReducer, useContext, ReactNode, Dispatch, useEffect } from 'react';
import { authReducer, initialAuthState, AuthState, AuthAction } from '../reducer/authReducer';
import { useQuery } from '@apollo/client';
import { OBTENER_USUARIO } from 'graphql/querys';

interface AuthContextProps {
  state: AuthState;
  dispatch: Dispatch<AuthAction>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  const { loading, error, data } = useQuery(OBTENER_USUARIO);

  
  useEffect(() => {
    if (data?.obtenerUsuario) {
      dispatch({ type: 'SET_AUTH', payload: data.obtenerUsuario });
    }
  }, [data]);

  if (loading) return null; // Puedes agregar un indicador de carga aquí
  if (error) console.error('Error al autenticar:', error);

  return <AuthContext.Provider value={{ state, dispatch }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
