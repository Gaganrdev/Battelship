import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useState } from 'react';

type CellProps = {
  onPress: () => void;
};

export default function Cell({ onPress }: CellProps) {
  const [clicked, setClicked] = useState(false);

  return (
    <TouchableOpacity
      style={styles.cell}
      onPress={() => {
        setClicked(true);
        onPress();
      }}
    >
      <Text>{clicked ? 'X' : ''}</Text>
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
