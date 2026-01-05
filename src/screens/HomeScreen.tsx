import { View, Text, Button, StyleSheet, TextInput, Alert } from 'react-native';
import { useState } from 'react';

export default function HomeScreen({ navigation }: any) {
  const [serverIp, setServerIp] = useState('');

  const handleHost = () => {
    if (!serverIp.trim()) {
      Alert.alert('Enter Server IP', 'Please enter your computer\'s IP address where the server is running');
      return;
    }
    navigation.navigate('Game', { mode: 'host', serverIp: serverIp.trim() });
  };

  const handleJoin = () => {
    if (!serverIp.trim()) {
      Alert.alert('Enter Server IP', 'Please enter the server IP address');
      return;
    }
    navigation.navigate('Game', { mode: 'join', serverIp: serverIp.trim() });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Battleship</Text>

      <Text style={styles.infoText}>Enter the IP address shown on the server</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g., 192.168.1.100"
        value={serverIp}
        onChangeText={setServerIp}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="numeric"
      />

      <Button
        title="Host Game"
        onPress={handleHost}
      />

      <View style={{ height: 10 }} />

      <Button
        title="Join Game"
        onPress={handleJoin}
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
