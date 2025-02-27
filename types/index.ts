
export type RootStackParamList = {
  Login: undefined;
  Formularios: undefined;
  ForgetPassword: undefined;
  NuevoPassword: undefined;
  "Detalles del formulario": {
    RespuestaFormularioId?: string;
    categorias?: CategoriaType[];
    FormularioId?: string;
    nombre?: string;
    descripcion?: string;
    detalles?: Array<{
      CampoId?: string;
      valor?: string;
    }>;
    modo?: "nuevo" | "borrador" | "enviado";
    creacion?: Date;
    modificacion?: Date;
  };
  index: undefined;
};

export type Usuario = {
  id?: string;
  nombre?: string;
  apellido?: string;
  correo?: string
  rol?: string
}

export type RespuestaFormulario = {
  RespuestaFormularioId: string; // ID único del formulario
  FormularioId: string; // ID del formulario al que pertenece la respuesta
  UsuarioId: string | null; // ID del usuario que envió la respuesta (opcional)
  detalles: RespuestaDetalle[]; // Array de detalles relacionados con las respuestas a los campos
  formulario: FormularioType;
  createdAt: Date
};

export type RespuestaDetalle = {
  RespuestaDetalleId: string; // ID único del detalle de la respuesta
  RespuestaFormularioId: string; // ID del formulario al que pertenece este detalle
  CampoId: string; // ID del campo al que corresponde la respuesta
  valor: string; // Valor de la respuesta (puede ser texto, boolean, número, etc.)
};

export interface BorradorFormulario {
  RespuestaFormularioId?: string;
  FormularioId: string;
  UsuarioId: number;
  detalles: {
    RespuestaDetalleId?: string | undefined;
    CampoId?: string | undefined;
    Valor?: string | null;
    valor?: string | null
  }[];  creacion: string;
  modificacion?: string;
  nombre?: string;        // <-- Con el signo de interrogación
  modo?: 'borrador'|'nuevo'|'enviado';
  descripcion?: string;
  estado: "borrador" | "enviado" | "pendiente",
}

export type OpcionType = {
  OpcionId: number;
  Valor: string;
  HabilitaTexto: boolean;
  TipoTexto?: string;
  Placeholder?: string;
};

export type CampoType = {
  CampoId: string;
  Nombre: string;
  Tipo: string;
  Requerido: boolean;
  Placeholder?: string;
  ValorDefecto?: string;
  Fuente?: string;
  Parametro?: string;
  OpcionTrue?: string;
  OpcionFalse?: string;
  ReferenciaCampo?: string;
  ReferenciaPropiedad?: string;
  Descripcion?: string;
  opciones?: OpcionType[];
  HabilitaTexto?: boolean;
  __typename?: string
};

export type CategoriaType = {
  CategoriaId: string;
  Nombre: string;
  Descripcion?: string;
  campos: CampoType[];
};

export type FormularioType = {
  FormularioId: string;
  Nombre: string;
  Descripcion?: string;
  categorias: CategoriaType[];
  Imagen?: string
};

export type Opcion = {
  Valor: string; // Valor de la opción (ejemplo: "SI", "NO")
  HabilitaTexto?: boolean; // Indica si la opción habilita texto adicional
  Placeholder?: string; // Placeholder del texto adicional habilitado
};

export type CampoTipo = "boolean" | "texto" | "opcion" | "imagen";
