import React from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import CardFormulario from './CardFormulario'
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from 'types';

export default function FormulariosFormatos({ items }) {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    return (
        <View style={{
            flex: 1,
        }}>
            <FlatList
                data={items}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item }) => (
                    <CardFormulario
                        key={item.FormularioId}
                        formulario={item}
                        onPress={() => navigation.navigate("Detalles del formulario", { id: item.FormularioId })}
                    />
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No hay formatos disponibles.</Text>}
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