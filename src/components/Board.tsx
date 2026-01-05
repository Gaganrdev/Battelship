import { View, StyleSheet, Alert, Vibration } from 'react-native';
import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import Cell from './Cell';
import Ship from './Ship';

type Phase = 'placement' | 'attack' | 'gameover';

type BoardAction = { type: string; index?: number; positions?: number[]; hit?: boolean; size?: number; orientation?: 'horizontal' | 'vertical'; winner?: string };

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
  isReadyToStart: () => boolean;
  markReady: () => void;
};

const defaultShipSizes = [5, 4, 3, 3, 2];

const Board = forwardRef<BoardHandle, BoardProps>(({ onAction, isOpponentBoard = false, disabled = false }, ref) => {
  const [cells, setCells] = useState<CellState[]>(Array(100).fill(0).map(() => ({})));
  const [ships, setShips] = useState<Ship[]>([]);
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [phase, setPhase] = useState<Phase>(isOpponentBoard ? 'attack' : 'placement');
  const [draggingShipId, setDraggingShipId] = useState<number | null>(null);
  const [updateCounter, setUpdateCounter] = useState(0); // Force re-render counter

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
          // Notify parent to tell opponent they won
          if (onAction) onAction({ type: 'game_over', winner: 'opponent' });
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
    isReadyToStart() {
      return ships.length >= defaultShipSizes.length;
    },
    markReady() {
      if (ships.length >= defaultShipSizes.length) {
        setPhase('attack');
        if (onAction) onAction({ type: 'ready' });
      }
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
      placeShipAt(index);
    }
  }

  function placeShipAt(index: number) {
    if (currentShipIndex >= defaultShipSizes.length) return;
    const size = defaultShipSizes[currentShipIndex];
    const positions = canPlace(index, size, orientation);
    if (!positions) return;

    const newShips = [...ships, { id: currentShipIndex, size, positions }];
    const newCells = cells.map((c, idx) => {
      if (positions.includes(idx)) {
        return { ...c, shipId: currentShipIndex };
      }
      return { ...c };
    });

    setShips(newShips);
    setCells(newCells);
    setCurrentShipIndex((s) => s + 1);

    // Don't auto-ready, wait for user to click ready button
    if (currentShipIndex + 1 >= defaultShipSizes.length) {
      setPhase('attack');
      // Notify that all ships are placed
      if (onAction) onAction({ type: 'all_ships_placed' });
    }
  }

  function moveShipTo(id: number, newStart: number) {
    const ship = ships.find((s) => s.id === id);
    if (!ship) return false;
    
    // Don't move if start is the same
    if (ship.positions[0] === newStart) return true;
    
    // determine orientation from current positions
    const isHoriz = ship.positions.length > 1 && ship.positions[1] - ship.positions[0] === 1;
    const orient = isHoriz ? 'horizontal' : 'vertical';
    
    // Check if we can place at new location (temporarily clear old positions for check)
    const tempCells = cells.map((c, idx) => {
      if (ship.positions.includes(idx) && c.shipId === id) {
        const copy = { ...c };
        delete copy.shipId;
        return copy;
      }
      return { ...c };
    });
    
    // Use temp cells for placement check
    const positions = canPlaceWithCells(tempCells, newStart, ship.size, orient);
    if (!positions) return false;

    // Create new ships array with updated positions FIRST
    const newShips = ships.map((s) => {
      if (s.id === id) {
        return { ...s, positions: [...positions] }; // Create new array
      }
      return s;
    });

    // clear old and set new - create completely new cell array
    const newCells = cells.map((c, idx) => {
      // First copy the cell
      const copy = { ...c };
      
      // Clear if this was the old ship position
      if (ship.positions.includes(idx) && c.shipId === id) {
        delete copy.shipId;
      }
      
      // Set if this is the new ship position
      if (positions.includes(idx)) {
        copy.shipId = id;
      }
      
      return copy;
    });

    // Update state atomically
    setShips(newShips);
    setCells(newCells);
    return true;
  }
  
  function canPlaceWithCells(cellsToCheck: CellState[], start: number, size: number, orient: 'horizontal' | 'vertical') {
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
      if (cellsToCheck[p].shipId !== undefined) return null;
    }
    return positions;
  }

  function toggleShipOrientation(id: number) {
    const ship = ships.find((s) => s.id === id);
    if (!ship) return;
    
    const start = ship.positions[0];
    const currentOrient = ship.positions.length > 1 && ship.positions[1] - ship.positions[0] === 1 ? 'horizontal' : 'vertical';
    const newOrient = currentOrient === 'horizontal' ? 'vertical' : 'horizontal';
    
    // Check if new positions would be the same (size 1 ship or already in that orientation somehow)
    const testPositions = canPlaceWithCells(cells, start, ship.size, newOrient);
    if (testPositions && JSON.stringify(testPositions.sort()) === JSON.stringify(ship.positions.sort())) {
      Vibration.vibrate([0, 50, 50, 50]);
      return;
    }
    
    // Check if we can place at new orientation (temporarily clear old positions for check)
    const tempCells = cells.map((c, idx) => {
      if (ship.positions.includes(idx) && c.shipId === id) {
        const copy = { ...c };
        delete copy.shipId;
        return copy;
      }
      return { ...c };
    });
    
    const positions = canPlaceWithCells(tempCells, start, ship.size, newOrient);
    if (!positions) {
      Vibration.vibrate([0, 50, 50, 50]); // vibrate pattern to indicate failure
      return;
    }

    // Create new ships array with updated positions FIRST
    const newShips = ships.map((s) => {
      if (s.id === id) {
        return { ...s, positions: [...positions] }; // Create new array
      }
      return s;
    });

    // clear old and set new - create completely new cell array
    const newCells = cells.map((c, idx) => {
      // First copy the cell
      const copy = { ...c };
      
      // Clear if this was the old ship position
      if (ship.positions.includes(idx) && c.shipId === id) {
        delete copy.shipId;
      }
      
      // Set if this is the new ship position
      if (positions.includes(idx)) {
        copy.shipId = id;
      }
      
      return copy;
    });

    // Update state atomically
    setShips(newShips);
    setCells(newCells);
    setUpdateCounter(c => c + 1); // Force component update
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
        // Safety check: ensure ship has valid positions
        if (!s.positions || s.positions.length === 0) {
          return null;
        }
        
        const start = s.positions[0];
        const isHoriz = s.positions.length > 1 && s.positions[1] - s.positions[0] === 1;
        return (
          <Ship
            key={`${s.id}-${updateCounter}`}
            id={s.id}
            size={s.size}
            startIndex={start}
            orientation={isHoriz ? 'horizontal' : 'vertical'}
            cellSize={cellSize}
            onPress={() => toggleShipOrientation(s.id)}
            onDragStart={() => setDraggingShipId(s.id)}
            onDrop={(newStart: number) => { 
              const success = moveShipTo(s.id, newStart); 
              setDraggingShipId(null);
              if (!success) {
                Vibration.vibrate([0, 50, 50, 50]);
              }
            }}
            selected={draggingShipId === s.id}
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
