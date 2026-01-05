import { View, Text, Button, StyleSheet, TextInput, Alert } from 'react-native';
import { useState } from 'react';

export default function HomeScreen({ navigation }: any) {
  const [serverIp, setServerIp] = useState('');

  const handleConnect = () => {
    if (!serverIp.trim()) {
      Alert.alert('Enter Server IP', 'Please enter the server IP address shown when you run: npm run ws-server');
      return;
    }
    navigation.navigate('Game', { serverIp: serverIp.trim() });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Battleship</Text>

      <Text style={styles.infoText}>🎮 Run "npm run ws-server" on your computer</Text>
      <Text style={styles.infoText}>Both players enter the same IP address</Text>

      <TextInput
        style={styles.input}
        placeholder="Server IP (e.g., 192.168.1.185)"
        value={serverIp}
        onChangeText={setServerIp}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Button
        title="Connect & Play"
        onPress={handleConnect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
});
