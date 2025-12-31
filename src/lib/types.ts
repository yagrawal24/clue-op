// Clue Game Types and Interfaces - Enhanced for God-Mode Tracking

export type CardType = 'suspect' | 'weapon' | 'room';

// Enhanced card states for precise tracking
export type CardState = 
  | 'unknown'           // Default state
  | 'owned'             // Confirmed owned by a player
  | 'not_owned'         // Confirmed NOT owned by a player
  | 'potentially_owned' // Linked to a suggestion set
  | 'envelope';         // Confirmed in the solution envelope

// Track what we know about each card for each player
export interface PlayerCardKnowledge {
  state: CardState;
  // For 'potentially_owned' state, track which suggestion(s) link to this
  linkedSuggestionIds?: string[];
}

// Main card definition
export interface Card {
  name: string;
  type: CardType;
}

// Link represents a "showed one of these cards" constraint
export interface CardLink {
  id: string;
  suggestionId: string;
  playerId: string;
  possibleCards: string[]; // Cards that could have been shown
  resolved: boolean;
  resolvedCard?: string;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  isMe: boolean; // Is this the user playing?
  cardCount?: number; // How many cards this player has (for inference)
  confirmedCards: string[]; // Cards we know this player has
}

export interface Suggestion {
  id: string;
  turnNumber: number;
  suggesterId: string;
  suspect: string;
  weapon: string;
  room: string;
  // Track who passed (didn't show a card)
  passedPlayerIds: string[];
  // Who showed (if anyone)
  showerId?: string;
  // If we know which card was shown
  shownCard?: string;
  // If we don't know the card, create a link
  linkId?: string;
  timestamp: Date;
}

export interface Accusation {
  id: string;
  playerId: string;
  suspect: string;
  weapon: string;
  room: string;
  isCorrect: boolean;
  timestamp: Date;
}

// Deduction made by the inference engine
export interface Deduction {
  id: string;
  type: 'card_owned' | 'card_not_owned' | 'envelope' | 'link_resolved' | 'manual_adjustment';
  description: string;
  cardName: string;
  playerId?: string;
  sourceSuggestionId?: string;
  // For manual adjustments, track the previous state for reverting
  previousState?: PlayerCardKnowledge['state'];
  timestamp: Date;
}

// Knowledge matrix: for each card, track knowledge about each player
export type KnowledgeMatrix = {
  [cardName: string]: {
    [playerId: string]: PlayerCardKnowledge;
    envelope: PlayerCardKnowledge;
  };
};

// Full game state
export interface GameState {
  // Setup
  players: Player[];
  myPlayerId: string | null;
  currentTurn: number;
  firstPlayerId: string | null;
  gameStarted: boolean;
  
  // Core tracking
  knowledgeMatrix: KnowledgeMatrix;
  cardLinks: CardLink[];
  suggestions: Suggestion[];
  accusations: Accusation[];
  deductions: Deduction[];
  
  // Notes
  notes: string;
  
  // Computed envelope solution (when fully deduced)
  solvedEnvelope: {
    suspect: string | null;
    weapon: string | null;
    room: string | null;
  };
}

// Game constants
export const GAME_CONSTANTS = {
  SUSPECTS: [
    'Miss Scarlett',
    'Colonel Mustard',
    'Mrs. White',
    'Mr. Green',
    'Mrs. Peacock',
    'Professor Plum'
  ],
  WEAPONS: [
    'Candlestick',
    'Knife',
    'Lead Pipe',
    'Revolver',
    'Rope',
    'Wrench'
  ],
  ROOMS: [
    'Ballroom',
    'Billiard Room',
    'Conservatory',
    'Dining Room',
    'Hall',
    'Kitchen',
    'Library',
    'Lounge',
    'Study'
  ],
  PLAYER_COLORS: [
    '#dc2626', // red
    '#ea580c', // orange
    '#16a34a', // green
    '#2563eb', // blue
    '#9333ea', // purple
    '#ec4899'  // pink
  ],
  // Total cards = 21 (6 suspects + 6 weapons + 9 rooms)
  // Envelope = 3 cards
  // Distributed = 18 cards
  TOTAL_CARDS: 21,
  ENVELOPE_CARDS: 3,
  DISTRIBUTED_CARDS: 18
} as const;

// Helper to get all cards
export const getAllCards = (): Card[] => {
  const cards: Card[] = [];
  GAME_CONSTANTS.SUSPECTS.forEach(name => cards.push({ name, type: 'suspect' }));
  GAME_CONSTANTS.WEAPONS.forEach(name => cards.push({ name, type: 'weapon' }));
  GAME_CONSTANTS.ROOMS.forEach(name => cards.push({ name, type: 'room' }));
  return cards;
};

// Helper to get card type
export const getCardType = (cardName: string): CardType | null => {
  if (GAME_CONSTANTS.SUSPECTS.includes(cardName as any)) return 'suspect';
  if (GAME_CONSTANTS.WEAPONS.includes(cardName as any)) return 'weapon';
  if (GAME_CONSTANTS.ROOMS.includes(cardName as any)) return 'room';
  return null;
};

// Helper to get cards by type
export const getCardsByType = (type: CardType): string[] => {
  switch (type) {
    case 'suspect': return [...GAME_CONSTANTS.SUSPECTS];
    case 'weapon': return [...GAME_CONSTANTS.WEAPONS];
    case 'room': return [...GAME_CONSTANTS.ROOMS];
  }
};

// AI Advisor request/response types
export interface AIAdvisorRequest {
  knowledgeMatrix: KnowledgeMatrix;
  suggestions: Suggestion[];
  deductions: Deduction[];
  players: Player[];
  myPlayerId: string | null;
  solvedEnvelope: GameState['solvedEnvelope'];
}

export interface AIAdvisorResponse {
  analysis: {
    closestToWinning: string;
    suggestedMove: {
      suspect: string;
      weapon: string;
      room: string;
      reasoning: string;
    };
    bluffAnalysis: string[];
    generalInsights: string[];
  };
}
