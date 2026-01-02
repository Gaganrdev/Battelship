import { View, Text, StyleSheet, Alert } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { hostGame, joinGame, sendMessage, closeConnection } from '../network/socket';
import Board, { BoardHandle } from '../components/Board';

export default function GameScreen({ route }: any) {
  const { mode } = route.params;

  const ownBoardRef = useRef<BoardHandle | null>(null);
  const opponentBoardRef = useRef<BoardHandle | null>(null);
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
  const [opponentReady, setOpponentReady] = useState<boolean>(false);
  const [ownReady, setOwnReady] = useState<boolean>(false);
  const [placingInfo, setPlacingInfo] = useState<{ size: number | null; index: number | null; orientation: 'horizontal' | 'vertical' | null }>({ size: null, index: null, orientation: null });

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
            // if both ready, decide who starts
            if (ownReady) {
              setIsMyTurn(mode === 'host');
            }
          }
        } catch (e) {
          console.log('Received raw message:', msg);
        }
      };

      if (mode === 'host') {
        hostGame(onMessage);
      } else if (mode === 'join') {
        // For join, user should provide IP; using localhost for now
        joinGame('localhost', onMessage);
      }

      return () => {
        closeConnection();
      };
    }, [mode]);

    function handleAction(action: any) {
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

    // handle actions from our own board (placement / ready)
    function handleOwnAction(action: any) {
      if (action.type === 'ready') {
        setOwnReady(true);
        sendMessage({ type: 'ready' });
        // if opponent already ready, start turns
        if (opponentReady) {
          setIsMyTurn(mode === 'host');
        }
      } else if (action.type === 'placing') {
        setPlacingInfo({ size: action.size ?? null, index: action.index ?? null, orientation: action.orientation ?? null });
      } else {
        // forward placement actions to opponent if needed
        sendMessage(action);
      }
    }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Place ships by tapping cells</Text>

      <Text style={{ fontSize: 18, marginTop: 8, color: isMyTurn ? 'green' : 'gray' }}>
        {isMyTurn ? 'Your Turn' : "Opponent's Turn"}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <Text style={{ marginRight: 12 }}>Orientation:</Text>
        <Text style={{ marginRight: 12 }}>{placingInfo.orientation ?? '-'}</Text>
        <Text>Placing ship size: {placingInfo.size ?? '-'}</Text>
      </View>

      <Text style={{ marginTop: 10 }}>Your Board</Text>
      <Board ref={ownBoardRef} onAction={handleOwnAction} />

      <Text style={{ marginTop: 16 }}>Opponent Board</Text>
      <View style={{ width: 320, height: 320, position: 'relative' }}>
        <Board ref={opponentBoardRef} isOpponentBoard disabled={!isMyTurn} onAction={handleAction} />
        {!isMyTurn && opponentReady && ownReady && (
          <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 18 }}>Waiting for opponent...</Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <Text style={{ marginRight: 12 }}>You: {ownReady ? 'Ready' : 'Not Ready'}</Text>
        <Text>Opponent: {opponentReady ? 'Ready' : 'Not Ready'}</Text>
      </View>
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
