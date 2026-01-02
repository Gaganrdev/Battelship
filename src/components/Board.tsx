import { View, StyleSheet, Alert } from 'react-native';
import React, { useState, useImperativeHandle, forwardRef } from 'react';
import Cell from './Cell';

type Phase = 'placement' | 'attack' | 'gameover';

type BoardAction = { type: string; index: number; hit?: boolean };

type BoardProps = {
  onAction?: (action: BoardAction) => void;
  // If true, this board represents the opponent's board (used to send attacks)
  isOpponentBoard?: boolean;
  // When false, board is interactive for placement/receiving attacks
};

export type BoardHandle = {
  applyRemoteAttack: (index: number) => boolean;
  applyAttackResult: (index: number, hit: boolean) => void;
};

const Board = forwardRef<BoardHandle, BoardProps>(({ onAction, isOpponentBoard = false }, ref) => {
  const [cells, setCells] = useState<string[]>(Array(100).fill(''));
  const [shipsPlaced, setShipsPlaced] = useState(0);
  const [hits, setHits] = useState(0);
  const [phase, setPhase] = useState<Phase>('placement');

  useImperativeHandle(ref, () => ({
    applyRemoteAttack(index: number) {
      if (cells[index] === '❌' || cells[index] === '🌊') return false;

      const newCells = [...cells];
      let hit = false;

      if (newCells[index] === '🚢') {
        newCells[index] = '❌';
        setHits((h) => h + 1);
        hit = true;

        if (hits + 1 === 5) {
          setPhase('gameover');
          Alert.alert('💥 You Lost', 'All your ships were destroyed');
        }
      } else {
        newCells[index] = '🌊';
      }

      setCells(newCells);
      return hit;
    },
    applyAttackResult(index: number, hit: boolean) {
      const newCells = [...cells];
      newCells[index] = hit ? '❌' : '🌊';
      setCells(newCells);
    },
  }));

  function handlePress(index: number) {
    if (isOpponentBoard) {
      // When interacting with opponent board, send attack actions (do not modify own cells)
      if (phase !== 'attack' && shipsPlaced < 5) return;
      if (onAction) onAction({ type: 'attack', index });
      return;
    }

    if (phase === 'placement') {
      placeShip(index);
    }
  }

  function placeShip(index: number) {
    if (cells[index] !== '' || shipsPlaced >= 5) return;

    const newCells = [...cells];
    newCells[index] = '🚢';

    setCells(newCells);
    setShipsPlaced((s) => s + 1);

    if (onAction) onAction({ type: 'place', index });

    if (shipsPlaced + 1 === 5) {
      setPhase('attack');
      // notify ready
      if (onAction) onAction({ type: 'ready', index: -1 });
    }
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
});

export default Board;

const styles = StyleSheet.create({
  board: {
    width: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
