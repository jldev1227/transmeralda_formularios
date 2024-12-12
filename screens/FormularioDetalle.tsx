import React, { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { OBTENER_FORMULARIO } from '../graphql/querys';
import CampoSelector from 'components/Picker';
import FirmaInput from 'components/FirmaInput';

const Separator = () => <View style={styles.separator} />;

export default function FormularioDetalle({ route }: { route: any }) {
    const { id } = route.params;

    // Consulta GraphQL para obtener el formulario por ID
    const { loading, error, data } = useQuery(OBTENER_FORMULARIO, {
        variables: { id },
    });

    // Estados dinámicos para almacenar los valores del formulario
    const [formData, setFormData] = useState<Record<string, any>>({});

    // Manejar cambios en los campos
    const handleInputChange = (campoNombre: string, value: any) => {
        setFormData((prev) => {
            const nuevoFormData = { ...prev, [campoNombre]: value };

            // Procesar referencias
            categorias.forEach((categoria: any) => {
                categoria.campos.forEach((campo: any) => {
                    if (campo.referencia && campo.referencia.campo === campoNombre) {
                        const valorReferenciado = value?.[campo.referencia.propiedad];
                        nuevoFormData[campo.nombre] = valorReferenciado ?? campo.valorDefecto; // Usa el valor por defecto si la referencia es null
                    }
                });
            });

            return nuevoFormData;
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2E8B57" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error al cargar el formulario: {error.message}</Text>
            </View>
        );
    }

    // Verifica que los datos existan y sean válidos
    const formulario = data?.obtenerFormulario;
    const categorias = formulario?.campos?.categorias;

    if (!formulario || !categorias) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>No se encontraron categorías en el formulario.</Text>
            </View>
        );
    }

    const handleSubmit = () => {
        const errores: string[] = [];

        // Crear una copia de formData para procesar los datos
        const processedFormData = { ...formData };

        // Sincronizar referencias antes de validar
        categorias.forEach((categoria: any) => {
            categoria.campos.forEach((campo: any) => {
                if (campo.referencia) {
                    const valorReferenciado = processedFormData[campo.referencia.campo]?.[campo.referencia.propiedad];
                    if (valorReferenciado !== undefined) {
                        processedFormData[campo.nombre] = valorReferenciado;
                    }
                }
            });
        });

        // Validar y procesar los campos
        categorias.forEach((categoria: any) => {
            categoria.campos.forEach((campo: any) => {
                let valorCampo = processedFormData[campo.nombre];

                // Si el campo es de tipo selector y tiene un parámetro
                if (campo.tipo === 'selector' && campo.parametro && valorCampo) {
                    const parametroValor = valorCampo[campo.parametro]; // Extraer el parámetro directamente
                    processedFormData[campo.nombre] = parametroValor; // Guardar solo el parámetro
                    valorCampo = parametroValor; // Actualizar para validaciones
                }

                // Validar que el campo esté diligenciado
                if (campo.requerido && (valorCampo === undefined || valorCampo === null)) {
                    errores.push(`El campo "${campo.nombre}" de la categoría "${categoria.nombre}" es obligatorio.`);
                    return;
                }

                // Validar campos tipo "boolean"
                if (campo.tipo === 'boolean') {
                    if (campo.requerido && (valorCampo !== true && valorCampo !== false)) {
                        errores.push(`Debes seleccionar una opción (Sí/No) en el campo "${campo.nombre}" de la categoría "${categoria.nombre}".`);
                    }
                }

                if (campo.tipo === 'check') {
                    if (campo.requerido && valorCampo !== true) {
                        errores.push(`Debes marcar el campo "${campo.nombre}" de la categoría "${categoria.nombre}" para continuar.`);
                    }
                }

                // Validar campos tipo "texto"
                if (campo.tipo === 'texto') {
                    if (campo.requerido && (!valorCampo || valorCampo.trim() === '')) {
                        errores.push(`Debes diligenciar el campo "${campo.nombre}" de la categoría "${categoria.nombre}".`);
                    }
                }

                // Validar campos tipo "opcion"
                if (campo.tipo === 'opcion') {
                    const opcionSeleccionada = valorCampo?.valor;
                    const textoAdicional = valorCampo?.texto;

                    if (campo.requerido && !opcionSeleccionada) {
                        errores.push(`Debes seleccionar una opción en el campo "${campo.nombre}" de la categoría "${categoria.nombre}".`);
                    }

                    const opcion = campo.opciones?.find((o: any) => o.valor === opcionSeleccionada);
                    if (opcion?.habilitaTexto && (!textoAdicional || textoAdicional.trim() === '')) {
                        errores.push(`Debes diligenciar el texto adicional en el campo "${campo.nombre}" de la categoría "${categoria.nombre}".`);
                    }
                }

            });
        });

        // Si hay errores, mostrarlos al usuario
        if (errores.length > 0) {
            Alert.alert('Errores de Validación', errores.join('\n\n'), [{ text: 'Aceptar' }]);
            return;
        }

        // Si no hay errores, enviar el formulario
        console.log('Formulario enviado:', processedFormData);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{formulario.nombre}</Text>
            <Text>{formulario.descripcion}</Text>

            {categorias.map((categoria: any, index: number) => (
                <View key={index} style={styles.categoryContainer}>
                    <Text style={styles.categoryTitle}>{categoria.nombre}</Text>
                    {categoria.campos.map((campo: any, campoIndex: number) => (
                        <View key={campoIndex} style={styles.fieldContainer}>

                            {campo.tipo === 'selector' && (
                                <CampoSelector
                                    campo={campo}
                                    formData={formData}
                                    setFormData={setFormData}
                                    disabled={!!campo.referencia} // Deshabilitar si tiene referencia
                                />
                            )}

                            {campo.tipo === 'boolean' && (
                                <View>
                                    <Text style={[styles.fieldLabel, campo.referencia && styles.disabledLabel]}>
                                        {campo.nombre}
                                    </Text>
                                    <View style={[styles.booleanContainer, campo.referencia && styles.disabledContainer]}>
                                        <TouchableOpacity
                                            style={[
                                                styles.booleanOption,
                                                formData[campo.nombre] === true && styles.booleanOptionSelected,
                                                campo.referencia && styles.booleanOptionDisabled,
                                            ]}
                                            onPress={() => !campo.referencia && handleInputChange(campo.nombre, true)}
                                            disabled={!!campo.referencia}
                                        >
                                            <Text
                                                style={[
                                                    styles.booleanText,
                                                    formData[campo.nombre] === true && styles.booleanTextSelected,
                                                    campo.referencia && styles.booleanTextDisabled,
                                                ]}
                                            >
                                                {campo.opcionTrue || 'Sí'}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.booleanOption,
                                                formData[campo.nombre] === false && styles.booleanOptionSelected,
                                                campo.referencia && styles.booleanOptionDisabled,
                                            ]}
                                            onPress={() => !campo.referencia && handleInputChange(campo.nombre, false)}
                                            disabled={!!campo.referencia}
                                        >
                                            <Text
                                                style={[
                                                    styles.booleanText,
                                                    formData[campo.nombre] === false && styles.booleanTextSelected,
                                                    campo.referencia && styles.booleanTextDisabled,
                                                ]}
                                            >
                                                {campo.opcionFalse || 'No'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}


                            {campo.tipo === 'texto' && (
                                <View>
                                    <Text style={styles.fieldLabel}>{campo.nombre}</Text>
                                    <TextInput
                                        style={[
                                            styles.textInput,
                                            campo.referencia && styles.textInputDisabled, // Agrega estilo deshabilitado si hay referencia
                                        ]}
                                        placeholder={campo.placeholder || 'Escribe aquí...'}
                                        value={
                                            campo.referencia
                                                ? formData[campo.referencia.campo]?.[campo.referencia.propiedad] ??
                                                campo.valorDefecto // Mostrar valorDefecto si la referencia es null o undefined
                                                : formData[campo.nombre] || campo.valorDefecto || '' // Usar valorDefecto si no hay dato ingresado
                                        }
                                        editable={!campo.referencia}
                                    />
                                </View>
                            )}


                            {campo.tipo === 'number' && (
                                <View>
                                    <Text style={[styles.fieldLabel, campo.referencia && styles.disabledLabel]}>
                                        {campo.nombre}
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.numberInput,
                                            campo.referencia && styles.textInputDisabled,
                                        ]}
                                        placeholder={campo.placeholder || 'Ingrese un valor numérico'}
                                        keyboardType="numeric"
                                        value={
                                            campo.referencia
                                                ? formData[campo.referencia.campo]?.[campo.referencia.propiedad]?.toString() || ''
                                                : formData[campo.nombre]?.toString() || ''
                                        }
                                        onChangeText={(value) =>
                                            !campo.referencia &&
                                            handleInputChange(campo.nombre, value ? parseFloat(value) : '')
                                        }
                                        editable={!campo.referencia}
                                    />
                                </View>
                            )}

                            {campo.tipo === 'opcion' && (
                                <View>
                                    <Text style={[styles.fieldLabel, campo.referencia && styles.disabledLabel]}>
                                        {campo.nombre}
                                    </Text>
                                    {campo.opciones?.map((opcion: any, opcionIndex: number) => (
                                        <TouchableOpacity
                                            key={opcionIndex}
                                            style={[
                                                styles.optionButton,
                                                formData[campo.nombre]?.valor === opcion.valor && styles.optionSelected,
                                                campo.referencia && styles.optionButtonDisabled,
                                            ]}
                                            onPress={() =>
                                                !campo.referencia &&
                                                handleInputChange(campo.nombre, {
                                                    valor: opcion.valor,
                                                    texto: formData[campo.nombre]?.valor === opcion.valor ? formData[campo.nombre]?.texto : '', // Mantén el texto si ya existe
                                                })
                                            }
                                            disabled={!!campo.referencia}
                                        >
                                            <Text
                                                style={[
                                                    formData[campo.nombre]?.valor === opcion.valor && styles.optionTextSelected,
                                                    campo.referencia && styles.optionTextDisabled,
                                                ]}
                                            >
                                                {opcion.valor}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}

                                    {formData[campo.nombre]?.valor &&
                                        campo.opciones.find((o: any) => o.valor === formData[campo.nombre]?.valor)?.habilitaTexto && (
                                            <TextInput
                                                style={styles.textInput}
                                                placeholder={
                                                    campo.opciones.find((o: any) => o.valor === formData[campo.nombre]?.valor)?.placeholder ||
                                                    'Escribe aquí...'
                                                }
                                                keyboardType={
                                                    campo.opciones.find((o: any) => o.valor === formData[campo.nombre]?.valor)?.tipoTexto === 'number'
                                                        ? 'numeric'
                                                        : 'default'
                                                }
                                                value={formData[campo.nombre]?.texto || ''}
                                                onChangeText={(value) =>
                                                    handleInputChange(campo.nombre, {
                                                        ...formData[campo.nombre],
                                                        texto: value,
                                                    })
                                                }
                                            />
                                        )}
                                </View>
                            )}


                            {campo.tipo === 'check' && (
                                <View style={[styles.checkboxContainer, campo.referencia && styles.disabledContainer]}>
                                    <TouchableOpacity
                                        style={[
                                            styles.customCheckbox,
                                            formData[campo.nombre] && styles.customCheckboxSelected,
                                            campo.referencia && styles.customCheckboxDisabled,
                                        ]}
                                        onPress={() => !campo.referencia && handleInputChange(campo.nombre, !formData[campo.nombre])}
                                        disabled={!!campo.referencia}
                                    >
                                        {formData[campo.nombre] && <View style={styles.customCheckboxInner} />}
                                    </TouchableOpacity>
                                    <Text style={[styles.checkboxLabel, campo.referencia && styles.disabledLabel]}>
                                        {campo.nombre}
                                    </Text>
                                </View>
                            )}



                            {campo.tipo === 'firma' && (
                                <View>
                                    <Text style={campo.referencia && styles.disabledLabel}>
                                        {campo.nombre}
                                    </Text>
                                    <FirmaInput
                                        text="Por favor, firme aquí"
                                        onOK={(signature) => handleInputChange(campo.nombre, signature)}
                                    />

                                </View>
                            )}
                        </View>
                    ))}
                    {index + 1 !== categorias.length && <Separator />}
                </View>
            ))}

            <TouchableOpacity
                onPress={handleSubmit}
                style={styles.buttonSubmit}
            >
                <Text style={styles.buttonSubmitText}>Enviar respuestas</Text>
            </TouchableOpacity>
        </ScrollView>

    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 120,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
    },
    categoryContainer: {
        marginVertical: 20,
        backgroundColor: '#ffffff',
        shadowColor: '#000', // Color de la sombra
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    fieldContainer: {
        marginBottom: 15,
    },
    fieldLabel: {
        fontSize: 14,
        marginBottom: 5,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        fontSize: 14,
    },
    numberInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        backgroundColor: '#fff',
        fontSize: 14,
    },
    booleanContainer: {
        flexDirection: 'row',
    },
    booleanOption: {
        flex: 1,
        padding: 10,
        alignItems: 'center',
        borderRadius: 5,
        backgroundColor: '#ececec',
        marginHorizontal: 5,
    },
    booleanOptionSelected: {
        backgroundColor: '#2E8B57',
        color: '#fff',
    },
    booleanText: {
        color: '#000',
    },
    booleanTextSelected: {
        color: '#fff',
    },
    optionButton: {
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 5,
        alignItems: 'center',
    },
    optionSelected: {
        backgroundColor: '#2E8B57',
    },
    optionText: {
        color: '#000',
    },
    optionTextSelected: {
        color: '#fff',
    },
    customCheckbox: {
        width: 24,
        height: 24,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 3,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10, // Espaciado para el texto al lado del checkbox
    },
    customCheckboxSelected: {
        backgroundColor: '#2E8B57', // Color cuando está seleccionado
        borderColor: '#2E8B57',
    },
    customCheckboxInner: {
        width: 14,
        height: 14,
        backgroundColor: '#fff', // Color del indicador interno
    },
    checkboxLabel: {
        fontSize: 14,
        flexWrap: 'wrap', // Permite el salto de línea
        textAlign: 'left', // Alineación del texto
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        width: '90%', // Ancho máximo del contenedor
    },
    imageSelectedText: {
        marginTop: 10,
        fontSize: 12,
        color: '#666',
    },
    separator: {
        marginVertical: 8,
        borderBottomColor: '#737373',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    buttonSubmit: {
        backgroundColor: '#2E8B57',
        padding: 15,
        borderRadius: 8
    },
    buttonSubmitText: {
        color: '#fff',
        textAlign: 'center'
    },
    textInputDisabled: {
        backgroundColor: '#f2f2f2', // Fondo para campos deshabilitados
        borderColor: '#ccc',
        borderWidth: 1,
        padding: 10,
        borderRadius: 5,
        color: '#a0a0a0', // Texto para campos deshabilitados
    },
    pickerDisabled: {
        backgroundColor: '#f2f2f2', // Fondo para pickers deshabilitados
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
    },
    checkboxDisabled: {
        backgroundColor: '#f2f2f2', // Fondo para checkboxes deshabilitados
        borderRadius: 5,
    },
    checkboxLabelDisabled: {
        color: '#a0a0a0', // Color del texto para etiquetas de checkboxes deshabilitados
    },
    customCheckboxDisabled: {
        backgroundColor: '#f2f2f2',
        borderColor: '#e0e0e0',
    },
    booleanOptionDisabled: {
        backgroundColor: '#f2f2f2',
        borderColor: '#e0e0e0',
    },
    booleanTextDisabled: {
        color: '#a0a0a0',
    },
    disabledLabel: {
        color: '#a0a0a0',
    },
    disabledContainer: {
        backgroundColor: '#f2f2f2', // Fondo gris claro para indicar que está deshabilitado
        padding: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#e0e0e0', // Bordes más claros para diferenciar visualmente
        opacity: 0.6, // Reduce la opacidad para reforzar el estado deshabilitado
    },
    optionTextDisabled: {
        color: '#a0a0a0',
    },
    optionButtonDisabled: {
        backgroundColor: '#f2f2f2',
        borderColor: '#e0e0e0',
    },
});
