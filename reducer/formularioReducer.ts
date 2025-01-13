import { Formulario, RespuestaFormulario } from "types";

export type FormularioState = {
  formularios: Formulario[];
  respuestas: RespuestaFormulario[];
  isLoading: boolean;
  error: string | null;
};
  

export const initialFormularioState : FormularioState = {
    formularios: [], // Array para almacenar formularios
    respuestas: [], // Array para almacenar respuestas de formularios
    isLoading: false,
    error: null,
  };
  
  export type FormularioAction  =
    | { type: "SET_FORMULARIOS"; payload: any[] }
    | { type: "ADD_FORMULARIO"; payload: any }
    | { type: "EDIT_FORMULARIO"; payload: { id: string; data: any } }
    | { type: "DELETE_FORMULARIO"; payload: string }
    | { type: "SET_RESPUESTAS"; payload: any[] }
    | { type: "ADD_RESPUESTA"; payload: any }
    | { type: "EDIT_RESPUESTA"; payload: { id: string; data: any } }
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_ERROR"; payload: string };
  
  export const formularioReducer = (state = initialFormularioState, action: FormularioAction ) => {
    switch (action.type) {
      // Manejo de formularios
      case "SET_FORMULARIOS":
        return { ...state, formularios: action.payload };
      case "ADD_FORMULARIO":
        return { ...state, formularios: [...state.formularios, action.payload] };
      case "EDIT_FORMULARIO":
        return {
          ...state,
          formularios: state.formularios.map((formulario : Formulario) =>
            formulario.FormularioId === action.payload.id
              ? { ...formulario, ...action.payload.data }
              : formulario
          ),
        };
      case "DELETE_FORMULARIO":
        return {
          ...state,
          formularios: state.formularios.filter(
            (formulario : Formulario) => formulario.FormularioId !== action.payload
          ),
        };
  
      // Manejo de respuestas
      case "SET_RESPUESTAS":
        return { ...state, respuestas: action.payload };
      case "ADD_RESPUESTA":
        return { ...state, respuestas: [...state.respuestas, action.payload] };
      case "EDIT_RESPUESTA":
        return {
          ...state,
          respuestas: state.respuestas.map((respuesta : RespuestaFormulario) =>
            respuesta.RespuestaFormularioId === action.payload.id
              ? { ...respuesta, ...action.payload.data }
              : respuesta
          ),
        };
  
      // Otros estados
      case "SET_LOADING":
        return { ...state, isLoading: action.payload };
      case "SET_ERROR":
        return { ...state, error: action.payload };
      default:
        throw new Error(`Acción desconocida: ${action as FormularioAction}`);
    }
  };
  