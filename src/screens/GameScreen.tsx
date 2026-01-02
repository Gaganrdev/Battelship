import { View, Text, StyleSheet, Alert } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { hostGame, joinGame, sendMessage, closeConnection } from '../network/socket';
import Board, { BoardHandle } from '../components/Board';

export default function GameScreen({ route }: any) {
  const { mode } = route.params;

  const ownBoardRef = useRef<BoardHandle | null>(null);
  const opponentBoardRef = useRef<BoardHandle | null>(null);
  const [isMyTurn, setIsMyTurn] = useState<boolean>(mode === 'host');
  const [opponentReady, setOpponentReady] = useState<boolean>(false);

    useEffect(() => {
      const onMessage = (msg: string) => {
        try {
          const data = JSON.parse(msg);
          console.log('Received:', data);
          // handle incoming protocol
          if (data.type === 'attack') {
            // opponent is attacking our board
            if (ownBoardRef.current) {
              const hit = ownBoardRef.current.applyRemoteAttack(data.index);
              // send back result
              sendMessage({ type: 'attack_result', index: data.index, hit });
              // opponent gets another turn if hit; our turn stays false
              setIsMyTurn(false);
            }
          } else if (data.type === 'attack_result') {
            // opponent responded to our attack
            if (opponentBoardRef.current) {
              opponentBoardRef.current.applyAttackResult(data.index, data.hit);
            }
            // attacker keeps turn if hit
            setIsMyTurn(!!data.hit);
          } else if (data.type === 'ready') {
            // opponent finished placement
            setOpponentReady(true);
          }
        } catch (e) {
          console.log('Received raw message:', msg);
        }
      };

      if (mode === 'host') {
        hostGame(onMessage);
        setIsMyTurn(true);
      } else if (mode === 'join') {
        // For join, user should provide IP; using localhost for now
        joinGame('localhost', onMessage);
        setIsMyTurn(false);
      }

      return () => {
        closeConnection();
      };
    }, [mode]);

    function handleAction(action: { type: string; index: number; hit?: boolean }) {
      console.log('Outgoing action:', action);
      // this handler is used by opponentBoard for sending attacks
      if (action.type === 'attack') {
        if (!isMyTurn) {
          Alert.alert('Not your turn', 'Wait for opponent');
          return;
        }

        // send attack to opponent
        sendMessage({ type: 'attack', index: action.index });
        // after sending attack, wait for result — temporarily disable our turn
        setIsMyTurn(false);
      } else {
        // forward any other actions if needed
        sendMessage(action);
      }
    }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Place 5 ships by tapping cells</Text>

      <Text style={{ marginTop: 10 }}>Your Board</Text>
      <Board ref={ownBoardRef} onAction={() => {}} />

      <Text style={{ marginTop: 16 }}>Opponent Board</Text>
      <Board ref={opponentBoardRef} isOpponentBoard onAction={handleAction} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
  },
});
