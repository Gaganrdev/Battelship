import { View, Text, Button, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Battleship</Text>

      <Button
        title="Host Game"
        onPress={() => navigation.navigate('Game', { mode: 'host' })}
      />

      <View style={{ height: 20 }} />

      <Button
        title="Join Game"
        onPress={() => navigation.navigate('Game', { mode: 'join' })}
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
});
