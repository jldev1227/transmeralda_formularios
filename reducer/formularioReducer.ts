import { FormularioType, RespuestaFormulario } from "types";

export type FormularioState = {
  formularios: FormularioType[];
  respuestas: RespuestaFormulario[];
  isLoading: boolean;
  error: string | null;
};

export const initialFormularioState: FormularioState = {
  formularios: [],
  respuestas: [],
  isLoading: false,
  error: null,
};

export type FormularioAction =
  | { type: "SET_FORMULARIOS"; payload: FormularioType[] }
  | { type: "ADD_FORMULARIO"; payload: FormularioType }
  | { type: "EDIT_FORMULARIO"; payload: { id: string; data: Partial<FormularioType> } }
  | { type: "DELETE_FORMULARIO"; payload: string }
  | { type: "SET_RESPUESTAS"; payload: RespuestaFormulario[] }
  | { type: "ADD_RESPUESTA"; payload: RespuestaFormulario }
  | { type: "ADD_RESPUESTA_OFFLINE"; payload: RespuestaFormulario }
  | { type: "EDIT_RESPUESTA"; payload: { id: string; data: Partial<RespuestaFormulario> } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string };

export const formularioReducer = (state = initialFormularioState, action: FormularioAction) => {
  switch (action.type) {
    // Manejo de formularios
    case "SET_FORMULARIOS":
      return { ...state, formularios: action.payload };
    case "ADD_FORMULARIO":
      return { ...state, formularios: [...state.formularios, action.payload] };
    case "EDIT_FORMULARIO":
      return {
        ...state,
        formularios: state.formularios.map((formulario: FormularioType) =>
          formulario.FormularioId === action.payload.id
            ? { ...formulario, ...action.payload.data }
            : formulario
        ),
      };
    case "DELETE_FORMULARIO":
      return {
        ...state,
        formularios: state.formularios.filter(
          (formulario: FormularioType) => formulario.FormularioId !== action.payload
        ),
      };

    // Manejo de respuestas
    case "SET_RESPUESTAS":
      return { ...state, respuestas: action.payload };
    case "ADD_RESPUESTA":
      return { ...state, respuestas: [...state.respuestas, action.payload] };

    case "ADD_RESPUESTA_OFFLINE":
      return {
        ...state,
        respuestas: [...state.respuestas, { ...action.payload, estado: "pendiente" }],
      };

    case "EDIT_RESPUESTA":
      return {
        ...state,
        respuestas: state.respuestas.map((respuesta: RespuestaFormulario) =>
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
