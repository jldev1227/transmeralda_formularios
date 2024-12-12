import React from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useAuth } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import ForgetPassword from './screens/ForgetPassword';
import FormulariosScreen from './screens/FormulariosScreen';
import LogoutButton from './components/LogoutButton';
import NuevoPassword from 'screens/NuevoPassword';
import { Image, StyleSheet, Text, View } from 'react-native';
import ErrorBoundary from 'ErrorBoundary';
import CustomDrawerItem from 'components/CustomerDrawerItem';
import FormIcon from 'components/FormIcon';
import { capitalize } from 'utils';
import FormularioDetalle from 'screens/FormularioDetalle';

// Stack para el flujo de autenticación
const OutStack = createNativeStackNavigator();
const OutStackNavigator = () => (
  <OutStack.Navigator initialRouteName="Login">
    <OutStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <OutStack.Screen name="ForgetPassword" component={ForgetPassword} options={{ headerShown: false }} />
    <OutStack.Screen name="NuevoPassword" component={NuevoPassword} options={{ headerShown: false }} />
  </OutStack.Navigator>
);


const MainStack = createNativeStackNavigator();

// Stack principal
const FormularioStack = () => (
  <MainStack.Navigator initialRouteName="index">
    <MainStack.Screen 
      name="index" 
      component={FormulariosScreen} // Mostramos el header del stack en 'index'
      options={{
        headerShown: false
      }}
    />
    <MainStack.Screen
      name="Detalles del formulario"
      component={FormularioDetalle}// No mostramos el header del stack en el detalle
    />
  </MainStack.Navigator>
);

const NeuralWebDrawer = createDrawerNavigator();

const NeuralWebNavigator = () => {


  return (
    <NeuralWebDrawer.Navigator
      initialRouteName="Formularios"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <NeuralWebDrawer.Screen 
        name="Formularios" 
        component={FormularioStack}
        options={{
          headerShown: false
        }}
      />
    </NeuralWebDrawer.Navigator>
  );
};

  // Componente para contenido personalizado del Drawer
const CustomDrawerContent = ({ navigation }) => {
  const { state } = useAuth();

  const route = navigation.getState();
  const currentRouteName = route.routes[0].name;

  const renderUserInfo = () => {
    if (!state.usuario) {
      return (
        <View style={styles.header}>
          <Image source={require('assets/Avatar.png')} />
          <View>
            <Text style={styles.text}>Hola</Text>
            <Text style={styles.name}>Invitado</Text>
          </View>
        </View>
      );
    }

    const { nombre, apellido } = state.usuario;
    return (
      <View style={styles.header}>
        <Image source={require('assets/Avatar.png')} />
        <View>
          <Text style={styles.text}>Hola</Text>
          <Text style={styles.name}>
            {capitalize(nombre.split(' ')[0])} {capitalize(apellido.split(' ')[0])}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <DrawerContentScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ padding: 15 }}>
      {renderUserInfo()}
      <View style={styles.menuItems}>
        <CustomDrawerItem
          label="Formularios"
          icon={() => <FormIcon fill={currentRouteName === "Formularios" ? '#2E8B57' : ''} />}
          screen="Formularios"
          navigation={navigation}
          isActive={currentRouteName === "Formularios"}
        />
      </View>
      <View style={styles.logoutContainer}>
        <LogoutButton navigation={navigation} />
      </View>
    </DrawerContentScrollView>
  );
};

// Controlador principal que selecciona el stack según el estado de autenticación
export const RootNavigator = ({
  theme
}) => {
  const { state } = useAuth(); // Obtén el estado global de autenticación

  return (
    <NavigationContainer theme={theme}>
      <ErrorBoundary>
        {state.isAuthenticated ? <NeuralWebNavigator /> : <OutStackNavigator />}
      </ErrorBoundary>
    </NavigationContainer>
  );
};


const styles = StyleSheet.create({
  header: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 15,
    marginBottom: 35
  },
  text: {
    fontSize: 16,
    color: '#535763'
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  logoutContainer: {
    marginTop: 'auto', // Empuja el botón hacia la parte inferior
    paddingTop: 15,
    borderTopWidth: 1,
    borderColor: '#D1D3D4', // Línea separadora
  },
  menuItems: {
    flex: 1, // Permite que los elementos del menú ocupen el espacio disponible
  },
})