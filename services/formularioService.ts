import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

export const fetchFormulario = async () => {
  const query = `
    query ObtenerFormularios {
      obtenerFormularios {
        id
        nombre
        descripcion
        campos
        createdAt
        updatedAt
      }
    }
  `;

  try {
    const response = await fetch(`${API_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en la respuesta HTTP:', errorText);
      throw new Error('Error al obtener los formularios');
    }

    const { data, errors } = await response.json();

    if (errors) {
      console.error('Errores en la respuesta GraphQL:', errors);
      throw new Error('Error en el servidor GraphQL');
    }

    const formularios = data?.obtenerFormularios || [];
    if (formularios.length === 0) {
      throw new Error('No se encontraron formularios');
    }

    const formulario = formularios[0];
    await AsyncStorage.setItem('@formulario', JSON.stringify(formulario));
    return formulario;
  } catch (error) {
    console.error('Error al obtener el formulario:', error);
    return null;
  }
};


export const loadFormularioFromLocal = async () => {
    try {
      const formulario = await AsyncStorage.getItem('@formulario');
      return formulario ? JSON.parse(formulario) : null;
    } catch (error) {
      console.error('Error al cargar el formulario local:', error);
      return null;
    }
  };
  