import { TouchableOpacity, Text, StyleSheet } from 'react-native';

type CellProps = {
  value: string;
  onPress: () => void;
};

export default function Cell({ value, onPress }: CellProps) {
  return (
    <TouchableOpacity style={styles.cell} onPress={onPress}>
      <Text>{value}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: 30,
    height: 30,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
