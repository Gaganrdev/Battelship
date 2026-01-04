import { View, Text, Button, StyleSheet, TextInput, Alert } from 'react-native';
import { useState } from 'react';

export default function HomeScreen({ navigation }: any) {
  const [hostIp, setHostIp] = useState('');

  const handleJoin = () => {
    if (!hostIp.trim()) {
      Alert.alert('Enter IP Address', 'Please enter the host\'s IP address to join');
      return;
    }
    navigation.navigate('Game', { mode: 'join', hostIp: hostIp.trim() });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Battleship</Text>

      <Button
        title="Host Game"
        onPress={() => navigation.navigate('Game', { mode: 'host' })}
      />

      <View style={{ height: 20 }} />

      <Text style={styles.label}>Enter Host IP Address:</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 192.168.1.100"
        value={hostIp}
        onChangeText={setHostIp}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="numeric"
      />

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
    marginBottom: 30,
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
