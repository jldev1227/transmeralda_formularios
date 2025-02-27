import React, {
  createContext,
  useReducer,
  useContext,
  ReactNode,
  Dispatch,
  useEffect
} from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import SQLite from 'react-native-sqlite-storage';
import NetInfo from '@react-native-community/netinfo';

import {
  OBTENER_FORMULARIOS,
  OBTENER_RESPUESTAS_POR_USUARIO
} from 'graphql/querys';

import {
  FormularioAction,
  formularioReducer,
  FormularioState,
  initialFormularioState
} from 'reducer/formularioReducer';

import { useAuth } from './AuthContext';
import { BorradorFormulario, FormularioType, Usuario } from 'types';
import { openDatabase } from 'database';
import { REGISTRAR_RESPUESTA_FORMULARIO } from 'graphql/mutation';

// Configuración inicial de SQLite
SQLite.DEBUG(true);
SQLite.enablePromise(true);

interface FormularioContextProps {
  state: FormularioState;
  dispatch: Dispatch<FormularioAction>;

  guardarFormularioOffline: (formulario: FormularioType) => Promise<void>;
  guardarRespuestasOffline: (
    formularioId: FormularioType['FormularioId'],
    borrador: BorradorFormulario
  ) => Promise<void>;
  obtenerBorradoresOffline: () => Promise<BorradorFormulario[]>;
  borrarBorradorOffline: (id: string) => Promise<BorradorFormulario[]>;
  registrarRespuestaFetch: (input: {
    FormularioId: FormularioType['FormularioId'] | null
    UsuarioId: Usuario['id'] | null
    detalles: any
  }) => Promise<void>
}

const FormularioContext = createContext<FormularioContextProps | undefined>(undefined);

interface FormularioProviderProps {
  children: ReactNode;
}


