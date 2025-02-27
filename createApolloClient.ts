import { ApolloClient, InMemoryCache, ApolloLink, HttpLink } from '@apollo/client';
import { persistCache, AsyncStorageWrapper } from 'apollo3-cache-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@env';

/**
 * Función para crear y retornar un ApolloClient con caché persistido (offline).
 */
export async function createApolloClient() {
  // 1) Crea la instancia de InMemoryCache
  const cache = new InMemoryCache();

  // 2) Persiste / rehidrata la caché usando apollo3-cache-persist
  await persistCache({
    cache,
    storage: new AsyncStorageWrapper(AsyncStorage),
    // Si quieres no comprimir el cache, lo dejas así
    // De lo contrario, puedes probar con otras opciones
  });

  // 3) HttpLink (tu endpoint GraphQL)
  const httpLink = new HttpLink({
    uri: `${API_URL}`, // tu URL de GraphQL
  });

  // 4) Middleware para agregar el token (con SecureStore)
  const authLink = new ApolloLink(async (operation, forward) => {
    const token = await SecureStore.getItemAsync('userToken');
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        Authorization: token ? `Bearer ${token}` : '',
      },
    }));
    return forward(operation);
  });

  // 5) Crear el cliente con la caché persistida
  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache,
  });

  return client;
}
