import React, { useEffect, useState } from 'react';
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
import FirmaInput from 'components/firmaInput';
import { BorradorFormulario, FormularioType, RootStackParamList } from 'types';
import { REGISTRAR_RESPUESTA_FORMULARIO } from 'graphql/mutation';
import { useAuth } from 'context/AuthContext';
import { useFormulario } from 'context/FormularioContext';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const Separator = () => <View style={styles.separator} />;

type FormularioDetalleProps = NativeStackScreenProps<RootStackParamList, 'Detalles del formulario'>;

export default function FormularioDetalle({ route }: FormularioDetalleProps) {
    const {
        id,
        nombre = '',
        descripcion = '',
        detalles = [],
    } = route.params;

    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    // -- Determinación de modo --
    const modoParam = route.params.modo;
    const modo = modoParam
        ? modoParam
        : (detalles && detalles.length > 0 ? 'enviado' : 'nuevo');

    const isEditable = (modo === 'nuevo' || modo === 'borrador');

    // GraphQL para obtener el formulario por ID
    const { loading, error, data } = useQuery<{ obtenerFormulario: FormularioType }>(
        OBTENER_FORMULARIO,
        {
            variables: { id },
        }
    );

    // Estados dinámicos para almacenar los valores del formulario
    const { state } = useAuth();
    const { guardarRespuestasOffline } = useFormulario();
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [registrarRespuesta] = useMutation(REGISTRAR_RESPUESTA_FORMULARIO);

    // Precargar si "modo" es enviado y tenemos detalles
    useEffect(() => {
        if (modo === 'enviado' && detalles?.length) {
            precargarDesdeDetalles(detalles);
        }
    }, [modo, detalles]);

    /**
     * Lógica para precargar datos en formData desde 'detalles'.
     * Cada detalle es { CampoId, valor } y guardaremos valor con la key CampoId.
    */
    const precargarDesdeDetalles = (detalles: any[]) => {
        const initialFormData: Record<string, any> = {};

        detalles.forEach((detalle) => {
            let valor = detalle.Valor;

            if (valor === 'true') {
                valor = true;
            } else if (valor === 'false') {
                valor = false;
            }

            initialFormData[detalle.CampoId] = valor;
        });

        setFormData(initialFormData);
    };


    // -- Helpers de Referencias, Validaciones y Transformación --

    /**
     * handleInputChange
     * Permite cambiar el estado del formulario,
     * impidiendo cambios si es modo 'enviado'.
     * Usamos campoId como clave.
    */
    const handleInputChange = (campoId: string, value: any) => {
        if (!isEditable) return;

        setFormData((prev) => {
            const nuevoFormData = { ...prev };

            const formulario = data?.obtenerFormulario;
            if (formulario) {
                formulario.categorias.forEach((categoria) => {
                    (categoria.campos || []).forEach((campo) => {
                        if (campo.CampoId === campoId && campo.Tipo === "opcion") {
                            if (campo.HabilitaTexto === false) {
                                // Si no habilita texto, guardar solo el valor
                                nuevoFormData[campoId] = value.valor;
                            } else {
                                // Mantener estructura con texto
                                nuevoFormData[campoId] = value;
                            }
                        } else {
                            nuevoFormData[campoId] = value;
                        }

                        // Procesar referencias si existen
                        if (campo.ReferenciaCampo && campo.ReferenciaPropiedad) {
                            const valorReferenciado = value?.[campo.ReferenciaPropiedad];
                            nuevoFormData[campo.CampoId] =
                                valorReferenciado ?? campo.ValorDefecto;
                        }
                    });
                });
            } else {
                nuevoFormData[campoId] = value;
            }

            return nuevoFormData;
        });
    };


    const sincronizarReferencias = (
        formData: Record<string, any>,
        categorias: any[]
    ) => {
        const nuevoFormData = { ...formData };
        categorias.forEach((categoria) => {
            categoria.campos.forEach((campo: any) => {
                if (campo.ReferenciaCampo && campo.ReferenciaPropiedad) {
                    const valorReferenciado =
                        formData[campo.ReferenciaCampo]?.[campo.ReferenciaPropiedad];
                    if (valorReferenciado !== undefined) {
                        nuevoFormData[campo.CampoId] = valorReferenciado;
                    }
                }
            });
        });
        return nuevoFormData;
    };

    /**
     * validarCampos
     * Revisa cuáles campos son requeridos. OJO: aquí se está usando campo.Nombre
     * para detectar el valor en formData. Se podría refinar para que también
     * use la key = CampoId, pero aquí se deja según la lógica que ya tenías.
    */
    const validarCampos = (formData: Record<string, any>, categorias: any[]) => {
        const errores: string[] = [];
        const nuevoFormData = { ...formData };

        categorias.forEach((categoria) => {
            categoria.campos.forEach((campo) => {
                let valorCampo = nuevoFormData[campo.CampoId];

                // Si el campo es de tipo selector y tiene un parámetro
                if (campo.Tipo === 'selector' && campo.Parametro && valorCampo) {
                    const parametroValor = valorCampo[campo.Parametro];
                    nuevoFormData[campo.CampoId] = parametroValor;
                    valorCampo = parametroValor;
                }

                // Validar que el campo esté diligenciado
                if (
                    campo.Requerido &&
                    (valorCampo === undefined ||
                        valorCampo === null ||
                        valorCampo === '')
                ) {
                    errores.push(
                        `El campo "${campo.Nombre}" de la categoría "${categoria.Nombre}" es obligatorio.`
                    );
                }
            });
        });

        return { errores, nuevoFormData };
    };

    // -- Handlers de Botones --

    const transformarDatos = (formData: Record<string, any>, categorias: any[]) => {
        return Object.entries(formData).map(([campoId, valor]) => {
            const campo = categorias
                .flatMap((c: any) => c.campos)
                .find((c: any) => c.CampoId === campoId);

            // Si no habilita texto, usar el valor directamente
            const valorTransformado = typeof valor === "object" && valor !== null
                ? valor.texto?.trim() // Si `texto` existe y no está vacío
                    ? valor.texto // Usa `texto`
                    : valor.valor // Si `texto` está vacío, usa `valor`
                : valor; // Si no es un objeto, usa el valor directamente.

            return {
                CampoId: campo?.CampoId,
                valor: valorTransformado !== null && valorTransformado !== undefined
                    ? valorTransformado.toString()
                    : "", // Si es null o undefined, enviar como cadena vacía.
            };
        });
    };

    // En handleSubmit o cualquier lugar donde uses transformarDatos
    const handleSubmit = async () => {
        if (!isEditable) return; // Modo enviado -> no hace nada

        const formulario = data?.obtenerFormulario;
        if (!formulario) return;

        const processedFormData = sincronizarReferencias(formData, formulario.categorias);

        const { errores, nuevoFormData } = validarCampos(processedFormData, formulario.categorias);

        if (errores.length > 0) {
            Alert.alert('Errores de Validación', errores.join('\n\n'), [{ text: 'Aceptar' }]);
            return;
        }

        // Transformar datos usando la lógica actualizada
        const detallesTransformados = transformarDatos(nuevoFormData, formulario.categorias);

        if (!detallesTransformados.length) {
            console.error('No se encontraron detalles para enviar.');
            Alert.alert('Error', 'No se encontraron detalles válidos para enviar.', [
                { text: 'Aceptar' },
            ]);
            return;
        }

        const input = {
            FormularioId: formulario?.FormularioId || null,
            UsuarioId: state.usuario?.id || null,
            detalles: detallesTransformados,
        };

        if (!input.FormularioId || !input.UsuarioId) {
            throw new Error('FormularioId o UsuarioId no están definidos.');
        }

        try {
            await registrarRespuesta({ variables: { input } });
            Alert.alert('Éxito', 'Las respuestas han sido registradas exitosamente.', [
                {
                    text: 'Aceptar',
                    onPress: () => {
                        setFormData({}); // Vaciar el formulario
                        navigation.replace('index'); // Reemplazar la navegación
                    },
                },
            ]);
        } catch (error) {
            console.error('Error al registrar las respuestas:', error);
            Alert.alert(
                'Error',
                'Hubo un problema al registrar las respuestas. Inténtalo de nuevo.',
                [{ text: 'Aceptar' }]
            );
        }
    };

    const handleGuardarBorrador = () => {
        if (!isEditable) return; // modo enviado -> no hace nada

        const formulario = data?.obtenerFormulario;
        if (!formulario || !formulario.FormularioId || !state.usuario?.id) {
            Alert.alert(
                'Error',
                'No se puede guardar el borrador. Falta información del formulario o del usuario.',
                [{ text: 'Aceptar' }]
            );
            return;
        }

        // 1. Sincronizar referencias
        const processedFormData = sincronizarReferencias(
            formData,
            formulario.categorias
        );

        // 2. Transformar
        const detallesTransformados = transformarDatos(
            processedFormData,
            formulario.categorias
        );

        // 3. Crear borrador
        const borrador: BorradorFormulario = {
            FormularioId: formulario.FormularioId,
            UsuarioId: state.usuario?.id,
            detalles: detallesTransformados,
        };

        // 4. Guardar offline
        guardarRespuestasOffline(formulario.FormularioId, borrador);

        Alert.alert(
            'Borrador Guardado',
            'El formulario se ha guardado como borrador correctamente.',
            [{ text: 'Aceptar' }]
        );
    };

    // -- Render principal --

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
                <Text style={styles.errorText}>
                    Error al cargar el formulario: {error.message}
                </Text>
            </View>
        );
    }

    const formulario = data?.obtenerFormulario;
    if (!formulario || !Array.isArray(formulario.categorias)) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                    No se encontró el formulario o sus categorías.
                </Text>
            </View>
        );
    }

    // Arreglar posibles nulos en los campos
    formulario.categorias.forEach((categoria) => {
        if (!Array.isArray(categoria.campos)) {
            console.warn(
                `La categoría con ID ${categoria.CategoriaId} tiene campos nulos o inválidos.`
            );
            categoria.campos = [];
        }
    });

    const categorias = formulario.categorias;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Mostramos el nombre y descripción proveniente de la navegación, o del formulario */}
            <Text style={styles.title}>{nombre || formulario.Nombre}</Text>
            <Text>{descripcion || formulario.Descripcion}</Text>

            {/* Renderizado de categorías y campos */}
            {categorias.map((categoria, indexCategoria) => (
                <View key={categoria.CategoriaId} style={styles.categoryContainer}>
                    <Text style={styles.categoryTitle}>{categoria.Nombre}</Text>
                    {categoria.Descripcion && (
                        <Text style={styles.CategoryDescription}>
                            {categoria.Descripcion}
                        </Text>
                    )}

                    {(categoria.campos || []).map((campo) => {
                        // ----------------------------------------
                        // Render de cada tipo de campo
                        // ----------------------------------------
                        if (campo.Tipo === 'selector') {
                            return (
                                <View key={campo.CampoId} style={styles.fieldContainer}>
                                    <CampoSelector
                                        campo={campo}
                                        formData={formData}
                                        setFormData={setFormData}
                                        disabled={!!campo.ReferenciaCampo || !isEditable}
                                        handleInputChange={handleInputChange}

                                        // Aquí inyectas el valor que quieres usar como "default"
                                        defaultValue={formData[campo.CampoId]}
                                    />
                                </View>
                            );
                        }

                        if (campo.Tipo === 'boolean') {
                            return (
                                <View key={campo.CampoId} style={styles.fieldContainer}>
                                    <Text
                                        style={styles.fieldLabel}
                                    >
                                        {campo.Nombre}
                                    </Text>

                                    <View
                                        style={styles.booleanContainer}
                                    >
                                        <TouchableOpacity
                                            style={[
                                                styles.booleanOption,
                                                formData[campo.CampoId] === true && styles.booleanOptionSelected,
                                                // Solo aplicamos estilo "disabled" si hay ReferenciaCampo (no cuando !isEditable):
                                                campo.ReferenciaCampo && styles.booleanOptionDisabled,
                                            ]}
                                            onPress={() => handleInputChange(campo.CampoId, true)}
                                            // Aquí sí sigue el disabled para !isEditable
                                            disabled={!!campo.ReferenciaCampo || !isEditable}
                                        >
                                            <Text
                                                style={[
                                                    styles.booleanText,
                                                    formData[campo.CampoId] === true && styles.booleanTextSelected,
                                                    campo.ReferenciaCampo && styles.booleanTextDisabled,
                                                ]}
                                            >
                                                {campo.OpcionTrue || 'Sí'}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[
                                                styles.booleanOption,
                                                formData[campo.CampoId] === false && styles.booleanOptionSelected,
                                                // Solo estilo "disabled" si hay ReferenciaCampo
                                                campo.ReferenciaCampo && styles.booleanOptionDisabled,
                                            ]}
                                            onPress={() => handleInputChange(campo.CampoId, false)}
                                            disabled={!!campo.ReferenciaCampo || !isEditable}
                                        >
                                            <Text
                                                style={[
                                                    styles.booleanText,
                                                    formData[campo.CampoId] === false && styles.booleanTextSelected,
                                                    campo.ReferenciaCampo && styles.booleanTextDisabled,
                                                ]}
                                            >
                                                {campo.OpcionFalse || 'No'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        }

                        if (campo.Tipo === 'texto') {
                            return (
                                <View key={campo.CampoId} style={styles.fieldContainer}>
                                    <Text
                                        style={styles.fieldLabel}
                                    >
                                        {campo.Nombre}
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.textInput,
                                            (campo.ReferenciaCampo || !isEditable) && styles.textInputDisabled,
                                        ]}
                                        placeholder={campo.Placeholder || 'Escribe aquí...'}
                                        value={
                                            isEditable
                                                ? // Si es editable, usamos la primera versión de "value"
                                                campo.ReferenciaCampo && campo.ReferenciaPropiedad
                                                    ? formData[campo.ReferenciaCampo]?.[campo.ReferenciaPropiedad] ?? ''
                                                    : (
                                                        typeof formData[campo.CampoId] === 'object'
                                                            ? formData[campo.CampoId]?.texto
                                                            : formData[campo.CampoId]
                                                    ) ?? ''
                                                : // Si NO es editable, usamos la segunda versión de "value"
                                                campo.ReferenciaCampo && campo.ReferenciaPropiedad
                                                    ? formData[campo.CampoId] ?? ''
                                                    : (
                                                        typeof formData[campo.CampoId] === 'object'
                                                            ? formData[campo.CampoId]?.texto
                                                            : formData[campo.CampoId]
                                                    ) ?? ''
                                        }
                                        onChangeText={(value) =>
                                            handleInputChange(campo.CampoId, value)
                                        }
                                        editable={!campo.ReferenciaCampo && isEditable}
                                    />
                                </View>
                            );
                        }

                        if (campo.Tipo === 'number') {
                            return (
                                <View key={campo.CampoId} style={styles.fieldContainer}>
                                    <Text
                                        style={
                                            styles.fieldLabel}
                                    >
                                        {campo.Nombre}
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.numberInput,
                                            (campo.ReferenciaCampo || !isEditable) &&
                                            styles.textInputDisabled,
                                        ]}
                                        placeholder={
                                            campo.Placeholder || 'Ingrese un valor numérico'
                                        }
                                        keyboardType="numeric"
                                        value={
                                            campo.ReferenciaCampo &&
                                                campo.ReferenciaPropiedad
                                                ? formData[campo.ReferenciaCampo]?.[
                                                    campo.ReferenciaPropiedad
                                                ]?.toString() || ''
                                                : formData[campo.CampoId]?.toString() || ''
                                        }
                                        onChangeText={(value) =>
                                            handleInputChange(
                                                campo.CampoId,
                                                value ? parseFloat(value) : ''
                                            )
                                        }
                                        editable={!campo.ReferenciaCampo && isEditable}
                                    />
                                </View>
                            );
                        }


                        if (campo.Tipo === 'opcion') {
                            const valorSeleccionado = formData[campo.CampoId]?.valor || formData[campo.CampoId];
                        
                            // Buscar coincidencia exacta con el valor seleccionado
                            let opcionElegida = campo.opciones?.find((o) => o.Valor === valorSeleccionado);
                        
                            // Si no hay coincidencia exacta, buscar una opción con HabilitaTexto: true
                            if (!opcionElegida && valorSeleccionado) {
                                opcionElegida = campo.opciones?.find((o) => o.HabilitaTexto);
                            }
                        
                            // Determinar si se debe mostrar el TextInput
                            const mostrarTextInput =
                                opcionElegida?.HabilitaTexto &&
                                (!opcionElegida || opcionElegida.Valor !== valorSeleccionado);
                        
                        
                            return (
                                <View key={campo.CampoId} style={styles.fieldContainer}>
                                    <Text style={styles.fieldLabel}>{campo.Nombre}</Text>
                        
                                    {/* Render de las opciones */}
                                    {campo.opciones?.map((opcion, opcionIndex) => {
                                        // Verificar si esta opción está seleccionada

                                        console.log(opcion)
                                        const opcionSeleccionada = opcion.Valor === valorSeleccionado || opcion.HabilitaTexto && valorSeleccionado !== opcionElegida?.Valor;
                        
                                        return (
                                            <TouchableOpacity
                                                key={opcionIndex}
                                                style={[
                                                    styles.optionButton,
                                                    opcionSeleccionada && styles.optionSelected, // Marcar solo la opción coincidente
                                                    campo.ReferenciaCampo && styles.optionButtonDisabled, // Estilo para opción deshabilitada
                                                ]}
                                                onPress={() =>
                                                    handleInputChange(campo.CampoId, {
                                                        valor: opcion.Valor,
                                                        texto: opcion.HabilitaTexto ? '' : null, // Limpiar texto si HabilitaTexto es false
                                                    })
                                                }
                                                disabled={!!campo.ReferenciaCampo || !isEditable}
                                            >
                                                <Text
                                                    style={[
                                                        opcionSeleccionada && styles.optionTextSelected, // Estilo de texto seleccionado
                                                        campo.ReferenciaCampo && styles.optionTextDisabled, // Estilo para texto deshabilitado
                                                    ]}
                                                >
                                                    {opcion.Valor}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                        
                                    {/* Mostrar el TextInput si se cumple la condición */}
                                    {mostrarTextInput && (
                                        <TextInput
                                            style={[
                                                styles.textInput,
                                                !isEditable && styles.textInputDisabled,
                                            ]}
                                            placeholder={opcionElegida?.Placeholder || 'Escribe aquí...'}
                                            keyboardType={
                                                opcionElegida?.TipoTexto === 'number' ? 'numeric' : 'default'
                                            }
                                            value={
                                                formData[campo.CampoId] || '' // Mostrar el texto ingresado por el usuario
                                            }
                                            onChangeText={(value) =>
                                                handleInputChange(campo.CampoId, {
                                                    ...formData[campo.CampoId],
                                                    texto: value,
                                                })
                                            }
                                            editable={isEditable}
                                        />
                                    )}
                                </View>
                            );
                        }
                                                 

                        if (campo.Tipo === 'check') {
                            // 1. Detectar si es boolean true o string "true"
                            const esCheckActivo =
                                formData[campo.CampoId] === true || formData[campo.CampoId] === 'true';

                            return (
                                <View
                                    key={campo.CampoId}
                                    style={
                                        styles.checkboxContainer}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.customCheckbox,
                                            esCheckActivo && styles.customCheckboxSelected,
                                            // Solo aplica estilo 'deshabilitado' si ReferenciaCampo
                                            campo.ReferenciaCampo && styles.customCheckboxDisabled,
                                        ]}
                                        onPress={() =>
                                            handleInputChange(
                                                campo.CampoId,
                                                // Si está 'true' => poner 'false', si está 'false' => poner 'true'
                                                esCheckActivo ? false : true
                                            )
                                        }
                                        disabled={!!campo.ReferenciaCampo || !isEditable}
                                    >
                                        {esCheckActivo && (
                                            <View style={styles.customCheckboxInner} />
                                        )}
                                    </TouchableOpacity>

                                    <Text
                                        style={[
                                            styles.checkboxLabel,
                                            // Lo mismo: solamente si ReferenciaCampo quieres "gris" en la etiqueta
                                            campo.ReferenciaCampo && styles.disabledLabel,
                                        ]}
                                    >
                                        {campo.Nombre}
                                    </Text>
                                </View>
                            );
                        }


                        if (campo.Tipo === 'firma') {
                            return (
                                <View key={campo.CampoId} style={styles.fieldContainer}>
                                    <Text
                                        style={
                                            styles.fieldLabel}
                                    >
                                        {campo.Nombre}
                                    </Text>
                                    {!isEditable ? (
                                        // Modo no editable (ej: enviado)
                                        <FirmaInput
                                            text={campo.Placeholder || "Por favor, firme aquí"}
                                            defaultSignature={formData[campo.CampoId]} // <-- firma guardada en formData
                                            onOK={() => { }}
                                        />
                                    ) : (
                                        // Modo editable (nuevo/borrador)
                                        <FirmaInput
                                            text={campo.Placeholder || "Por favor, firme aquí"}
                                            defaultSignature={formData[campo.CampoId]} // o null si no existe
                                            onOK={(signature) => handleInputChange(campo.CampoId, signature)}
                                        />
                                    )}

                                </View>
                            );
                        }

                        // Si no coincide con ningún tipo conocido, no renderiza nada
                        return null;
                    })}

                    {indexCategoria + 1 !== categorias.length && <Separator />}
                </View>
            ))}

            {/* Mostrar botones sólo si es editable */}
            {isEditable && (
                <>
                    <TouchableOpacity onPress={handleGuardarBorrador} style={styles.buttonSave}>
                        <Text style={styles.buttonSaveText}>Guardar como borrador</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSubmit} style={styles.buttonSubmit}>
                        <Text style={styles.buttonSubmitText}>Enviar respuestas</Text>
                    </TouchableOpacity>
                </>
            )}
        </ScrollView>
    );
}

// ------------------ ESTILOS ------------------

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
        color: '#a0a0a0',
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
    textInputDisabled: {
        backgroundColor: '#f2f2f2',
        borderColor: '#ccc',
        borderWidth: 1,
        padding: 10,
        borderRadius: 5,
        color: '#a0a0a0',
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
        gap: 20,
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
    booleanOptionDisabled: {
        backgroundColor: '#f2f2f2',
        borderColor: '#e0e0e0',
    },
    booleanTextDisabled: {
        color: '#a0a0a0',
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
    optionButtonDisabled: {
        backgroundColor: '#f2f2f2',
        borderColor: '#e0e0e0',
    },
    optionTextDisabled: {
        color: '#a0a0a0',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        width: '90%',
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
    customCheckboxDisabled: {
        backgroundColor: '#ccc',
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
    separator: {
        marginVertical: 8,
        borderBottomColor: '#737373',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    buttonSave: {
        backgroundColor: '#eeeeee',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
    },
    buttonSaveText: {
        color: '#808080',
        textAlign: 'center',
    },
    buttonSubmit: {
        backgroundColor: '#2E8B57',
        padding: 15,
        borderRadius: 8,
    },
    buttonSubmitText: {
        color: '#fff',
        textAlign: 'center',
    },
});
