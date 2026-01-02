import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

type CellProps = {
  onPress: () => void;
  disabled?: boolean;
  // whether this cell contains a ship part (only shown on own board)
  occupied?: boolean;
  // whether this cell was hit by an attack
  hit?: boolean;
  // whether this cell was attacked and missed
  miss?: boolean;
};

export default function Cell({ onPress, disabled = false, occupied = false, hit = false, miss = false }: CellProps) {
  const inner = () => {
    if (hit) return <Text style={{ color: '#900' }}>❌</Text>;
    if (miss) return <Text style={{ color: '#09f' }}>🌊</Text>;
    if (occupied) return <View style={styles.shipPart} />;
    return null;
  };

  return (
    <TouchableOpacity
      style={[styles.cell, disabled ? styles.disabled : null]}
      onPress={onPress}
      disabled={disabled}
    >
      {inner()}
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
  shipPart: {
    width: 20,
    height: 10,
    backgroundColor: '#666',
    borderRadius: 2,
  },
});
