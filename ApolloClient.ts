import { ApolloClient, InMemoryCache, ApolloLink, HttpLink } from '@apollo/client';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@env';

// Crear HttpLink
const httpLink = new HttpLink({
  uri: `${API_URL}`, // Endpoint GraphQL
});

// Middleware para agregar el token
const authLink = new ApolloLink(async (operation, forward) => {
  const token = await SecureStore.getItemAsync('userToken');
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : '', // Agregar el token
    },
  }));

  return forward(operation);
});

// Crear Apollo Client
const client = new ApolloClient({
  link: authLink.concat(httpLink), // Combinar middleware con HttpLink
  cache: new InMemoryCache(), // Configuración de caché
})

export default client;
