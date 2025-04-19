/**
 * soundUtils.ts
 * Utilities for playing sounds and speech synthesis in the ChessLink application
 */

// Sound file paths - these should match the paths in the public directory
export const SOUNDS = {
  move: '/sounds/move.mp3',
  capture: '/sounds/capture.mp3',
  check: '/sounds/check.mp3',
  checkmate: '/sounds/checkmate.mp3',
  castle: '/sounds/castle.mp3',
  promotion: '/sounds/promotion.mp3',
  victory: '/sounds/victory.mp3',
  draw: '/sounds/draw.mp3',
  illegal: '/sounds/illegal.mp3',
  enPassant: '/sounds/en_passant.mp3',
  lowTime: '/sounds/low_time.mp3',
};

// Chess piece names for speech
const PIECE_NAMES: Record<string, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

// Cache for audio objects
const audioCache: Record<string, HTMLAudioElement> = {};

/**
 * Preload all sound files
 */
export const preloadSounds = (): void => {
  Object.entries(SOUNDS).forEach(([key, src]) => {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audioCache[key] = audio;
  });
};

/**
 * Play a sound effect
 */
export const playSound = (soundName: keyof typeof SOUNDS, volume = 0.5): void => {
  try {
    // Use cached audio or create a new one
    const audio = audioCache[soundName] || new Audio(SOUNDS[soundName]);
    audio.volume = volume;
    
    // Reset audio to beginning if it's already playing
    audio.currentTime = 0;
    
    audio.play().catch(e => console.error(`Error playing sound ${soundName}:`, e));
  } catch (e) {
    console.error("Error with audio:", e);
  }
};

/**
 * Convert chess move to spoken announcement
 */
export const getMoveText = (move: any): string => {
  // Handle special cases
  if (move.san === 'O-O') {
    return 'Castles kingside';
  } else if (move.san === 'O-O-O') {
    return 'Castles queenside';
  }

  // For standard moves
  const pieceType = move.piece;
  const pieceName = PIECE_NAMES[pieceType] || 'piece';
  
  // Capitalize first letter for speech
  const capitalizedPiece = pieceName.charAt(0).toUpperCase() + pieceName.slice(1);
  
  // Basic move announcement
  let announcement = `${capitalizedPiece} to ${move.to}`;
  
  // Add details for captures
  if (move.captured) {
    const capturedName = PIECE_NAMES[move.captured] || 'piece';
    announcement = `${capitalizedPiece} takes ${capturedName} on ${move.to}`;
  }
  
  // Add check/checkmate status
  if (move.san.endsWith('#')) {
    announcement += ' and checkmate';
  } else if (move.san.endsWith('+')) {
    announcement += ' and check';
  }
  
  // Add promotion details
  if (move.promotion) {
    const promotionPiece = PIECE_NAMES[move.promotion] || 'queen';
    announcement += `, promotes to ${promotionPiece}`;
  }
  
  return announcement;
};

/**
 * Speak text using browser's speech synthesis
 */
export const speakText = (text: string, options: SpeechSynthesisUtterance = new SpeechSynthesisUtterance()): void => {
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  // Configure the utterance
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Apply options
  utterance.volume = options.volume || 1;
  utterance.rate = options.rate || 1;
  utterance.pitch = options.pitch || 1;
  utterance.lang = options.lang || 'en-US';
  
  // Speak the text
  window.speechSynthesis.speak(utterance);
};

/**
 * Get check status announcement
 */
export const getCheckStatusText = (game: any): string => {
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? 'Black wins by checkmate!' : 'White wins by checkmate!';
  } else if (game.isCheck()) {
    return 'Check!';
  } else if (game.isDraw()) {
    if (game.isStalemate()) {
      return 'Draw by stalemate';
    } else if (game.isInsufficientMaterial()) {
      return 'Draw by insufficient material';
    } else if (game.isThreefoldRepetition()) {
      return 'Draw by threefold repetition';
    } else {
      return 'Draw';
    }
  }
  return '';
};

/**
 * Announce a game state (check, checkmate, draw)
 */
export const announceGameState = (game: any): void => {
  const status = getCheckStatusText(game);
  if (status) {
    // Play appropriate sound
    if (game.isCheckmate()) {
      playSound('checkmate');
    } else if (game.isCheck()) {
      playSound('check');
    } else if (game.isDraw()) {
      playSound('draw');
    }
    
    // Speak the status
    speakText(status);
  }
}; 