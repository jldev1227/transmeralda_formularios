// authReducer.ts
export interface Usuario {
    id: number;
    nombre: string;
    apellido: string;
    correo: string;
  }
  
  export interface AuthState {
    isAuthenticated: boolean;
    usuario: Usuario | null;
  }
  
  export type AuthAction =
    | { type: 'SET_AUTH'; payload: Usuario }
    | { type: 'LOGOUT' };
  
  export const initialAuthState: AuthState = {
    isAuthenticated: false,
    usuario: null,
  };
  
  export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
      case 'SET_AUTH':
        return {
          ...state,
          isAuthenticated: true,
          usuario: action.payload,
        };
      case 'LOGOUT':
        return {
          ...state,
          isAuthenticated: false,
          usuario: null,
        };
      default:
        throw new Error(`Unknown action type: ${(action as AuthAction).type}`);
    }
  };
  