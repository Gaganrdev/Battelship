import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { hostGame, joinGame, sendMessage, closeConnection } from '../network/peerConnection';
import Board, { BoardHandle } from '../components/Board';

export default function GameScreen({ route }: any) {
  const { mode, roomId } = route.params;

  const ownBoardRef = useRef<BoardHandle | null>(null);
  const opponentBoardRef = useRef<BoardHandle | null>(null);
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
  const [opponentReady, setOpponentReady] = useState<boolean>(false);
  const [ownReady, setOwnReady] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [allShipsPlaced, setAllShipsPlaced] = useState<boolean>(false);
  const [placingInfo, setPlacingInfo] = useState<{ size: number | null; index: number | null; orientation: 'horizontal' | 'vertical' | null }>({ size: null, index: null, orientation: null });

    useEffect(() => {
      const onMessage = (msg: string) => {
        try {
          const data = JSON.parse(msg);
          // handle incoming protocol
          if (data.type === 'attack') {
            // opponent is attacking our board
            if (ownBoardRef.current) {
              const hit = ownBoardRef.current.applyRemoteAttack(data.index);
              // send back result
              sendMessage({ type: 'attack_result', index: data.index, hit });
              // If opponent hit, they keep their turn (our turn stays false)
              // If opponent missed, it becomes our turn
              if (!hit) {
                setIsMyTurn(true);
              }
            }
          } else if (data.type === 'attack_result') {
            // opponent responded to our attack
            if (opponentBoardRef.current) {
              opponentBoardRef.current.applyAttackResult(data.index, data.hit);
            }
            // If we hit, we keep our turn
            // If we missed, opponent gets the turn
            setIsMyTurn(!!data.hit);
          } else if (data.type === 'ready') {
            // opponent finished placement
            setOpponentReady(true);
            // if both ready, decide who starts
            if (ownReady) {
              setIsMyTurn(mode === 'host');
            }
          } else if (data.type === 'game_over') {
            // Opponent's game is over, we won!
            Alert.alert('🎉 Victory!', 'You destroyed all enemy ships!');
          }
        } catch (e) {
          // Invalid message format
        }
      };

      if (mode === 'host') {
        hostGame(roomId, onMessage, () => setConnected(true), () => setConnected(false));
      } else if (mode === 'join') {
        joinGame(roomId, onMessage, () => setConnected(true), () => setConnected(false));
      }

      return () => {
        closeConnection();
      };
    }, [mode, roomId]);

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
      } else if (action.type === 'all_ships_placed') {
        setAllShipsPlaced(true);
      } else if (action.type === 'placing') {
        setPlacingInfo({ size: action.size ?? null, index: action.index ?? null, orientation: action.orientation ?? null });
      } else {
        // forward placement actions to opponent if needed
        sendMessage(action);
      }
    }

    function handleReadyClick() {
      if (ownBoardRef.current && ownBoardRef.current.isReadyToStart()) {
        ownBoardRef.current.markReady();
      } else {
        Alert.alert('Not Ready', 'Please place all 5 ships before marking ready');
      }
    }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: connected ? '#0f0' : '#f00', marginRight: 8 }} />
          <Text style={{ fontSize: 14 }}>{connected ? 'Connected' : 'Waiting for connection...'}</Text>
        </View>

        {mode === 'host' && (
          <View style={styles.roomCodeBox}>
            <Text style={styles.roomCodeLabel}>Room Code:</Text>
            <Text style={styles.roomCode}>{roomId}</Text>
            <Text style={styles.roomCodeHint}>Share this code with your opponent</Text>
          </View>
        )}
      
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

      {/* Ready Button */}
      {allShipsPlaced && !ownReady && (
        <TouchableOpacity 
          style={styles.readyButton}
          onPress={handleReadyClick}
        >
          <Text style={styles.readyButtonText}>I'm Ready!</Text>
        </TouchableOpacity>
      )}

      {ownReady && !opponentReady && (
        <View style={styles.waitingBox}>
          <Text style={styles.waitingText}>Waiting for opponent to be ready...</Text>
        </View>
      )}

      {/* Only show opponent board after both players are ready */}
      {ownReady && opponentReady && (
        <>
          <Text style={{ marginTop: 16 }}>Opponent Board</Text>
          <View style={{ width: 320, height: 320, position: 'relative' }}>
            <Board ref={opponentBoardRef} isOpponentBoard disabled={!isMyTurn} onAction={handleAction} />
            {!isMyTurn && (
              <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 18 }}>Waiting for opponent...</Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            <Text style={{ marginRight: 12 }}>You: Ready</Text>
            <Text>Opponent: Ready</Text>
          </View>
        </>
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
  },
  readyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  readyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waitingBox: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  waitingText: {
    color: '#856404',
    fontSize: 16,
  },
  roomCodeBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2196F3',
    alignItems: 'center',
  },
  roomCodeLabel: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 4,
  },
  roomCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0D47A1',
    letterSpacing: 4,
  },
  roomCodeHint: {
    fontSize: 12,
    color: '#64B5F6',
    marginTop: 4,
  },
});
