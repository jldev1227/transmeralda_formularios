import React from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RespuestaFormulario, RootStackParamList } from 'types';
import { CardFormularioRespuesta } from './CardFormularioRespuesta';

export default function FormulariosRespuestasEnviadas({ items }) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
    <View style={{
      flex: 1,
    }}>
      {/* <View style={styles.inputContainer}>
              <SearchIcon/>
              <TextInput
                style={styles.input}
                placeholder="Busca un formato"
                placeholderTextColor="#888888"
                value={search}
                onChangeText={handleSearchForm}
              />
            </View> */}
      <FlatList
        data={items}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item } : RespuestaFormulario | any) => (
          <CardFormularioRespuesta
            key={item.RespuestaFormularioId}
            respuesta={item}
            onPress={() => navigation.navigate("Detalles del formulario", { id: item.FormularioId })}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay formularios enviados.</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#777",
    fontSize: 16,
  },
})