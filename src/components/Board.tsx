import { View, StyleSheet } from 'react-native';
import Cell from './Cell';

type BoardProps = {
  onCellPress: (index: number) => void;
};

export default function Board({ onCellPress }: BoardProps) {
  return (
    <View style={styles.board}>
      {Array.from({ length: 100 }).map((_, index) => (
        <Cell key={index} onPress={() => onCellPress(index)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    width: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