export const FormularioProvider: React.FC<FormularioProviderProps> = ({ children }) => {
  const { state: auth, isOnline, setIsOnline } = useAuth();
  const [state, dispatch] = useReducer(formularioReducer, initialFormularioState);

  // -- Queries de Apollo (los usamos con skip para que se ejecuten sólo si estamos online)
  const {
    data: dataFormularios,
    loading: loadingFormularios,
    error: errorFormularios,
    refetch: refetchFormularios
  } = useQuery(OBTENER_FORMULARIOS, {
    variables: { userId: auth.usuario?.id },
    skip: !isOnline // si estamos offline, no ejecutes este query
  });

  const {
    data: dataRespuestas,
    loading: loadingRespuestas,
    error: errorRespuestas,
    refetch: refetchRespuestas
  } = useQuery(OBTENER_RESPUESTAS_POR_USUARIO, {
    variables: { UsuarioId: auth.usuario?.id },
    skip: !isOnline
  });

  const [registrarRespuesta] = useMutation(REGISTRAR_RESPUESTA_FORMULARIO);

  // Cada vez que cambie la conectividad, hacemos la lógica correspondiente
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState) => {
      const isNowOnline = !!netState.isConnected && !!netState.isInternetReachable;
      setIsOnline(isNowOnline);

      if (!isNowOnline) {
        // Si acabamos de quedarnos offline, cargamos todo desde SQLite
        obtenerFormulariosOffline()
          .then((formularios) => console.log("✅ Formularios offline cargados:", formularios))
          .catch((error) => console.error("❌ Error al cargar formularios offline:", error));
      } else {
        // Si acabamos de conectarnos, forzamos un refetch para traer info fresca del servidor
        refetchFormularios();
        refetchRespuestas();
      }
    });

    return () => unsubscribe();
  }, []);

  // Cuando cambien los datos de formularios (al hacer refetch y estar online),
  // guardamos esos formularios en SQLite y también los ponemos en el estado global.
  useEffect(() => {
    if (dataFormularios?.obtenerFormularios && isOnline) {
      const formularios = dataFormularios.obtenerFormularios as FormularioType[];

      // Guarda en SQLite y en el estado global
      formularios.forEach((form) => {
        guardarFormularioOffline(form);
      });

      dispatch({ type: 'SET_FORMULARIOS', payload: formularios });
    }
  }, [dataFormularios, isOnline]);

  // Si obtienes también respuestas, podrías guardar algo en SQLite de modo similar
  useEffect(() => {
    if (dataRespuestas?.obtenerRespuestasPorUsuario && isOnline) {
      // Aquí podrías guardar esas respuestas en tu tabla 'Respuestas' o 'DetallesRespuestas'
      const respuestas = dataRespuestas.obtenerRespuestasPorUsuario;

      console.log(respuestas, "respuestas obtenidas")
      dispatch({ type: 'SET_RESPUESTAS', payload: respuestas });

    }
  }, [dataRespuestas, isOnline]);

  // Creación de tablas en SQLite
  const crearTablas = async () => {
    const db = await openDatabase();

    db.transaction((tx) => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS Formularios (
          FormularioId TEXT PRIMARY KEY,
          Nombre TEXT,
          Descripcion TEXT,
          Imagen TEXT
        )`,
        [],
        () => console.log('✅ Tabla Formularios creada.'),
        (error) => console.error('❌ Error al crear la tabla Formularios:', error)
      );

      // Tabla de categorías
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS Categorias (
          CategoriaId TEXT PRIMARY KEY,
          FormularioId TEXT,
          Nombre TEXT,
          Descripcion TEXT
        )`,
        [],
        () => console.log('✅ Tabla Categorias creada.'),
        (error) => console.error('❌ Error al crear la tabla Categorias:', error)
      );

      // Tabla de campos
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS Campos (
          CampoId TEXT PRIMARY KEY,
          CategoriaId TEXT,
          Nombre TEXT,
          Tipo TEXT,
          Requerido INTEGER,
          Placeholder TEXT,
          ValorDefecto TEXT,
          Fuente TEXT,
          Parametro TEXT,
          OpcionTrue TEXT,
          OpcionFalse TEXT,
          ReferenciaCampo TEXT,
          ReferenciaPropiedad TEXT,
          Descripcion TEXT
        )`,
        [],
        () => console.log('✅ Tabla Campos creada.'),
        (error) => console.error('❌ Error al crear la tabla Campos:', error)
      );

      // Tabla de opciones para los campos
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS Opciones (
          OpcionId TEXT PRIMARY KEY,
          CampoId TEXT,
          Valor TEXT,
          HabilitaTexto INTEGER,
          TipoTexto TEXT,
          Placeholder TEXT
        )`,
        [],
        () => console.log('✅ Tabla Opciones creada.'),
        (error) => console.error('❌ Error al crear la tabla Opciones:', error)
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS Respuestas (
          RespuestaFormularioId TEXT PRIMARY KEY,
          FormularioId TEXT,
          UsuarioId TEXT,
          creacion TEXT,
          modificacion TEXT,
          estado DEFAULT 'borrador'
        )`,
        [],
        () => console.log('Tabla Respuestas creada.'),
        (error) => console.error('Error al crear la tabla Respuestas:', error)
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS DetallesRespuestas (
          RespuestaDetalleId TEXT PRIMARY KEY,
          RespuestaFormularioId TEXT,
          CampoId TEXT,
          Valor TEXT
        )`,
        [],
        () => console.log('Tabla DetallesRespuestas creada.'),
        (error) => console.error('Error al crear la tabla DetallesRespuestas:', error)
      );
    });
  };

  // Creamos las tablas al montar este Provider
  useEffect(() => {
    crearTablas();
  }, []);

  // -- Métodos para interactuar con SQLite --

  // Guardar un formulario en SQLite
  const guardarFormularioOffline = async (formulario: FormularioType) => {
    const db = await openDatabase();

    db.transaction((tx) => {
      // Guardar el formulario
      tx.executeSql(
        `INSERT OR REPLACE INTO Formularios (FormularioId, Nombre, Descripcion, Imagen)
         VALUES (?, ?, ?, ?)`,
        [formulario.FormularioId, formulario.Nombre, formulario.Descripcion, formulario.Imagen],
        () => console.log('✅ Formulario guardado offline:', formulario.FormularioId),
        (error) => console.error('❌ Error al guardar formulario:', error)
      );

      // Guardar las categorías asociadas al formulario
      formulario.categorias.forEach((categoria) => {
        tx.executeSql(
          `INSERT OR REPLACE INTO Categorias (CategoriaId, FormularioId, Nombre, Descripcion)
           VALUES (?, ?, ?, ?)`,
          [categoria.CategoriaId, formulario.FormularioId, categoria.Nombre, categoria.Descripcion],
          () => console.log('✅ Categoría guardada offline:', categoria.CategoriaId),
          (error) => console.error('❌ Error al guardar categoría:', error)
        );

        // Guardar los campos de cada categoría
        categoria.campos.forEach((campo) => {
          tx.executeSql(
            `INSERT OR REPLACE INTO Campos (
              CampoId, CategoriaId, Nombre, Tipo, Requerido, Placeholder, ValorDefecto, Fuente, 
              Parametro, OpcionTrue, OpcionFalse, ReferenciaCampo, ReferenciaPropiedad, Descripcion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              campo.CampoId,
              categoria.CategoriaId,
              campo.Nombre,
              campo.Tipo,
              campo.Requerido ? 1 : 0,
              campo.Placeholder,
              campo.ValorDefecto,
              campo.Fuente,
              campo.Parametro,
              campo.OpcionTrue,
              campo.OpcionFalse,
              campo.ReferenciaCampo,
              campo.ReferenciaPropiedad,
              campo.Descripcion,
            ],
            () => console.log('✅ Campo guardado offline:', campo.CampoId),
            (error) => console.error('❌ Error al guardar campo:', error)
          );

          // Guardar las opciones de los campos si existen
          if (campo.opciones && campo.opciones.length > 0) {
            campo.opciones.forEach((opcion) => {
              tx.executeSql(
                `INSERT OR REPLACE INTO Opciones (
                  OpcionId, CampoId, Valor, HabilitaTexto, TipoTexto, Placeholder
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  opcion.OpcionId,
                  campo.CampoId,
                  opcion.Valor,
                  opcion.HabilitaTexto ? 1 : 0,
                  opcion.TipoTexto,
                  opcion.Placeholder,
                ],
                () => console.log('✅ Opción guardada offline:', opcion.OpcionId),
                (error) => console.error('❌ Error al guardar opción:', error)
              );
            });
          }
        });
      });
    });
  };

  const registrarRespuestaFetch = async (input) => {
    try {
      const response = await registrarRespuesta({ variables: { input } });
      const dataResp = response?.data?.registrarRespuesta;

      dispatch({
        type: 'ADD_RESPUESTA',
        payload: dataResp,
      });
    } catch (error: any) {
      console.error("❌ Error al registrar respuesta:", error);

      // Verificamos si el error es de red (sin conexión)
      if (!isOnline || error.networkError) {
        console.log("⚠️ Guardando respuesta en SQLite con estado 'pendiente' debido a error de red.");

        await guardarRespuestasOffline(input.FormularioId, {
          RespuestaFormularioId: input.RespuestaFormularioId || `PENDIENTE_${Date.now()}`,
          FormularioId: input.FormularioId,
          UsuarioId: input.UsuarioId,
          creacion: new Date().toISOString(),
          modificacion: new Date().toISOString(),
          estado: "pendiente", // Estado de respuesta pendiente
          detalles: input.detalles,
        });

        dispatch({
          type: 'ADD_RESPUESTA_OFFLINE',
          payload: {
            ...input,
            estado: "pendiente"
          },
        });
      }
    }
  };

  // Obtener todos los formularios desde SQLite
  const obtenerFormulariosOffline = async (): Promise<void> => {
    const db = await openDatabase();

    const response = new Promise<FormularioType[]>((resolve, reject) => {
      db.transaction((tx) => {
        // Obtener todos los formularios
        tx.executeSql(
          `SELECT * FROM Formularios`,
          [],
          async (_, { rows: formulariosRows }) => {
            if (formulariosRows.length === 0) {
              console.log("⚠️ No hay formularios almacenados offline.");
              resolve([]);
              return;
            }

            console.log(formulariosRows, 'rows')

            const formularios: FormularioType[] = [];

            // // Procesar cada formulario
            for (let i = 0; i < formulariosRows.length; i++) {
              const formulario = formulariosRows.item(i);


              console.log(formulario, 'formss')
              // Crear estructura del formulario
              const formularioData: FormularioType = {
                FormularioId: formulario.FormularioId,
                Nombre: formulario.Nombre,
                Descripcion: formulario.Descripcion,
                Imagen: formulario.Imagen,
                categorias: [],
              };

              // Obtener categorías asociadas al formulario
              try {
                formularioData.categorias = await obtenerCategoriasOffline(tx, formulario.FormularioId);


                console.log(formularioData, 'datqa')
              } catch (error) {
                console.error("❌ Error al obtener categorías offline:", error);
              }

              formularios.push(formularioData);
            }

            console.log("✅ Formularios obtenidos correctamente con sus categorías, campos y opciones.", formularios);

            dispatch({ type: "SET_FORMULARIOS", payload: formularios });
            resolve(formularios);
          },
          (error) => {
            console.error("❌ Error al obtener formularios offline:", error);
            reject(error);
          }
        );
      });

    });
  };

  const  obtenerCategoriasOffline = async (tx: SQLite.SQLTransaction, formularioId: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      tx.executeSql(
        `SELECT * FROM Categorias WHERE FormularioId = ?`,
        [formularioId],
        async (_, { rows: categoriasRows }) => {
          if (categoriasRows.length === 0) {
            resolve([]);
            return;
          }

          const categorias: any[] = [];

          for (let j = 0; j < categoriasRows.length; j++) {
            const categoria = categoriasRows.item(j);

            const categoriaData: {
              CategoriaId: string;
              Nombre: string;
              Descripcion: string;
              campos: any[];
            } = {
              CategoriaId: categoria.CategoriaId,
              Nombre: categoria.Nombre,
              Descripcion: categoria.Descripcion,
              campos: [], // <-- ahora TypeScript sabe que es any[]
            };

            // Obtener los campos de la categoría
            try {
              categoriaData.campos = await obtenerCamposOffline(tx, categoria.CategoriaId);

              console.log(categoriaData, 'campo')
            } catch (error) {
              console.error("❌ Error al obtener campos offline:", error);
            }

            categorias.push(categoriaData);
          }

          resolve(categorias);
        },
        (error) => {
          console.error("❌ Error al obtener categorías offline:", error);
          reject(error);
        }
      );
    });
  };

  const obtenerCamposOffline = async (tx: SQLite.SQLTransaction, categoriaId: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      tx.executeSql(
        `SELECT * FROM Campos WHERE CategoriaId = ?`,
        [categoriaId],
        async (_, { rows: camposRows }) => {
          if (camposRows.length === 0) {
            resolve([]);
            return;
          }

          const campos: any[] = [];

          for (let k = 0; k < camposRows.length; k++) {
            const campo = camposRows.item(k);

            const campoData : {
              CampoId: string;
              Nombre: string;
              Tipo: string;
              Requerido: boolean;
              Placeholder: string;
              ValorDefecto: string;
              Fuente: string;
              Parametro: string;
              OpcionTrue: string;
              OpcionFalse: string;
              ReferenciaCampo: string;
              ReferenciaPropiedad: string;
              Descripcion: string;
              opciones: any[];
            } = {
              CampoId: campo.CampoId,
              Nombre: campo.Nombre,
              Tipo: campo.Tipo,
              Requerido: campo.Requerido === 1,
              Placeholder: campo.Placeholder,
              ValorDefecto: campo.ValorDefecto,
              Fuente: campo.Fuente,
              Parametro: campo.Parametro,
              OpcionTrue: campo.OpcionTrue,
              OpcionFalse: campo.OpcionFalse,
              ReferenciaCampo: campo.ReferenciaCampo,
              ReferenciaPropiedad: campo.ReferenciaPropiedad,
              Descripcion: campo.Descripcion,
              opciones: [],
            };

            // Obtener opciones del campo
            try {
              campoData.opciones = await obtenerOpcionesOffline(tx, campo.CampoId);

              console.log(campoData.opciones, 'opciones')
            } catch (error) {
              console.error("❌ Error al obtener opciones offline:", error);
            }

            campos.push(campoData);
          }

          resolve(campos);
        },
        (error) => {
          console.error("❌ Error al obtener campos offline:", error);
          reject(error);
        }
      );
    });
  };

  const obtenerOpcionesOffline = async (tx: SQLite.SQLTransaction, campoId: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      tx.executeSql(
        `SELECT * FROM Opciones WHERE CampoId = ?`,
        [campoId],
        (_, { rows: opcionesRows }) => {

          if (opcionesRows.length === 0) {
            resolve([]);
            return;
          }

          const opciones = opcionesRows._array.map((opcion) => ({
            OpcionId: opcion.OpcionId,
            Valor: opcion.Valor,
            HabilitaTexto: opcion.HabilitaTexto === 1,
            TipoTexto: opcion.TipoTexto,
            Placeholder: opcion.Placeholder,
          }));

          resolve(opciones);
        },
        (error) => {
          console.error("❌ Error al obtener opciones offline:", error);
          reject(error);
        }
      );
    });
  };



  // Guardar respuestas en SQLite (ejemplo de borrador)
  const guardarRespuestasOffline = async (
    formularioId: string,
    borrador: BorradorFormulario
  ) => {
    const db = await openDatabase();

    db.transaction((tx) => {
      // Insertar en la tabla 'Respuestas'
      tx.executeSql(
        `INSERT OR REPLACE INTO Respuestas 
         (RespuestaFormularioId, FormularioId, UsuarioId, creacion, modificacion, estado) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          borrador.RespuestaFormularioId,
          formularioId,
          auth.usuario?.id,
          borrador.creacion,
          borrador.modificacion, // Si 'modificacion' está vacío, usa 'creacion'
          borrador.estado
        ],
        (_, result) => {

          // Insertar los detalles solo si existen
          if (borrador.detalles && borrador.detalles.length > 0) {
            for (const detalle of borrador.detalles) {
              const RespuestaDetalleId = `${borrador.RespuestaFormularioId}-${detalle.CampoId}`; // Generamos un ID único

              tx.executeSql(
                `INSERT OR REPLACE INTO DetallesRespuestas 
                 (RespuestaDetalleId, RespuestaFormularioId, CampoId, Valor) 
                 VALUES (?, ?, ?, ?)`,
                [
                  RespuestaDetalleId,
                  borrador.RespuestaFormularioId,
                  detalle.CampoId,
                  detalle.valor ?? "" // Asegurar que 'valor' no sea null
                ],
                (_, detailResult) => {
                  console.log("✅ Detalle registrado exitosamente");
                },
                (error) => {
                  console.error("❌ Error al registrar detalle en DetallesRespuestas:", error);
                  return false;
                }
              );
            }
          } else {
            console.log("⚠️ No hay detalles para registrar.");
          }
        },
        (error) => {
          console.error("❌ Error al guardar respuesta offline:", error);
          return false;
        }
      );
    });
  };



  // Obtener borradores desde SQLite
  const obtenerBorradoresOffline = async (): Promise<BorradorFormulario[]> => {
    const db = await openDatabase(); // Asegurar que la BD esté abierta antes de ejecutar la consulta

    return new Promise((resolve) => {
      db.transaction((tx) => {
        tx.executeSql(
          `
          SELECT 
            r.RespuestaFormularioId,
            r.FormularioId,
            r.UsuarioId,
            r.creacion,
            r.modificacion,
            r.estado,
  
            f.Nombre AS nombreFormulario,
            f.Descripcion AS descripcionFormulario,
            f.Imagen AS imagenFormulario,
  
            d.RespuestaDetalleId,
            d.CampoId,
            d.Valor
  
          FROM Respuestas r
          LEFT JOIN DetallesRespuestas d ON r.RespuestaFormularioId = d.RespuestaFormularioId
          LEFT JOIN Formularios f ON r.FormularioId = f.FormularioId
          ORDER BY r.RespuestaFormularioId
          `,
          [],
          (_, { rows }) => {
            const data: { [key: string]: BorradorFormulario } = {};

            for (let i = 0; i < rows.length; i++) {
              const item = rows.item(i);

              // Si aún no existe un objeto con este RespuestaFormularioId, lo creamos
              if (!data[item.RespuestaFormularioId]) {
                data[item.RespuestaFormularioId] = {
                  RespuestaFormularioId: item.RespuestaFormularioId,
                  FormularioId: item.FormularioId,
                  UsuarioId: item.UsuarioId,
                  creacion: item.creacion,
                  modificacion: item.modificacion, // Si no hay modificacion, usamos la fecha de creación
                  estado: item.estado,
                  nombre: item.nombreFormulario || "Sin nombre",
                  descripcion: item.descripcionFormulario || "Sin descripción",
                  detalles: []
                };
              }

              // Si la fila tiene detalles válidos, los agregamos
              if (item.RespuestaDetalleId) {
                data[item.RespuestaFormularioId].detalles.push({
                  RespuestaDetalleId: item.RespuestaDetalleId,
                  CampoId: item.CampoId,
                  Valor: item.Valor ?? "" // Si el valor es null, lo convertimos en una cadena vacía
                });
              }
            }

            const borradores = Object.values(data);
            resolve(borradores);
          },
          (error) => {
            console.error("Error al obtener borradores con detalles:", error);
            resolve([]);
          }
        );
      });
    });
  };

  // Borrar un borrador en SQLite
  const borrarBorradorOffline = async (RespuestaFormularioId: string): Promise<BorradorFormulario[]> => {
    const db = await openDatabase();

    return new Promise((resolve) => {
      db.transaction((tx) => {
        tx.executeSql(
          'DELETE FROM Respuestas WHERE RespuestaFormularioId = ? AND estado = "borrador"',
          [RespuestaFormularioId],
          async () => {
            const borradores = await obtenerBorradoresOffline();
            resolve(borradores);
          },
          (error) => {
            console.error('Error al eliminar borrador:', error);
            resolve([]);
          }
        );
      });
    });
  };

  // Mientras no tengamos usuario, mostramos un spinner
  if (!auth.usuario) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2E8B57" />
        <Text>Obteniendo formularios...</Text>
      </View>
    );
  }

  return (
    <FormularioContext.Provider
      value={{
        state,
        dispatch,
        guardarFormularioOffline,
        guardarRespuestasOffline,
        obtenerBorradoresOffline,
        borrarBorradorOffline,
        registrarRespuestaFetch
      }}
    >
      {children}
    </FormularioContext.Provider>
  );
};

export const useFormulario = () => {
  const context = useContext(FormularioContext);
  if (!context) {
    throw new Error('useFormulario debe ser usado dentro de un FormularioProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  errorText: {
    textAlign: 'center',
    color: 'red'
  }
});
