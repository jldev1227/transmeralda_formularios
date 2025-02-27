import SQLite from "react-native-sqlite-storage";

// Configuración opcional
SQLite.DEBUG(true);
SQLite.enablePromise(true);

// Crear o abrir la base de datos
export const openDatabase = () => {
  const db = SQLite.openDatabase(
    {
      name: "MyDatabase.db",
      location: "default",
    },
    () => console.log("Base de datos abierta correctamente"),
    (error) => console.error("Error al abrir la base de datos:", error)
  );
  return db;
};
