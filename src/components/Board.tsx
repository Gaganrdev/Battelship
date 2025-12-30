import { View, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import Cell from './Cell';

type Phase = 'placement' | 'attack' | 'gameover';

export default function Board() {
  const [cells, setCells] = useState<string[]>(Array(100).fill(''));
  const [shipsPlaced, setShipsPlaced] = useState(0);
  const [hits, setHits] = useState(0);
  const [phase, setPhase] = useState<Phase>('placement');

  function handlePress(index: number) {
    if (phase === 'placement') {
      placeShip(index);
    } else if (phase === 'attack') {
      attackCell(index);
    }
  }

  function placeShip(index: number) {
    if (cells[index] !== '' || shipsPlaced >= 5) return;

    const newCells = [...cells];
    newCells[index] = '🚢';

    setCells(newCells);
    setShipsPlaced(shipsPlaced + 1);

    if (shipsPlaced + 1 === 5) {
      setPhase('attack');
    }
  }

  function attackCell(index: number) {
    if (cells[index] === '❌' || cells[index] === '🌊') return;

    const newCells = [...cells];

    if (cells[index] === '🚢') {
      newCells[index] = '❌';
      setHits(hits + 1);

      if (hits + 1 === 5) {
        setPhase('gameover');
        Alert.alert('🎉 You Win!', 'All ships destroyed');
      }
    } else {
      newCells[index] = '🌊';
    }

    setCells(newCells);
  }

  return (
    <View style={styles.board}>
      {cells.map((value, index) => (
        <Cell
          key={index}
          value={value}
          onPress={() => handlePress(index)}
        />
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
