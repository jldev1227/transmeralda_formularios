import { NavigationProp, useNavigation } from "@react-navigation/native";
import FormularioBorradores from "components/FormularioBorradores";
import FormulariosFormatos from "components/FormulariosFormatos";
import FormulariosRespuestasEnviadas from "components/FormulariosRespuestasEnviadas";
import { useFormulario } from "context/FormularioContext";
import HeaderLayout from "layouts/HeaderLayout";
import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";

const FormulariosScreen = () => {
  const { state } = useFormulario()
  const navigation = useNavigation()

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "formatos", title: "Formatos" },
    { key: "enviados", title: "Enviados" },
    { key: "borradores", title: "Borradores" },
  ]);

  const currentRoute = routes[index];

  const FormatosTab = () => <FormulariosFormatos items={state.formularios}/>
  const EnviadosTab = () => <FormulariosRespuestasEnviadas items={state.respuestas}/>
  const BorradoresTab = () => <FormularioBorradores/>

  return (
    <>
      <HeaderLayout screen={`Formularios - ${currentRoute.title}`} />
      <TabView
        navigationState={{ index, routes }}
        renderScene={SceneMap({
          formatos: FormatosTab,
          enviados: EnviadosTab,
          borradores: BorradoresTab
        })}
        onIndexChange={setIndex}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            style={styles.tabBar}
            indicatorStyle={styles.indicator}
            pressColor="rgba(0, 0, 0, 0.064)" // Color personalizado para el efecto de presión
            pressOpacity={0.8} // Intensidad de la opacidad (0 = transparente, 1 = opaco)
          />
        )}
      />
    </>
  );
};

export default FormulariosScreen;

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#2E8B57",
    elevation: 2,
  },
  tabLabel: {
    color: "#2E8B57",
    fontWeight: "bold",
  },
  indicator: {
    backgroundColor: "#2E8B57",
    height: 3,
  },
});
