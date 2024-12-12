import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

const CustomDrawerItem = ({ label, icon: IconComponent, screen, navigation, isActive }) => {
    return (
        <TouchableOpacity
            style={[styles.drawerItemContainer, isActive && styles.activeItem]}
            onPress={() => navigation.navigate(screen)}
        >
            <View style={styles.startContent}>
                {IconComponent && <IconComponent color={isActive ? '#2E8B57' : ''} />}
            </View>
            <Text style={[styles.drawerLabel, isActive && styles.activeLabel]}>{label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    drawerItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: 10
    },
    activeItem: {
        backgroundColor: '#DFFFED',
    },
    activeLabel: {
        color: '#2E8B57'
    },
    startContent: {
        marginRight: 15,
    },
    drawerLabel: {
        fontSize: 16,
        fontWeight: 700,
        color: '#535763',
    },
});

export default CustomDrawerItem;
