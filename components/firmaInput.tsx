import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import SignatureScreen from "react-native-signature-canvas";

const FirmaInput = ({ text, onOK, defaultSignature }) => {
  const ref = useRef();
  const [modalVisible, setModalVisible] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState(null);

  // Cada vez que cambie "defaultSignature", actualiza la previsualización:
  useEffect(() => {
    if (defaultSignature) {
      setSignaturePreview(defaultSignature);
    }
  }, [defaultSignature]);

  // Maneja la captura de la firma (base64)
  const handleOK = (signature) => {
    setSignaturePreview(signature);
    if (onOK) {
      onOK(signature);
    }
    setModalVisible(false);
  };

  // Limpia la firma manualmente desde el botón
  const clearSignature = () => {
    if (ref.current) {
      ref.current.clearSignature();
    }
    setSignaturePreview(null);
  };

  return (
    <View style={styles.container}>
      {signaturePreview && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewText}>Previsualización de la firma:</Text>
          <Image
            source={{ uri: signaturePreview }}
            style={styles.signaturePreview}
            resizeMode="contain"
          />
        </View>
      )}

      <TouchableOpacity
        style={styles.openButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.openButtonText}>Abrir Firma</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{text}</Text>
          <SignatureScreen
            ref={ref}
            onOK={handleOK}
            autoClear={false}
            descriptionText={text}
            webStyle={styles.signaturePad}
            rotated
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={clearSignature}
            >
              <Text style={styles.buttonText}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={() => ref.current.readSignature()}
            >
              <Text style={styles.buttonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FirmaInput;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 10,
  },
  openButton: {
    backgroundColor: "#0635ae",
    padding: 15,
    borderRadius: 8,
    width: "100%",
  },
  openButtonText: {
    color: "#fff",
    textAlign: "center",
  },
  previewContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  previewText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  signaturePreview: {
    width: 200,
    height: 200,
    marginBottom: 20,
    transform: [{ rotate: "90deg" }],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    width: 100,
  },
  clearButton: {
    backgroundColor: "#FF0000",
  },
  saveButton: {
    backgroundColor: "#008000",
  },
  closeButton: {
    backgroundColor: "#0000FF",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  signaturePad: `
    .m-signature-pad {
      box-shadow: none;
      border: none;
      background-color: #f8f8f8;
      height: 100%;
    }
    .m-signature-pad--body {
      border: none;
      height: 100%;
    }
    .m-signature-pad--footer {
      display: none;
    }
  `,
});
