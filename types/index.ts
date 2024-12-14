
export type RootStackParamList = {
  Login: undefined;
  Formularios: undefined;
  ForgetPassword: undefined;
  NuevoPassword: undefined;
  "Detalles del formulario": { id: string }; // Ruta con un parámetro `id`
};

export type Formulario = {
  FormularioId: string;
  Nombre: string; // Nombre del formulario
  Descripcion: string; // Descripción del formulario
  typename?: string
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
  valor: string; // Valor de la opción (ejemplo: "SI", "NO")
  habilitaTexto?: boolean; // Indica si la opción habilita texto adicional
  placeholder?: string; // Placeholder del texto adicional habilitado
};

export type CampoTipo = "boolean" | "texto" | "opcion" | "imagen";
