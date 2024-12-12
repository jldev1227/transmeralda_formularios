export type RootStackParamList = {
    Login: undefined;
    Formularios: undefined;
    ForgetPassword: undefined;
    NuevoPassword: undefined;
    "Detalles del formulario": { id: string }; // Ruta con un parámetro `id`
  };
  
export type Formulario = {
    id: string;
    nombre: string; // Nombre del formulario
    descripcion: string; // Descripción del formulario
    categorias: Categoria[]; // Array de categorías
    typename?: string
    };
  
  export type Categoria = {
    nombre: string; // Nombre de la categoría
    descripcion?: string; // Descripción de la categoría (opcional)
    campos: Campo[]; // Array de campos dentro de la categoría
  };
  
  export type Campo = {
    nombre: string; // Nombre del campo
    tipo: CampoTipo; // Tipo del campo (boolean, texto, opcion, imagen)
    requerido: boolean; // Indica si el campo es obligatorio
    placeholder?: string; // Placeholder para campos de texto o texto adicional
    opciones?: Opcion[]; // Opciones para campos de tipo "opcion"
    habilitaTexto?: boolean; // Indica si un texto adicional debe habilitarse (solo aplica si el tipo es boolean u opcion)
    tipoTexto?: "text" | "number"; // Tipo del texto adicional (si aplica)
  };
  
  export type Opcion = {
    valor: string; // Valor de la opción (ejemplo: "SI", "NO")
    habilitaTexto?: boolean; // Indica si la opción habilita texto adicional
    placeholder?: string; // Placeholder del texto adicional habilitado
  };
  
  export type CampoTipo = "boolean" | "texto" | "opcion" | "imagen";
  