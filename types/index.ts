
export type RootStackParamList = {
  Login: undefined;
  Formularios: undefined;
  ForgetPassword: undefined;
  NuevoPassword: undefined;
 "Detalles del formulario": {
    id: string;
    nombre?: string;
    descripcion?: string;
    detalles?: Array<{
      CampoId: string;
      valor: string;
    }>;
    modo?: string;
  };
  
};

export type Formulario = {
  FormularioId: string;
  Nombre: string; // Nombre del formulario
  Descripcion: string; // Descripción del formulario
  Imagen: string,
  typename?: string
};

export type RespuestaFormulario = {
  RespuestaFormularioId: string; // ID único del formulario
  FormularioId: string; // ID del formulario al que pertenece la respuesta
  UsuarioId: string | null; // ID del usuario que envió la respuesta (opcional)
  detalles: RespuestaDetalle[]; // Array de detalles relacionados con las respuestas a los campos
  formulario: Formulario
};

export type RespuestaDetalle = {
  RespuestaDetalleId: string; // ID único del detalle de la respuesta
  RespuestaFormularioId: string; // ID del formulario al que pertenece este detalle
  CampoId: string; // ID del campo al que corresponde la respuesta
  valor: string; // Valor de la respuesta (puede ser texto, boolean, número, etc.)
};

export type BorradorFormulario = {
  FormularioId: string;
  UsuarioId: string | number | null;
  detalles: {
    CampoId: string | undefined;
    valor: string | null;
  }[];
};


export type Categoria = {
  nombre: string; // Nombre de la categoría
  descripcion?: string; // Descripción de la categoría (opcional)
  campos: CampoType[]; // Array de campos dentro de la categoría
};

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
};

export type Opcion = {
  Valor: string; // Valor de la opción (ejemplo: "SI", "NO")
  HabilitaTexto?: boolean; // Indica si la opción habilita texto adicional
  Placeholder?: string; // Placeholder del texto adicional habilitado
};

export type CampoTipo = "boolean" | "texto" | "opcion" | "imagen";
