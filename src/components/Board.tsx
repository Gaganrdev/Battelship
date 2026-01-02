import { View, StyleSheet, Alert } from 'react-native';
import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import Cell from './Cell';
import Ship from './Ship';

type Phase = 'placement' | 'attack' | 'gameover';

type BoardAction = { type: string; index?: number; positions?: number[]; hit?: boolean; size?: number; orientation?: 'horizontal' | 'vertical' };

type CellState = {
  shipId?: number;
  hit?: boolean;
  miss?: boolean;
};

type Ship = {
  id: number;
  size: number;
  positions: number[]; // indices
};

type BoardProps = {
  onAction?: (action: BoardAction) => void;
  isOpponentBoard?: boolean;
  disabled?: boolean;
};

export type BoardHandle = {
  applyRemoteAttack: (index: number) => boolean;
  applyAttackResult: (index: number, hit: boolean) => void;
  getCurrentShip: () => { size: number | null; index: number | null; orientation: 'horizontal' | 'vertical' };
};

const defaultShipSizes = [5, 4, 3, 3, 2];

const Board = forwardRef<BoardHandle, BoardProps>(({ onAction, isOpponentBoard = false, disabled = false }, ref) => {
  const [cells, setCells] = useState<CellState[]>(Array(100).fill(0).map(() => ({})));
  const [ships, setShips] = useState<Ship[]>([]);
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [phase, setPhase] = useState<Phase>('placement');
  const [draggingShipId, setDraggingShipId] = useState<number | null>(null);

  useImperativeHandle(ref, () => ({
    applyRemoteAttack(index: number) {
      const c = cells[index];
      if (c.hit || c.miss) return false;

      const newCells = [...cells];
      let hit = false;
      if (c.shipId !== undefined) {
        newCells[index] = { ...newCells[index], hit: true };
        hit = true;
      } else {
        newCells[index] = { ...newCells[index], miss: true };
      }
      setCells(newCells);

      // check lose condition
      if (hit) {
        const totalHits = newCells.filter((x) => x.hit).length;
        const totalShipCells = ships.reduce((s, sh) => s + sh.size, 0);
        if (totalHits >= totalShipCells) {
          setPhase('gameover');
          Alert.alert('💥 You Lost', 'All your ships were destroyed');
        }
      }

      return hit;
    },
    applyAttackResult(index: number, hit: boolean) {
      const newCells = [...cells];
      if (hit) newCells[index] = { ...newCells[index], hit: true };
      else newCells[index] = { ...newCells[index], miss: true };
      setCells(newCells);
    },
    getCurrentShip() {
      if (currentShipIndex >= defaultShipSizes.length) return { size: null, index: null, orientation };
      return { size: defaultShipSizes[currentShipIndex], index: currentShipIndex, orientation };
    },
  }));

  useEffect(() => {
    if (onAction) {
      if (currentShipIndex < defaultShipSizes.length) {
        onAction({ type: 'placing', index: currentShipIndex, size: defaultShipSizes[currentShipIndex], orientation });
      } else {
        onAction({ type: 'placing', index: -1, size: 0, orientation });
      }
    }
  }, [currentShipIndex, orientation]);

  function canPlace(start: number, size: number, orient: 'horizontal' | 'vertical') {
    const positions: number[] = [];
    const row = Math.floor(start / 10);
    const col = start % 10;

    for (let i = 0; i < size; i++) {
      const r = orient === 'vertical' ? row + i : row;
      const c = orient === 'horizontal' ? col + i : col;
      if (r >= 10 || c >= 10) return null;
      positions.push(r * 10 + c);
    }
    // check overlap
    for (const p of positions) {
      if (cells[p].shipId !== undefined) return null;
    }
    return positions;
  }

  function handlePress(index: number) {
    if (disabled) return;

    if (isOpponentBoard) {
      if (phase !== 'attack') return;
      if (onAction) onAction({ type: 'attack', index });
      return;
    }
    if (phase === 'placement') {
      if (draggingShipId !== null) {
        // attempt to move dragging ship to this start index
        moveShipTo(draggingShipId, index);
        setDraggingShipId(null);
        return;
      }

      placeShipAt(index);
    }
  }

  function placeShipAt(index: number) {
    if (currentShipIndex >= defaultShipSizes.length) return;
    const size = defaultShipSizes[currentShipIndex];
    const positions = canPlace(index, size, orientation);
    if (!positions) return;

    const newShips = [...ships, { id: currentShipIndex, size, positions }];
    const newCells = [...cells];
    positions.forEach((p) => (newCells[p] = { ...newCells[p], shipId: currentShipIndex }));

    setShips(newShips);
    setCells(newCells);
    setCurrentShipIndex((s) => s + 1);

    if (currentShipIndex + 1 >= defaultShipSizes.length) {
      setPhase('attack');
      if (onAction) onAction({ type: 'ready' });
    }
  }

  function moveShipTo(id: number, newStart: number) {
    const ship = ships.find((s) => s.id === id);
    if (!ship) return false;
    // determine orientation from current positions
    const isHoriz = ship.positions.length > 1 && ship.positions[1] - ship.positions[0] === 1;
    const orient = isHoriz ? 'horizontal' : 'vertical';
    const positions = canPlace(newStart, ship.size, orient);
    if (!positions) return false;

    // clear old
    const newCells = [...cells];
    ship.positions.forEach((p) => {
      newCells[p] = { ...newCells[p] };
      if (newCells[p].shipId === id) delete newCells[p].shipId;
    });

    // set new
    positions.forEach((p) => (newCells[p] = { ...newCells[p], shipId: id }));

    const newShips = ships.map((s) => (s.id === id ? { ...s, positions } : s));
    setShips(newShips);
    setCells(newCells);
    return true;
  }

  function toggleShipOrientation(id: number) {
    const ship = ships.find((s) => s.id === id);
    if (!ship) return;
    const start = ship.positions[0];
    const currentOrient = ship.positions.length > 1 && ship.positions[1] - ship.positions[0] === 1 ? 'horizontal' : 'vertical';
    const newOrient = currentOrient === 'horizontal' ? 'vertical' : 'horizontal';
    const positions = canPlace(start, ship.size, newOrient);
    if (!positions) return; // cannot toggle here

    // clear old and set new
    const newCells = [...cells];
    ship.positions.forEach((p) => {
      newCells[p] = { ...newCells[p] };
      if (newCells[p].shipId === id) delete newCells[p].shipId;
    });
    positions.forEach((p) => (newCells[p] = { ...newCells[p], shipId: id }));

    const newShips = ships.map((s) => (s.id === id ? { ...s, positions } : s));
    setShips(newShips);
    setCells(newCells);
  }

  // board size constant
  const cellSize = 30;
  const boardSize = cellSize * 10;

  return (
    <View style={[styles.boardContainer, { width: boardSize, height: boardSize }]}> 
      <View style={styles.board}>
        {cells.map((state, index) => (
          <Cell
            key={index}
            onPress={() => handlePress(index)}
            disabled={disabled && isOpponentBoard}
            occupied={state.shipId !== undefined && !isOpponentBoard}
            hit={!!state.hit}
            miss={!!state.miss}
          />
        ))}
      </View>

      {/* render ships as overlays on own board */}
      {!isOpponentBoard && ships.map((s) => {
        const start = s.positions[0];
        const isHoriz = s.positions.length > 1 && s.positions[1] - s.positions[0] === 1;
        return (
          <Ship
            key={s.id}
            size={s.size}
            startIndex={start}
            orientation={isHoriz ? 'horizontal' : 'vertical'}
            cellSize={cellSize}
            onPress={() => toggleShipOrientation(s.id)}
            onLongPress={() => setDraggingShipId(s.id)}
          />
        );
      })}
    </View>
  );
});

export default Board;

const styles = StyleSheet.create({
  boardContainer: {
    position: 'relative',
  },
  board: {
    width: 300,
    height: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
