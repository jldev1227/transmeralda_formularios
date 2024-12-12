
import React from 'react'
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
            <TouchableOpacity onPress={openDrawer} style={{ paddingRight: 15 }}>
                <MenuIcon />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{screen}</Text>
        </View>
    )
}

const MenuIcon = (props) => (
    <Svg width={24} height={24} viewBox="0 0 24 24" {...props}>
        <Path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z" fill="#000" />
    </Svg>
);

const styles = StyleSheet.create({
    header: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      backgroundColor: '#fff',
  
      // Sombra en iOS
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
  
      // Elevación en Android
      elevation: 4,
    }
  });
  