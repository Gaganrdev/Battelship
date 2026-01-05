import { View, Text, Button, StyleSheet, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { generateRoomId } from '../network/peerConnection';

export default function HomeScreen({ navigation }: any) {
  const [roomId, setRoomId] = useState('');

  const handleHost = () => {
    // Generate a room ID automatically
    const newRoomId = generateRoomId();
    navigation.navigate('Game', { mode: 'host', roomId: newRoomId });
  };

  const handleJoin = () => {
    if (!roomId.trim()) {
      Alert.alert('Enter Room Code', 'Please enter the 6-digit room code from the host');
      return;
    }
    navigation.navigate('Game', { mode: 'join', roomId: roomId.trim().toUpperCase() });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Battleship</Text>

      <Text style={styles.infoText}>🎮 No server needed! Works anywhere with internet.</Text>

      <Button
        title="🎯 Host Game"
        onPress={handleHost}
      />

      <View style={{ height: 20 }} />

      <Text style={styles.label}>Or join with room code:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter 6-digit code (e.g., ABC123)"
        value={roomId}
        onChangeText={setRoomId}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
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
