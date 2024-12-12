import { gql } from '@apollo/client';

export const OBTENER_USUARIO = gql`
 query ObtenerUsuario {
    obtenerUsuario {
      id
      nombre
      apellido
      cc
      correo
      telefono
      rol
    }
  }
`;

export const OBTENER_FORMULARIOS = gql`
  query ObtenerFormularios {
    obtenerFormularios {
      id
      nombre
      descripcion
      campos
    }
  }
`;

export const OBTENER_FORMULARIO = gql`
  query ObtenerFormulario($id: ID!) {
  obtenerFormulario(id: $id) {
    id
    nombre
    descripcion
    campos
  }
}

`;

export const OBTENER_OPCIONES = gql`
  query ObtenerOpciones($fuente: String!, $parametro: String!) {
    obtenerOpciones(fuente: $fuente, parametro: $parametro) {
      valor
      label
      datosExtra
    }
  }
`;