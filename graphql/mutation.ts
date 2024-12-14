import { gql } from '@apollo/client';

export const AUTENTICAR_USUARIO = gql`
  mutation AutenticarUsuario($input: AutenticarInput) {
    autenticarUsuario(req: $input) {
      token
      usuario {
        id
        nombre
        apellido
        correo
        telefono
        rol
        imagen
      }
    }
  }
`;

export const SOLICITAR_CAMBIO_PASSWORD = gql`
  mutation SolicitarCambioPassword($correo: String!) {
    solicitarCambioPassword(correo: $correo)
  }
`;


export const CAMBIAR_PASSWORD = gql`
  mutation CambiarPassword($token: String!, $nuevaPassword: String!) {
    cambiarPassword(token: $token, nuevaPassword: $nuevaPassword)
  }
`;

export const REGISTRAR_RESPUESTA_FORMULARIO = gql`
  mutation RegistrarRespuesta($input: RespuestaFormularioInput!) {
    registrarRespuesta(input: $input) {
      RespuestaFormularioId
      FormularioId
      UsuarioId
      detalles {
        RespuestaDetalleId
        CampoId
        valor
      }
    }
  }
`