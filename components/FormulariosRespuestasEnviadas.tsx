import React from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { RespuestaFormulario } from 'types';
import { CardFormularioRespuesta } from './CardFormularioRespuesta';

export default function FormulariosRespuestasEnviadas({ items }) {
  return (
    <View style={{
      flex: 1,
    }}>
      <FlatList
        data={items}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item } : RespuestaFormulario | any) => (
          <CardFormularioRespuesta
            key={item.RespuestaFormularioId}
            respuesta={item}
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