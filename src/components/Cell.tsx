import { TouchableOpacity, Text, StyleSheet } from 'react-native';

type CellProps = {
  value: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function Cell({ value, onPress, disabled = false }: CellProps) {
  return (
    <TouchableOpacity
      style={[styles.cell, disabled ? styles.disabled : null]}
      onPress={onPress}
      disabled={disabled}
    >
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
  disabled: {
    opacity: 0.4,
  },
});
