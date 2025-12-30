import { View, Text, StyleSheet } from 'react-native';
import Board from '../components/Board';

export default function GameScreen({ route }: any) {
  const { mode } = route.params;

  function handleCellPress(index: number) {
    console.log('Cell pressed:', index);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Place 5 ships by tapping cells
      </Text>

      <Board/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
  },
});
