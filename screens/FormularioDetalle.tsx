import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
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
import { FormularioType } from 'types';
import { REGISTRAR_RESPUESTA_FORMULARIO } from 'graphql/mutation';
import { useAuth } from 'context/AuthContext';

const Separator = () => <View style={styles.separator} />;

interface FormularioDetalleProps {
    route: {
        params: {
            id: string;
        }
    }
}

export default function FormularioDetalle({ route }: FormularioDetalleProps) {
    const { id } = route.params;

    // Consulta GraphQL para obtener el formulario por ID
    const { loading, error, data } = useQuery<{ obtenerFormulario: FormularioType }>(OBTENER_FORMULARIO, {
        variables: { id },
    });

    // Estados dinámicos para almacenar los valores del formulario
    const { state } = useAuth()
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [registrarRespuesta] = useMutation(REGISTRAR_RESPUESTA_FORMULARIO);

    // Manejar cambios en los campos
    const handleInputChange = (campoNombre: string, value: any) => {
        setFormData((prev) => {
            const nuevoFormData = { ...prev, [campoNombre]: value };

            // Procesar referencias: para cada categoría y campo, si hace referencia a este campo, actualiza su valor
            if (formulario) {
                formulario.categorias.forEach((categoria) => {
                    (categoria.campos || []).forEach((campo) => { // Asegura que campos no sea null
                        if (campo.ReferenciaCampo && campo.ReferenciaPropiedad && campo.ReferenciaCampo === campoNombre) {
                            const valorReferenciado = value?.[campo.ReferenciaPropiedad];
                            nuevoFormData[campo.Nombre] = valorReferenciado ?? campo.ValorDefecto;
                        }
                    });
                });
            }

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

    if (!formulario || !Array.isArray(formulario.categorias)) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>No se encontró el formulario o sus categorías.</Text>
            </View>
        );
    }

    const categorias = formulario.categorias;

    // Verificación adicional de campos
    categorias.forEach((categoria, index) => {
        if (!Array.isArray(categoria.campos)) {
            console.warn(`La categoría con ID ${categoria.CategoriaId} tiene campos nulos o inválidos.`);
            categoria.campos = []; // Asigna un arreglo vacío para evitar errores
        }
    });

    const handleSubmit = async () => {
        const errores: string[] = [];
        const processedFormData = { ...formData };

        // Sincronizar referencias antes de validar
        categorias.forEach((categoria) => {
            categoria.campos.forEach((campo) => {
                if (campo.ReferenciaCampo && campo.ReferenciaPropiedad) {
                    const valorReferenciado = processedFormData[campo.ReferenciaCampo]?.[campo.ReferenciaPropiedad];
                    if (valorReferenciado !== undefined) {
                        processedFormData[campo.Nombre] = valorReferenciado;
                    }
                }
            });
        });

        // Validar y procesar los campos
        categorias.forEach((categoria) => {
            categoria.campos.forEach((campo) => {
                let valorCampo = processedFormData[campo.Nombre];

                // Si el campo es de tipo selector y tiene un parámetro
                if (campo.Tipo === 'selector' && campo.Parametro && valorCampo) {
                    const parametroValor = valorCampo[campo.Parametro];
                    processedFormData[campo.Nombre] = parametroValor;
                    valorCampo = parametroValor;
                }

                // Validar que el campo esté diligenciado
                if (campo.Requerido && (valorCampo === undefined || valorCampo === null || valorCampo === '')) {
                    errores.push(`El campo "${campo.Nombre}" de la categoría "${categoria.Nombre}" es obligatorio.`);
                    return;
                }
            });
        });

        // Si hay errores, mostrarlos al usuario
        if (errores.length > 0) {
            Alert.alert('Errores de Validación', errores.join('\n\n'), [{ text: 'Aceptar' }]);
            return;
        }

        // Transformar los datos al formato requerido por el mutation
        const detalles = Object.entries(processedFormData).map(([campoNombre, valor]) => {
            const campo = categorias
                .flatMap((categoria) => categoria.campos)
                .find((c) => c.Nombre === campoNombre);

            return {
                CampoId: campo?.CampoId,
                valor: valor !== null && valor !== undefined ? String(valor) : null, // Convertir a String
            };
        });

        console.log(formulario.FormularioId)

        const input = {
            FormularioId: formulario.FormularioId,
            UsuarioId: state.usuario?.id, // Cambiar por el ID del usuario actual
            detalles: detalles.map((detalle) => ({
                CampoId: detalle.CampoId,
                valor: typeof detalle.valor === "object"
                    ? JSON.stringify(detalle.valor)
                    : detalle.valor?.toString(), // Convertir a cadena
            }))
        }

        try {
            // Llamar al mutation
            await registrarRespuesta({ variables: { input } });
            Alert.alert('Éxito', 'Las respuestas han sido registradas exitosamente.', [{ text: 'Aceptar' }]);
        } catch (error) {
            console.error('Error al registrar las respuestas:', error);
            Alert.alert('Error', 'Hubo un problema al registrar las respuestas. Inténtalo de nuevo.', [{ text: 'Aceptar' }]);
        }
    };


    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{formulario.Nombre}</Text>
            {formulario.Descripcion && <Text>{formulario.Descripcion}</Text>}

            {categorias.map((categoria, indexCategoria) => (
                <View key={categoria.CategoriaId} style={styles.categoryContainer}>
                    <Text style={styles.categoryTitle}>{categoria.Nombre}</Text>
                    {categoria.Descripcion && <Text style={styles.CategoryDescription}>{categoria.Descripcion}</Text>}

                    {(categoria.campos || []).map((campo) => (
                        <View key={campo.CampoId} style={styles.fieldContainer}>

                            {campo.Tipo === 'selector' && (
                                <CampoSelector
                                    campo={campo}
                                    formData={formData}
                                    setFormData={setFormData}
                                    disabled={!!campo.ReferenciaCampo}
                                    handleInputChange={handleInputChange}
                                />
                            )}

                            {campo.Tipo === 'boolean' && (
                                <View>
                                    <Text style={[styles.fieldLabel, campo.ReferenciaCampo && styles.disabledLabel]}>
                                        {campo.Nombre}
                                    </Text>
                                    <View style={[styles.booleanContainer, campo.ReferenciaCampo && styles.disabledContainer]}>
                                        <TouchableOpacity
                                            style={[
                                                styles.booleanOption,
                                                formData[campo.Nombre] === true && styles.booleanOptionSelected,
                                                campo.ReferenciaCampo && styles.booleanOptionDisabled,
                                            ]}
                                            onPress={() => !campo.ReferenciaCampo && handleInputChange(campo.Nombre, true)}
                                            disabled={!!campo.ReferenciaCampo}
                                        >
                                            <Text
                                                style={[
                                                    styles.booleanText,
                                                    formData[campo.Nombre] === true && styles.booleanTextSelected,
                                                    campo.ReferenciaCampo && styles.booleanTextDisabled,
                                                ]}
                                            >
                                                {campo.OpcionTrue || 'Sí'}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.booleanOption,
                                                formData[campo.Nombre] === false && styles.booleanOptionSelected,
                                                campo.ReferenciaCampo && styles.booleanOptionDisabled,
                                            ]}
                                            onPress={() => !campo.ReferenciaCampo && handleInputChange(campo.Nombre, false)}
                                            disabled={!!campo.ReferenciaCampo}
                                        >
                                            <Text
                                                style={[
                                                    styles.booleanText,
                                                    formData[campo.Nombre] === false && styles.booleanTextSelected,
                                                    campo.ReferenciaCampo && styles.booleanTextDisabled,
                                                ]}
                                            >
                                                {campo.OpcionFalse || 'No'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}


                            {campo.Tipo === 'texto' && (
                                <View>
                                    <Text style={styles.fieldLabel}>{campo.Nombre}</Text>
                                    <TextInput
                                        style={[
                                            styles.textInput,
                                            campo.ReferenciaCampo && styles.textInputDisabled,
                                        ]}
                                        placeholder={campo.Placeholder || 'Escribe aquí...'}
                                        value={
                                            campo.ReferenciaCampo && campo.ReferenciaPropiedad
                                                ? formData[campo.ReferenciaCampo]?.[campo.ReferenciaPropiedad] ?? campo.ValorDefecto ?? ''
                                                : formData[campo.Nombre] || campo.ValorDefecto || ''
                                        }
                                        onChangeText={(value) => !campo.ReferenciaCampo && handleInputChange(campo.Nombre, value)}
                                        editable={!campo.ReferenciaCampo}
                                    />
                                </View>
                            )}

                            {campo.Tipo === 'number' && (
                                <View>
                                    <Text style={[styles.fieldLabel, campo.ReferenciaCampo && styles.disabledLabel]}>
                                        {campo.Nombre}
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.numberInput,
                                            campo.ReferenciaCampo && styles.textInputDisabled,
                                        ]}
                                        placeholder={campo.Placeholder || 'Ingrese un valor numérico'}
                                        keyboardType="numeric"
                                        value={
                                            campo.ReferenciaCampo && campo.ReferenciaPropiedad
                                                ? formData[campo.ReferenciaCampo]?.[campo.ReferenciaPropiedad]?.toString() || ''
                                                : formData[campo.Nombre]?.toString() || ''
                                        }
                                        onChangeText={(value) =>
                                            !campo.ReferenciaCampo && handleInputChange(campo.Nombre, value ? parseFloat(value) : '')
                                        }
                                        editable={!campo.ReferenciaCampo}
                                    />
                                </View>
                            )}

                            {campo.Tipo === 'opcion' && (
                                <View>
                                    {/* Título del Campo */}
                                    <Text style={[styles.fieldLabel, campo.ReferenciaCampo && styles.disabledLabel]}>
                                        {campo.Nombre}
                                    </Text>

                                    {/* Opciones como Botones */}
                                    {campo.opciones?.map((opcion, opcionIndex) => (
                                        <TouchableOpacity
                                            key={opcionIndex}
                                            style={[
                                                styles.optionButton,
                                                formData[campo.Nombre]?.valor === opcion.Valor && styles.optionSelected,
                                                campo.ReferenciaCampo && styles.optionButtonDisabled,
                                            ]}
                                            onPress={() =>
                                                !campo.ReferenciaCampo &&
                                                handleInputChange(campo.Nombre, {
                                                    valor: opcion.Valor,
                                                    texto: formData[campo.Nombre]?.valor === opcion.Valor ? formData[campo.Nombre]?.texto : '',
                                                })
                                            }
                                            disabled={!!campo.ReferenciaCampo}
                                        >
                                            <Text
                                                style={[
                                                    formData[campo.Nombre]?.valor === opcion.Valor && styles.optionTextSelected,
                                                    campo.ReferenciaCampo && styles.optionTextDisabled,
                                                ]}
                                            >
                                                {opcion.Valor}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}

                                    {/* TextInput Condicional */}
                                    {(() => {
                                        const opcionSeleccionada = campo.opciones?.find(
                                            (o) => o.Valor === formData[campo.Nombre]?.valor
                                        );

                                        return opcionSeleccionada?.HabilitaTexto ? (
                                            <TextInput
                                                style={styles.textInput}
                                                placeholder={opcionSeleccionada.Placeholder || 'Escribe aquí...'}
                                                keyboardType={
                                                    opcionSeleccionada.TipoTexto === 'number' ? 'numeric' : 'default'
                                                }
                                                value={formData[campo.Nombre]?.texto || ''}
                                                onChangeText={(value) =>
                                                    handleInputChange(campo.Nombre, {
                                                        ...formData[campo.Nombre],
                                                        texto: value,
                                                    })
                                                }
                                            />
                                        ) : null;
                                    })()}
                                </View>
                            )}


                            {campo.Tipo === 'check' && (
                                <View style={[styles.checkboxContainer, campo.ReferenciaCampo && styles.disabledContainer]}>
                                    <TouchableOpacity
                                        style={[
                                            styles.customCheckbox,
                                            formData[campo.Nombre] && styles.customCheckboxSelected,
                                            campo.ReferenciaCampo && styles.customCheckboxDisabled,
                                        ]}
                                        onPress={() => !campo.ReferenciaCampo && handleInputChange(campo.Nombre, !formData[campo.Nombre])}
                                        disabled={!!campo.ReferenciaCampo}
                                    >
                                        {formData[campo.Nombre] && <View style={styles.customCheckboxInner} />}
                                    </TouchableOpacity>
                                    <Text style={[styles.checkboxLabel, campo.ReferenciaCampo && styles.disabledLabel]}>
                                        {campo.Nombre}
                                    </Text>
                                </View>
                            )}

                            {campo.Tipo === 'firma' && (
                                <View>
                                    <Text style={campo.ReferenciaCampo && styles.disabledLabel}>
                                        {campo.Nombre}
                                    </Text>
                                    <FirmaInput
                                        text={campo.Placeholder || 'Por favor, firme aquí'}
                                        onOK={(signature) => handleInputChange(campo.Nombre, signature)}
                                    />
                                </View>
                            )}
                        </View>
                    ))}
                    {indexCategoria + 1 !== categorias.length && <Separator />}
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
        shadowColor: '#000',
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    CategoryDescription: {
        marginBottom: 20,
        color: '#a0a0a0'
    },
    fieldContainer: {
        marginBottom: 15,
    },
    fieldLabel: {
        fontSize: 14,
        marginBottom: 10,
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
        gap: 20
    },
    booleanOption: {
        flex: 1,
        padding: 10,
        paddingVertical: 20,
        alignItems: 'center',
        borderRadius: 5,
        backgroundColor: '#ececec',
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
        marginRight: 10,
    },
    customCheckboxSelected: {
        backgroundColor: '#2E8B57',
        borderColor: '#2E8B57',
    },
    customCheckboxInner: {
        width: 14,
        height: 14,
        backgroundColor: '#fff',
    },
    checkboxLabel: {
        fontSize: 14,
        flexWrap: 'wrap',
        textAlign: 'left',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        width: '90%',
    },
    customCheckboxDisabled: {
        backgroundColor: '#ccc'
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
        backgroundColor: '#f2f2f2',
        borderColor: '#ccc',
        borderWidth: 1,
        padding: 10,
        borderRadius: 5,
        color: '#a0a0a0',
    },
    disabledLabel: {
        color: '#a0a0a0',
    },
    disabledContainer: {
        backgroundColor: '#f2f2f2',
        padding: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        opacity: 0.6,
    },
    booleanOptionDisabled: {
        backgroundColor: '#f2f2f2',
        borderColor: '#e0e0e0',
    },
    booleanTextDisabled: {
        color: '#a0a0a0',
    },
    optionTextDisabled: {
        color: '#a0a0a0',
    },
    optionButtonDisabled: {
        backgroundColor: '#f2f2f2',
        borderColor: '#e0e0e0',
    }
});
