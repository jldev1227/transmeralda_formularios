import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  errorMessage?: string;
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: undefined };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('Error capturado:', error);
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback errorMessage={this.state.errorMessage} />
      );
    }

    return this.props.children;
  }
}

function ErrorFallback({ errorMessage }: { errorMessage?: string }) {
  const navigation = useNavigation();

  const handleNavigateToLogin = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );  };

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>
        {errorMessage || 'Ocurrió un error. Intenta nuevamente.'}
      </Text>
      <TouchableOpacity onPress={handleNavigateToLogin} style={styles.linkButton}>
        <Text style={styles.linkText}>Ir al Login</Text>
      </TouchableOpacity>
    </View>
  );
}

export default ErrorBoundary;

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  linkButton: {
    padding: 10,
  },
  linkText: {
    color: '#007bff', // Azul como enlace típico
    textDecorationLine: 'underline',
    fontSize: 16,
  },
});
