import React, { useEffect, useState } from 'react';
import 'react-native-get-random-values';
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
import CampoSelector from 'components/Picker';
import FirmaInput from 'components/firmaInput';
import { BorradorFormulario, CategoriaType, FormularioType, RootStackParamList } from 'types';
import { useAuth } from 'context/AuthContext';
import { useFormulario } from 'context/FormularioContext';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { generateUUID } from 'utils/generateUUID';

const Separator = () => <View style={styles.separator} />;
interface ValorObj {
    texto?: string;
    value?: string;
    Valor?: string;
    valor?: string;
}

type Modo = "nuevo" | "borrador" | "enviado";


type FormularioDetalleProps = NativeStackScreenProps<RootStackParamList, 'Detalles del formulario'>;

export default function FormularioDetalle({ route }: FormularioDetalleProps) {

    const {
        RespuestaFormularioId,
        FormularioId = '',
        nombre = '',
        descripcion = '',
        detalles = []
    } = route.params;

    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    // -- Determinación de modo --
    // Declara la variable como Modo | undefined
    const modoParam: Modo | undefined = route.params.modo;

    // Y luego determinas el modo final:
    const modo: Modo = modoParam
        ? modoParam
        : (detalles && detalles.length > 0 ? 'enviado' : 'nuevo');

    const isEditable = (modo === 'nuevo' || modo === 'borrador');

    // Estados dinámicos para almacenar los valores del formulario
    const { state } = useAuth();
    const { state: { formularios } } = useFormulario();
    const { guardarRespuestasOffline, registrarRespuestaFetch } = useFormulario();
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formulario, setFormulario] = useState<FormularioType | null>(null);
    const [categorias, setCategorias] = useState<CategoriaType[]>([]);

    useEffect(() => {
        const formularioEncontrado = formularios.find(
            (formulario: FormularioType) => formulario.FormularioId === route.params.FormularioId
        );

        if (formularioEncontrado) {
            setFormulario(formularioEncontrado);
            setCategorias(formularioEncontrado.categorias || []); // Evita problemas si `categorias` es `undefined`
        }
    }, [formularios, route.params.FormularioId]); // Agregar dependencias para evitar advertencias de React


    // Precargar si "modo" es enviado y tenemos detalles
    useEffect(() => {
        if (modo === 'enviado' || modo === 'borrador' && detalles?.length) {
            precargarDesdeDetalles(detalles);
        }
    }, [modo, detalles]);

    /**
     * Lógica para precargar datos en formData desde 'detalles'.
     * Cada detalle es { CampoId, valor } y guardaremos valor con la key CampoId.
    */
    const precargarDesdeDetalles = (detalles) => {
        if (!detalles || !Array.isArray(detalles)) {
            console.error('Detalles inválidos:', detalles);
            return;
        }

        const initialFormData = {};
        detalles.forEach((detalle) => {
            let valor = detalle.valor || detalle.Valor; // Asegura la compatibilidad con ambas claves
            if (valor === 'true') valor = true;
            else if (valor === 'false') valor = false;
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

            if (formulario) {
                categorias.forEach((categoria) => {
                    (categoria.campos || []).forEach((campo) => {
                        if (campo.CampoId === campoId && campo.Tipo === "opcion") {
                            if (campo.HabilitaTexto === false) {
                                // Si no habilita texto, guardar solo el valor
                                nuevoFormData[campoId] = value?.valor ?? null;
                            } else {
                                // Mantener estructura con texto
                                nuevoFormData[campoId] = value ?? null;
                            }
                        } else {
                            nuevoFormData[campoId] = value;
                        }

                        if (campo.ReferenciaCampo && campo.ReferenciaPropiedad && value.datos) {
                            const valorReferenciado = value?.datos[campo.ReferenciaPropiedad];
                            nuevoFormData[campo.CampoId] = valorReferenciado ?? campo.ValorDefecto ?? null;
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

    const transformarDatos = (formData, categorias) => {
        return Object.entries(formData).map(([campoId, valor]) => {
            // Encuentra el campo en 'categorias'
            const campo = categorias
                .flatMap((c) => c.campos)
                .find((c) => c.CampoId === campoId);

            let valorTransformado;

            // 1) Verificar si 'valor' es un objeto
            if (typeof valor === 'object' && valor !== null) {
                // "Forzamos" a TS a tratar 'valor' como 'ValorObj'
                const obj = valor as ValorObj;

                if (obj.texto?.trim()) {
                    valorTransformado = obj.texto;
                } else if (obj.value !== undefined) {
                    valorTransformado = obj.value;
                } else if (obj.Valor !== undefined) {
                    valorTransformado = obj.Valor;
                } else if (obj.valor !== undefined) {
                    valorTransformado = obj.valor;
                } else {
                    valorTransformado = JSON.stringify(obj);
                }
            } else {
                valorTransformado = valor;
            }

            // 3) Convertir a string, excepto null/undefined => ""
            return {
                CampoId: campo?.CampoId,
                valor:
                    valorTransformado !== null && valorTransformado !== undefined
                        ? valorTransformado.toString()
                        : "",
            };
        });
    };


    // En handleSubmit o cualquier lugar donde uses transformarDatos
    const handleSubmit = async () => {
        // (2) Evitar reenvíos
        if (isSubmitting) return;
        setIsSubmitting(true);     // Bloqueamos nuevos envíos

        if (!formulario) {
            setIsSubmitting(false);
            return;
        }

        if (!isEditable) return;

        const processedFormData = sincronizarReferencias(formData, categorias);
        const { errores, nuevoFormData } = validarCampos(processedFormData, categorias);

        if (errores.length > 0) {
            setIsSubmitting(false);
            Alert.alert('Errores de Validación', errores.join('\n\n'), [{ text: 'Aceptar' }]);
            return;
        }

        const detallesTransformados = transformarDatos(nuevoFormData, categorias);

        if (!detallesTransformados.length) {
            console.error('No se encontraron detalles para enviar.');
            setIsSubmitting(false);
            Alert.alert('Error', 'No se encontraron detalles válidos para enviar.', [
                { text: 'Aceptar' },
            ]);
            return;
        }

        const input = {
            FormularioId: formulario?.FormularioId ?? null, // Asegura que no sea undefined
            UsuarioId: state.usuario?.id.toString() ?? null, // Asegura que no sea undefined
            detalles: detallesTransformados,
          };
          

        if (!input.FormularioId || !input.UsuarioId) {
            setIsSubmitting(false);
            throw new Error('FormularioId o UsuarioId no están definidos.');
        }

        try {

            await registrarRespuestaFetch(input)

            Alert.alert('Éxito', 'Las respuestas han sido registradas exitosamente.', [
                {
                    text: 'Aceptar',
                    onPress: () => {
                        setFormData({});
                        // Regresar a la pantalla principal (o la que decidas)
                        navigation.reset({ index: 0, routes: [{ name: 'index' }] });
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
        } finally {
            // (3) Liberamos el bloqueo de envío
            setIsSubmitting(false);
        }
    };

    const handleGuardarBorrador = async () => {
        if (!isEditable) return; // modo enviado -> no hace nada

        const formulario = route.params;
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
            categorias
        );

        // 2. Transformar
        const detallesTransformados = transformarDatos(
            processedFormData,
            categorias
        );

        // Verificamos si estamos creando un nuevo borrador o actualizando uno existente
        const esBorradorExistente = modo === 'borrador' && route.params?.RespuestaFormularioId;

        // 3. Si es borrador existente, cargamos o recuperamos el borrador guardado


        // 4. Construir el objeto borrador con la información que queramos guardar
        const borrador: BorradorFormulario = {
            RespuestaFormularioId: esBorradorExistente ? RespuestaFormularioId : generateUUID(),
            FormularioId: formulario.FormularioId,
            UsuarioId: state.usuario?.id,
            detalles: detallesTransformados,
            estado: "borrador",

            // **Mantén la fecha de creación previa si existe; 
            //   de lo contrario, usa la fecha actual.**
            creacion: !esBorradorExistente ? new Date().toISOString() : (route.params as any).creacion,

            // Si estamos actualizando un borrador existente, 
            // agregamos la fecha de modificación
            modificacion: esBorradorExistente ? new Date().toISOString() : ''
        };

        try {

            // 5. Guardar o actualizar el borrador
            await guardarRespuestasOffline(formulario.FormularioId, borrador);

            Alert.alert(
                'Borrador Guardado',
                esBorradorExistente
                    ? 'El borrador se ha actualizado correctamente.'
                    : 'El formulario se ha guardado como borrador correctamente.',
                [
                    {
                        text: 'Aceptar',
                        onPress: () => {
                            setFormData({});
                            navigation.reset({ index: 0, routes: [{ name: 'index' }] }); // Navega de vuelta al flujo de autenticación
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Error al guardar o actualizar el borrador:', error);
            Alert.alert('Error', 'Hubo un problema al guardar el borrador.', [
                { text: 'Aceptar' },
            ]);
        }
    };

    if (isSubmitting) {
        return (
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                gap: 10
            }}>
                <ActivityIndicator size="large" color="#2E8B57" />;
                <Text style={{
                    fontSize: 16,
                    color: '#2E8B57',
                }}>Enviando respuestas...</Text>
            </View>
        )
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{nombre}</Text>
            <Text>{route.params.descripcion}</Text>

            {categorias.map((categoria, indexCategoria) => (
                <View key={categoria.CategoriaId} style={styles.categoryContainer}>
                    <Text style={styles.categoryTitle}>{categoria.Nombre}</Text>
                    {categoria.Descripcion && (
                        <Text style={styles.CategoryDescription}>
                            {categoria.Descripcion}
                        </Text>
                    )}

                    {categoria.campos.map((campo) => {
                        // ----------------------------------------
                        // Render de cada tipo de campo
                        // ----------------------------------------
                        if (campo.Tipo === 'selector') {
                            return (
                                <View key={campo.CampoId} style={styles.fieldContainer}>
                                    <CampoSelector
                                        campo={campo}
                                        disabled={!!campo.ReferenciaCampo || !isEditable}
                                        handleInputChange={handleInputChange}
                                        // Aquí inyectas el valor que quieres usar como "default"
                                        defaultValue={typeof formData[campo.CampoId] === "string" ? formData[campo.CampoId] : formData[campo.CampoId]?.Valor}
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
                                    <Text style={styles.fieldLabel}>
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
                                                modo as Modo !== "enviado" ? formData[campo.CampoId] :
                                                    campo.ReferenciaCampo && campo.ReferenciaPropiedad
                                                        ? formData[campo.ReferenciaCampo]?.[campo.ReferenciaPropiedad] ?? ''
                                                        : (
                                                            typeof formData[campo.CampoId] === 'object'
                                                                ? formData[campo.CampoId]
                                                                : formData[campo.CampoId]
                                                        ) ?? ''
                                                : // Si NO es editable, usamos la segunda versión de "value"
                                                campo.ReferenciaCampo && campo.ReferenciaPropiedad
                                                    ? formData[campo.CampoId] ?? ''
                                                    : (
                                                        typeof formData[campo.CampoId] === 'object'
                                                            ? formData[campo.CampoId]
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
                                        inputMode="numeric"
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

                            // Si no hay coincidencia exacta y el modo es 'enviado', buscar una opción con HabilitaTexto: true
                            if (!opcionElegida && valorSeleccionado && modo !== 'nuevo') {
                                opcionElegida = campo.opciones?.find((o) => o.HabilitaTexto);
                            }

                            // Determinar si se debe mostrar el TextInput
                            const mostrarTextInput =
                                modo !== 'nuevo'
                                    ? opcionElegida?.HabilitaTexto && (!opcionElegida || opcionElegida.Valor !== valorSeleccionado)
                                    : opcionElegida?.HabilitaTexto;

                            return (
                                <View key={campo.CampoId} style={styles.fieldContainer}>
                                    <Text style={styles.fieldLabel}>{campo.Nombre}</Text>

                                    {campo.opciones?.map((opcion, opcionIndex) => {
                                        // Verificar si esta opción está seleccionada
                                        const opcionSeleccionada =
                                            modo !== 'nuevo'
                                                ? opcion.Valor === valorSeleccionado ||
                                                (opcion.HabilitaTexto && valorSeleccionado !== opcionElegida?.Valor)
                                                : opcion.Valor === valorSeleccionado;

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
                                            enabled={isEditable}
                                        />
                                    ) : (
                                        // Modo editable (nuevo/borrador)
                                        <FirmaInput
                                            text={campo.Placeholder || "Por favor, firme aquí"}
                                            defaultSignature={formData[campo.CampoId]} // o null si no existe
                                            onOK={(signature) => handleInputChange(campo.CampoId, signature)}
                                            enabled={isEditable}
                                        />
                                    )}

                                </View>
                            );
                        }

                        // Si no coincide con ningún tipo conocido, no renderiza nada
                        return <Text>No hay campos para mostrar</Text>;
                    })}

                    {indexCategoria + 1 !== categorias.length && <Separator />}
                </View>
            ))}

            {isEditable && (
                <View>
                    <TouchableOpacity onPress={handleGuardarBorrador} style={styles.buttonSave}>
                        <Text style={styles.buttonSaveText}>{modo === 'borrador' ? 'Actualizar borrador' : 'Guardar como borrador'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity disabled={isSubmitting} onPress={handleSubmit} style={styles.buttonSubmit}>
                        <Text style={styles.buttonSubmitText}>Enviar respuestas</Text>
                    </TouchableOpacity>
                </View>
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
