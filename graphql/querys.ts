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
    FormularioId
    Nombre
    Descripcion
  }
}
`;

export const OBTENER_FORMULARIO = gql`
  query ObtenerFormulario($id: ID!) {
    obtenerFormulario(id: $id) {
      FormularioId
      Nombre
      Descripcion
      categorias { # Debe coincidir con el alias 'categorias'
        CategoriaId
        Nombre
        Descripcion
        campos { 
          CampoId
          Nombre
          Tipo
          Requerido
          Placeholder
          ValorDefecto
          Fuente
          Parametro
          OpcionTrue
          OpcionFalse
          ReferenciaCampo
          ReferenciaPropiedad
          Descripcion
          opciones {
              OpcionId
              Valor
              HabilitaTexto
              TipoTexto
              Placeholder
          }
        }
      }
    }
  }
`;

export const OBTENER_OPCIONES = gql`
  query ObtenerOpciones($fuente: String!, $parametro: String!) {
    obtenerOpciones(fuente: $fuente, parametro: $parametro) {
      Valor
      Label
      datosVehiculo
    }
  }
`;
