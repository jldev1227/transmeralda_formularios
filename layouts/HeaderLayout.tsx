import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { DrawerActions, NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from 'types';

export default function HeaderLayout({ screen }) {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    const openDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={openDrawer} style={styles.menuIconContainer}>
                <MenuIcon />
            </TouchableOpacity>
            <Text style={styles.screenName}>{screen}</Text>
        </View>
    );
}

const MenuIcon = (props) => (
    <Svg width={30} height={30} viewBox="0 0 24 24" {...props}>
        <Path
            fill="#fff"
            d="M4 6a1 1 0 011-1h14a1 1 0 110 2H5a1 1 0 01-1-1zM4 18a1 1 0 011-1h14a1 1 0 110 2H5a1 1 0 01-1-1zM5 11a1 1 0 100 2h8a1 1 0 100-2H5z"
        />
    </Svg>
);

const styles = StyleSheet.create({
    header: {
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Asegura que el contenido está centrado
        paddingHorizontal: 15,
        backgroundColor: '#2E8B57',
        position: 'relative',

        // Sombra en iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,

        // Elevación en Android
        elevation: 4,
    },
    menuIconContainer: {
        position: 'absolute',
        left: 15, // Separación desde la izquierda
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20
    },
    screenName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1, // Ocupa el espacio restante para centrar
        textAlign: 'center', // Centra el texto horizontalmente
    },
});
