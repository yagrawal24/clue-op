import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  GameState,
  Player,
  Suggestion,
  CardLink,
  Deduction,
  KnowledgeMatrix,
  PlayerCardKnowledge,
  GAME_CONSTANTS,
  getAllCards,
  getCardType,
  getCardsByType,
  CardType
} from '@/lib/types';

// Initialize empty knowledge matrix
const createEmptyKnowledgeMatrix = (playerIds: string[]): KnowledgeMatrix => {
  const matrix: KnowledgeMatrix = {};
  const allCards = getAllCards();
  
  allCards.forEach(card => {
    matrix[card.name] = {
      envelope: { state: 'unknown' }
    };
    playerIds.forEach(playerId => {
      matrix[card.name][playerId] = { state: 'unknown' };
    });
  });
  
  return matrix;
};

// Initial state
const initialState: GameState = {
  players: [],
  myPlayerId: null,
  currentTurn: 0,
  firstPlayerId: null,
  gameStarted: false,
  knowledgeMatrix: {},
  cardLinks: [],
  suggestions: [],
  accusations: [],
  deductions: [],
  notes: '',
  solvedEnvelope: {
    suspect: null,
    weapon: null,
    room: null
  }
};

interface GameActions {
  // Setup actions
  addPlayer: (name: string) => void;
  removePlayer: (playerId: string) => void;
  setMyPlayer: (playerId: string | null) => void;
  setFirstPlayer: (playerId: string | null) => void;
  setMyCards: (cardNames: string[]) => void;
  reorderPlayers: (players: Player[]) => void;
  startGame: () => void;
  resetGame: () => void;
  
  // Game actions
  recordSuggestion: (suggestion: Omit<Suggestion, 'id' | 'timestamp' | 'turnNumber'>) => void;
  
  // Manual override
  setCardState: (cardName: string, playerId: string | 'envelope', state: PlayerCardKnowledge['state'], createDeduction?: boolean) => void;

  // Record opened cards (for uneven players or revealed cards)
  recordOpenedCards: (cardNames: string[], playerId?: string) => void;
  
  // Clear a card row (reset to unknown)
  clearCardRow: (cardName: string) => void;

  // Notes
  updateNotes: (notes: string) => void;
  
  // Inference engine
  runInference: () => void;
}

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      addPlayer: (name: string) => {
        const state = get();
        const availableColors = GAME_CONSTANTS.PLAYER_COLORS.filter(
          color => !state.players.some(p => p.color === color)
        );
        
        const newPlayer: Player = {
          id: `player-${Date.now()}`,
          name,
          color: availableColors[0] || '#6b7280',
          isMe: false,
          confirmedCards: []
        };
        
        set(state => ({
          players: [...state.players, newPlayer]
        }));
      },
      
      removePlayer: (playerId: string) => {
        set(state => ({
          players: state.players.filter(p => p.id !== playerId),
          myPlayerId: state.myPlayerId === playerId ? null : state.myPlayerId,
          firstPlayerId: state.firstPlayerId === playerId ? null : state.firstPlayerId
        }));
      },
      
      setMyPlayer: (playerId: string | null) => {
        set(state => ({
          myPlayerId: playerId,
          players: state.players.map(p => ({
            ...p,
            isMe: playerId ? p.id === playerId : false
          }))
        }));
      },
      
      setFirstPlayer: (playerId: string | null) => {
        set({ firstPlayerId: playerId });
      },
      
      setMyCards: (cardNames: string[]) => {
        const state = get();
        if (!state.myPlayerId) return;
        
        // Initialize matrix if needed
        let matrix = { ...state.knowledgeMatrix };
        if (Object.keys(matrix).length === 0) {
          matrix = createEmptyKnowledgeMatrix(state.players.map(p => p.id));
        }
        
        const newDeductions: Deduction[] = [];
        
        // Mark my cards as owned by me
        cardNames.forEach(cardName => {
          matrix[cardName] = {
            ...matrix[cardName],
            [state.myPlayerId!]: { state: 'owned' },
            envelope: { state: 'not_owned' }
          };
          
          // Mark all other players as not owning this card
          state.players.forEach(player => {
            if (player.id !== state.myPlayerId) {
              matrix[cardName][player.id] = { state: 'not_owned' };
            }
          });
          
          newDeductions.push({
            id: `deduction-${Date.now()}-${cardName}`,
            type: 'card_owned',
            description: `You have ${cardName}`,
            cardName,
            playerId: state.myPlayerId!,
            timestamp: new Date()
          });
        });
        
        // Update player's confirmed cards
        const updatedPlayers = state.players.map(p => 
          p.id === state.myPlayerId 
            ? { ...p, confirmedCards: cardNames, cardCount: cardNames.length }
            : p
        );
        
        set({
          knowledgeMatrix: matrix,
          players: updatedPlayers,
          deductions: [...state.deductions, ...newDeductions]
        });
        
        // Run inference after setting cards
        get().runInference();
      },
      
      reorderPlayers: (players: Player[]) => {
        set({ players });
      },
      
      startGame: () => {
        const state = get();
        
        // Calculate card counts for all players
        // Total: 21 cards, Envelope: 3, Distributed: 18
        // All players get equal cards, any extras are opened cards
        const numPlayers = state.players.length;
        const distributedCards = GAME_CONSTANTS.DISTRIBUTED_CARDS; // 18
        const cardsPerPlayer = Math.floor(distributedCards / numPlayers);
        const extraCards = distributedCards % numPlayers;
        
        // All players get the same number of cards
        // Extra cards (if any) should be marked as opened cards
        const playersWithCardCount = state.players.map((player) => {
          // If this is "me" and they've already set their cards, use that count
          if (player.id === state.myPlayerId && player.confirmedCards.length > 0) {
            return { ...player, cardCount: player.confirmedCards.length };
          }
          
          return { ...player, cardCount: cardsPerPlayer };
        });
        
        // Initialize knowledge matrix
        const matrix = createEmptyKnowledgeMatrix(state.players.map(p => p.id));
        
        // Re-apply my cards if already set
        const myPlayer = playersWithCardCount.find(p => p.id === state.myPlayerId);
        if (myPlayer && myPlayer.confirmedCards.length > 0) {
          myPlayer.confirmedCards.forEach(cardName => {
            matrix[cardName][state.myPlayerId!] = { state: 'owned' };
            matrix[cardName].envelope = { state: 'not_owned' };
            state.players.forEach(player => {
              if (player.id !== state.myPlayerId) {
                matrix[cardName][player.id] = { state: 'not_owned' };
              }
            });
          });
        }
        
        set({
          gameStarted: true,
          knowledgeMatrix: matrix,
          players: playersWithCardCount,
          currentTurn: 1
        });
        
        get().runInference();
      },
      
      resetGame: () => {
        set(initialState);
      },
      
      recordSuggestion: (suggestionData) => {
        const state = get();
        const suggestionId = `suggestion-${Date.now()}`;
        
        const suggestion: Suggestion = {
          ...suggestionData,
          id: suggestionId,
          turnNumber: state.currentTurn,
          timestamp: new Date()
        };
        
        let matrix = { ...state.knowledgeMatrix };
        let cardLinks = [...state.cardLinks];
        const newDeductions: Deduction[] = [];
        
        // Deep copy the matrix
        Object.keys(matrix).forEach(cardName => {
          matrix[cardName] = { ...matrix[cardName] };
        });
        
        const suggestedCards = [suggestion.suspect, suggestion.weapon, suggestion.room];
        
        // Process passes - if a player passed, they don't have ANY of the suggested cards
        // This also updates potentially_owned to not_owned (crucial for cross-suggestion deductions)
        suggestion.passedPlayerIds.forEach(passedPlayerId => {
          suggestedCards.forEach(cardName => {
            const currentState = matrix[cardName][passedPlayerId].state;
            if (currentState === 'unknown' || currentState === 'potentially_owned') {
              matrix[cardName][passedPlayerId] = { state: 'not_owned' };
              newDeductions.push({
                id: `deduction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${cardName}-${passedPlayerId}`,
                type: 'card_not_owned',
                description: `${state.players.find(p => p.id === passedPlayerId)?.name} passed on ${cardName}`,
                cardName,
                playerId: passedPlayerId,
                sourceSuggestionId: suggestionId,
                timestamp: new Date()
              });
            }
          });
        });
        
        // Process show
        if (suggestion.showerId) {
          if (suggestion.shownCard) {
            // We know which card was shown
            matrix[suggestion.shownCard][suggestion.showerId] = { state: 'owned' };
            matrix[suggestion.shownCard].envelope = { state: 'not_owned' };
            
            // Mark other players as not having this card
            state.players.forEach(player => {
              if (player.id !== suggestion.showerId) {
                if (matrix[suggestion.shownCard!][player.id].state === 'unknown') {
                  matrix[suggestion.shownCard!][player.id] = { state: 'not_owned' };
                }
              }
            });
            
            newDeductions.push({
              id: `deduction-${Date.now()}-shown`,
              type: 'card_owned',
              description: `${state.players.find(p => p.id === suggestion.showerId)?.name} showed ${suggestion.shownCard}`,
              cardName: suggestion.shownCard,
              playerId: suggestion.showerId,
              sourceSuggestionId: suggestionId,
              timestamp: new Date()
            });
          } else {
            // Don't know which card - create a link
            const linkId = `link-${Date.now()}`;
            const possibleCards = suggestedCards.filter(card => 
              matrix[card][suggestion.showerId!].state !== 'not_owned'
            );
            
            if (possibleCards.length > 0) {
              const link: CardLink = {
                id: linkId,
                suggestionId,
                playerId: suggestion.showerId,
                possibleCards,
                resolved: false
              };
              
              cardLinks.push(link);
              suggestion.linkId = linkId;
              
              // Mark these cards as potentially owned
              possibleCards.forEach(cardName => {
                if (matrix[cardName][suggestion.showerId!].state === 'unknown') {
                  matrix[cardName][suggestion.showerId!] = {
                    state: 'potentially_owned',
                    linkedSuggestionIds: [suggestionId]
                  };
                } else if (matrix[cardName][suggestion.showerId!].state === 'potentially_owned') {
                  matrix[cardName][suggestion.showerId!] = {
                    ...matrix[cardName][suggestion.showerId!],
                    linkedSuggestionIds: [
                      ...(matrix[cardName][suggestion.showerId!].linkedSuggestionIds || []),
                      suggestionId
                    ]
                  };
                }
              });
            }
          }
        }
        
        set({
          suggestions: [...state.suggestions, suggestion],
          cardLinks,
          knowledgeMatrix: matrix,
          deductions: [...state.deductions, ...newDeductions],
          currentTurn: state.currentTurn + 1
        });
        
        // Run inference
        get().runInference();
      },
      
      setCardState: (cardName: string, target: string | 'envelope', newState: PlayerCardKnowledge['state'], createDeduction = true) => {
        const state = get();
        let matrix = { ...state.knowledgeMatrix };

        // Deep copy
        Object.keys(matrix).forEach(cn => {
          matrix[cn] = { ...matrix[cn] };
        });

        const newDeductions: Deduction[] = [];
        const previousState = matrix[cardName][target].state;

        matrix[cardName][target] = { state: newState };

        // If marking as owned, mark others as not_owned
        if (newState === 'owned' && target !== 'envelope') {
          matrix[cardName].envelope = { state: 'not_owned' };
          state.players.forEach(player => {
            if (player.id !== target) {
              matrix[cardName][player.id] = { state: 'not_owned' };
            }
          });
        }

        // If marking as envelope, mark all players as not_owned
        if (newState === 'envelope' || (target === 'envelope' && newState === 'owned')) {
          state.players.forEach(player => {
            matrix[cardName][player.id] = { state: 'not_owned' };
          });
          matrix[cardName].envelope = { state: 'envelope' };
        }

        // If cycling back to unknown from owned, reset other players' states to unknown as well
        // This allows users to undo accidental "owned" clicks
        if (newState === 'unknown' && previousState === 'owned' && target !== 'envelope') {
          matrix[cardName].envelope = { state: 'unknown' };
          state.players.forEach(player => {
            if (player.id !== target) {
              // Only reset if it was set to not_owned (likely from the owned state)
              // Keep potentially_owned states as they might be from suggestions
              if (matrix[cardName][player.id].state === 'not_owned') {
                matrix[cardName][player.id] = { state: 'unknown' };
              }
            }
          });
        }

        // If cycling back to unknown from envelope, reset all players' states to unknown
        if (newState === 'unknown' && previousState === 'envelope') {
          state.players.forEach(player => {
            if (matrix[cardName][player.id].state === 'not_owned') {
              matrix[cardName][player.id] = { state: 'unknown' };
            }
          });
        }

        // Remove previous manual deductions for this card-target combination when state changes
        let filteredDeductions = state.deductions;
        if (createDeduction && previousState !== newState) {
          // Remove any previous manual deductions for this exact card and target
          filteredDeductions = state.deductions.filter(d =>
            !(d.type === 'manual_adjustment' || d.type === 'card_owned' || d.type === 'card_not_owned' || d.type === 'envelope') ||
            d.cardName !== cardName ||
            d.playerId !== (target === 'envelope' ? undefined : target)
          );
        }

        // Create manual adjustment deductions when createDeduction is true and state actually changed
        if (createDeduction && previousState !== newState) {
          let deductionType: Deduction['type'] = 'manual_adjustment';
          let description = '';

          if (newState === 'envelope') {
            deductionType = 'envelope';
            description = `${cardName} manually marked as solution`;
          } else if (newState === 'owned') {
            deductionType = 'card_owned';
            const playerName = target === 'envelope' ? 'Envelope' : state.players.find(p => p.id === target)?.name;
            description = `${playerName} manually marked as owning ${cardName}`;
          } else if (newState === 'not_owned') {
            deductionType = 'card_not_owned';
            const playerName = target === 'envelope' ? 'Envelope' : state.players.find(p => p.id === target)?.name;
            description = `${playerName} manually marked as not owning ${cardName}`;
          } else if (newState === 'potentially_owned') {
            deductionType = 'manual_adjustment';
            description = `${cardName} manually marked as potentially owned`;
          } else if (newState === 'unknown') {
            deductionType = 'manual_adjustment';
            description = `${cardName} state manually reset to unknown`;
          }

          if (description) {
            newDeductions.push({
              id: `deduction-manual-${Date.now()}-${cardName}-${target}`,
              type: deductionType,
              description,
              cardName,
              playerId: target === 'envelope' ? undefined : target,
              previousState,
              timestamp: new Date()
            });
          }
        }

        set({
          knowledgeMatrix: matrix,
          deductions: [...filteredDeductions, ...newDeductions]
        });

        if (createDeduction) {
          get().runInference();
        }
      },

      recordOpenedCards: (cardNames: string[], playerId?: string) => {
        const state = get();
        let matrix = { ...state.knowledgeMatrix };
        const newDeductions: Deduction[] = [];

        // Deep copy
        Object.keys(matrix).forEach(cn => {
          matrix[cn] = { ...matrix[cn] };
        });

        // Mark each opened card
        cardNames.forEach(cardName => {
          if (playerId) {
            // Assign to specific player
            matrix[cardName].envelope = { state: 'not_owned' };
            state.players.forEach(player => {
              matrix[cardName][player.id] = { state: player.id === playerId ? 'owned' : 'not_owned' };
            });
            const playerName = state.players.find(p => p.id === playerId)?.name || 'Unknown';
            newDeductions.push({
              id: `deduction-opened-${Date.now()}-${cardName}`,
              type: 'card_owned',
              description: `${cardName} revealed - owned by ${playerName}`,
              cardName,
              playerId,
              timestamp: new Date()
            });
          } else {
            // No owner - revealed/open card (not in anyone's hand or envelope)
            matrix[cardName].envelope = { state: 'not_owned' };
            state.players.forEach(player => {
              matrix[cardName][player.id] = { state: 'not_owned' };
            });
            newDeductions.push({
              id: `deduction-opened-${Date.now()}-${cardName}`,
              type: 'manual_adjustment',
              description: `${cardName} revealed (open card)`,
              cardName,
              timestamp: new Date()
            });
          }
        });

        set({
          knowledgeMatrix: matrix,
          deductions: [...state.deductions, ...newDeductions]
        });

        get().runInference();
      },

      clearCardRow: (cardName: string) => {
        const state = get();
        let matrix = { ...state.knowledgeMatrix };

        // Deep copy
        Object.keys(matrix).forEach(cn => {
          matrix[cn] = { ...matrix[cn] };
        });

        // Reset the card to unknown for all players and envelope
        matrix[cardName].envelope = { state: 'unknown' };
        state.players.forEach(player => {
          matrix[cardName][player.id] = { state: 'unknown' };
        });

        // Add a deduction for the reset
        const newDeduction: Deduction = {
          id: `deduction-clear-${Date.now()}-${cardName}`,
          type: 'manual_adjustment',
          description: `${cardName} row cleared (reset to unknown)`,
          cardName,
          timestamp: new Date()
        };

        set({
          knowledgeMatrix: matrix,
          deductions: [...state.deductions, newDeduction]
        });

        get().runInference();
      },
      
      updateNotes: (notes: string) => {
        set({ notes });
      },
      
      runInference: () => {
        const state = get();
        if (!state.gameStarted || Object.keys(state.knowledgeMatrix).length === 0) return;
        
        let matrix = { ...state.knowledgeMatrix };
        let cardLinks = [...state.cardLinks];
        const newDeductions: Deduction[] = [];
        let changed = true;
        let iterations = 0;
        const maxIterations = 100; // Increased for more complex deductions
        
        // Deep copy matrix
        Object.keys(matrix).forEach(cardName => {
          matrix[cardName] = { ...matrix[cardName] };
        });
        
        // Deep copy card links
        cardLinks = cardLinks.map(link => ({ ...link, possibleCards: [...link.possibleCards] }));
        
        while (changed && iterations < maxIterations) {
          changed = false;
          iterations++;
          
          // Rule 0: Update link possible cards based on current matrix knowledge
          // This handles the cross-suggestion scenario where a player showed in one suggestion
          // but passed in another overlapping suggestion
          cardLinks.forEach((link, linkIndex) => {
            if (link.resolved) return;
            
            const updatedPossible = link.possibleCards.filter(
              cardName => matrix[cardName][link.playerId].state !== 'not_owned'
            );
            
            if (updatedPossible.length < link.possibleCards.length) {
              cardLinks[linkIndex] = { ...link, possibleCards: updatedPossible };
              changed = true;
            }
          });
          
          // Rule 1: Resolve links where only one card is possible
          cardLinks.forEach((link, linkIndex) => {
            if (link.resolved) return;
            
            const remainingPossible = link.possibleCards.filter(
              cardName => matrix[cardName][link.playerId].state !== 'not_owned'
            );
            
            if (remainingPossible.length === 1) {
              // Link resolved! Player must have this card
              const resolvedCard = remainingPossible[0];
              cardLinks[linkIndex] = { ...link, resolved: true, resolvedCard };
              
              if (matrix[resolvedCard][link.playerId].state !== 'owned') {
                matrix[resolvedCard][link.playerId] = { state: 'owned' };
                matrix[resolvedCard].envelope = { state: 'not_owned' };
                
                // Mark other players as not having this card
                state.players.forEach(player => {
                  if (player.id !== link.playerId && matrix[resolvedCard][player.id].state !== 'owned') {
                    matrix[resolvedCard][player.id] = { state: 'not_owned' };
                  }
                });
                
                const suggestion = state.suggestions.find(s => s.id === link.suggestionId);
                newDeductions.push({
                  id: `deduction-link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${resolvedCard}`,
                  type: 'link_resolved',
                  description: `${state.players.find(p => p.id === link.playerId)?.name} must have ${resolvedCard} (cross-referenced from Turn ${suggestion?.turnNumber})`,
                  cardName: resolvedCard,
                  playerId: link.playerId,
                  sourceSuggestionId: link.suggestionId,
                  timestamp: new Date()
                });
                
                changed = true;
              }
            } else if (remainingPossible.length === 0) {
              // This shouldn't happen in valid game state, but mark as resolved
              cardLinks[linkIndex] = { ...link, resolved: true };
            }
          });
          
          // Rule 1.5: Cross-suggestion inference - Compare show vs pass events
          // If player P showed something from {A,B,C} and later passed on {A,B,D},
          // P must not have A or B (from the pass), so P showed C
          state.suggestions.forEach(showSuggestion => {
            if (!showSuggestion.showerId) return;
            
            const showCards = [showSuggestion.suspect, showSuggestion.weapon, showSuggestion.room];
            const showerId = showSuggestion.showerId;
            
            // Look at all suggestions where this player passed
            state.suggestions.forEach(passSuggestion => {
              if (!passSuggestion.passedPlayerIds.includes(showerId)) return;
              if (passSuggestion.id === showSuggestion.id) return;
              
              const passCards = [passSuggestion.suspect, passSuggestion.weapon, passSuggestion.room];
              
              // Cards from the show that are NOT in the pass suggestion
              // These are the only candidates for what was shown
              const mustHaveShown = showCards.filter(card => !passCards.includes(card));
              
              // If there's exactly one card that could have been shown, it must be that one
              if (mustHaveShown.length === 1) {
                const deducedCard = mustHaveShown[0];
                if (matrix[deducedCard][showerId].state !== 'owned') {
                  matrix[deducedCard][showerId] = { state: 'owned' };
                  matrix[deducedCard].envelope = { state: 'not_owned' };
                  
                  // Mark other players as not having this card
                  state.players.forEach(player => {
                    if (player.id !== showerId && matrix[deducedCard][player.id].state !== 'owned') {
                      matrix[deducedCard][player.id] = { state: 'not_owned' };
                    }
                  });
                  
                  newDeductions.push({
                    id: `deduction-cross-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${deducedCard}`,
                    type: 'cross_reference',
                    description: `${state.players.find(p => p.id === showerId)?.name} must have ${deducedCard} (showed in Turn ${showSuggestion.turnNumber}, passed in Turn ${passSuggestion.turnNumber})`,
                    cardName: deducedCard,
                    playerId: showerId,
                    sourceSuggestionId: showSuggestion.id,
                    timestamp: new Date()
                  });
                  
                  // Resolve any related links
                  const relatedLinkIndex = cardLinks.findIndex(l => l.suggestionId === showSuggestion.id);
                  if (relatedLinkIndex !== -1 && !cardLinks[relatedLinkIndex].resolved) {
                    cardLinks[relatedLinkIndex] = { 
                      ...cardLinks[relatedLinkIndex], 
                      resolved: true, 
                      resolvedCard: deducedCard 
                    };
                  }
                  
                  changed = true;
                }
              }
            });
          });
          
          // Rule 1.6: Multiple link intersection for same player
          // If player P has unresolved links with possible cards {A,B,C} and {B,C,D},
          // and we can eliminate cards, we should track which cards appear in ALL links
          const playerLinks: { [playerId: string]: CardLink[] } = {};
          cardLinks.forEach(link => {
            if (link.resolved) return;
            if (!playerLinks[link.playerId]) playerLinks[link.playerId] = [];
            playerLinks[link.playerId].push(link);
          });
          
          Object.entries(playerLinks).forEach(([playerId, links]) => {
            if (links.length < 2) return;
            
            // For each pair of links, if they share exactly one possible card,
            // that card is the one the player must have (shown in multiple suggestions)
            for (let i = 0; i < links.length; i++) {
              for (let j = i + 1; j < links.length; j++) {
                const link1 = links[i];
                const link2 = links[j];
                
                // Find intersection of possible cards
                const intersection = link1.possibleCards.filter(
                  card => link2.possibleCards.includes(card) && 
                          matrix[card][playerId].state !== 'not_owned'
                );
                
                // If the intersection is exactly 1 card and both links are about the same card,
                // that player must have that card
                if (intersection.length === 1) {
                  const deducedCard = intersection[0];
                  
                  // Check if this card could actually be the one shown in both
                  const link1Valid = link1.possibleCards.filter(c => matrix[c][playerId].state !== 'not_owned');
                  const link2Valid = link2.possibleCards.filter(c => matrix[c][playerId].state !== 'not_owned');
                  
                  if (link1Valid.length > 0 && link2Valid.length > 0 &&
                      link1Valid.includes(deducedCard) && link2Valid.includes(deducedCard)) {
                    // We can't directly deduce ownership from intersection alone
                    // unless one of the links has only this card remaining
                  }
                }
              }
            }
          });
          
          // Rule 2: If all but one player doesn't have a card, and it's not in envelope,
          // the remaining player has it
          getAllCards().forEach(card => {
            const cardName = card.name;
            if (matrix[cardName].envelope.state === 'envelope') return;
            
            const unknownPlayers = state.players.filter(
              p => matrix[cardName][p.id].state === 'unknown' || matrix[cardName][p.id].state === 'potentially_owned'
            );
            const ownedBy = state.players.find(p => matrix[cardName][p.id].state === 'owned');
            
            if (!ownedBy && unknownPlayers.length === 1 && matrix[cardName].envelope.state === 'not_owned') {
              // Only one player could have it
              const playerId = unknownPlayers[0].id;
              matrix[cardName][playerId] = { state: 'owned' };
              
              newDeductions.push({
                id: `deduction-elim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${cardName}`,
                type: 'card_owned',
                description: `${unknownPlayers[0].name} must have ${cardName} (all others eliminated)`,
                cardName,
                playerId,
                timestamp: new Date()
              });
              
              changed = true;
            }
          });
          
          // Rule 2.5: Propagate not_owned from potentially_owned when we learn a player doesn't have a card
          // Update potentially_owned to not_owned if we have evidence from passes
          state.suggestions.forEach(suggestion => {
            const passCards = [suggestion.suspect, suggestion.weapon, suggestion.room];
            suggestion.passedPlayerIds.forEach(passedPlayerId => {
              passCards.forEach(cardName => {
                // If the card was potentially_owned but the player passed on a suggestion containing it,
                // they definitely don't have it
                if (matrix[cardName][passedPlayerId].state === 'potentially_owned') {
                  matrix[cardName][passedPlayerId] = { state: 'not_owned' };
                  changed = true;
                }
              });
            });
          });
          
          // Rule 3: If all players don't have a card, it's in envelope
          ['suspect', 'weapon', 'room'].forEach(type => {
            const cards = getCardsByType(type as CardType);
            
            cards.forEach(cardName => {
              if (matrix[cardName].envelope.state !== 'unknown') return;
              
              const allPlayersNotOwn = state.players.every(
                p => matrix[cardName][p.id].state === 'not_owned'
              );
              
              if (allPlayersNotOwn) {
                matrix[cardName].envelope = { state: 'envelope' };
                
                newDeductions.push({
                  id: `deduction-env-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${cardName}`,
                  type: 'envelope',
                  description: `${cardName} must be in the envelope (no player has it)`,
                  cardName,
                  timestamp: new Date()
                });
                
                changed = true;
              }
            });
          });
          
          // Rule 4: If a card type already has an envelope card, mark others as not in envelope
          ['suspect', 'weapon', 'room'].forEach(type => {
            const cards = getCardsByType(type as CardType);
            const envelopeCard = cards.find(c => matrix[c].envelope.state === 'envelope');
            
            if (envelopeCard) {
              cards.forEach(cardName => {
                if (cardName !== envelopeCard && matrix[cardName].envelope.state === 'unknown') {
                  matrix[cardName].envelope = { state: 'not_owned' };
                  changed = true;
                }
              });
            }
          });
          
          // Rule 5: If only one unknown card of a type remains and it's not owned, it's in envelope
          ['suspect', 'weapon', 'room'].forEach(type => {
            const cards = getCardsByType(type as CardType);
            const hasEnvelope = cards.some(c => matrix[c].envelope.state === 'envelope');
            
            if (!hasEnvelope) {
              const unknownEnvelopeCards = cards.filter(c => 
                matrix[c].envelope.state === 'unknown' || matrix[c].envelope.state === 'not_owned'
              );
              
              const notOwnedByAnyone = unknownEnvelopeCards.filter(cardName => {
                const ownedBy = state.players.find(p => matrix[cardName][p.id].state === 'owned');
                return !ownedBy;
              });
              
              if (notOwnedByAnyone.length === 1) {
                const cardName = notOwnedByAnyone[0];
                matrix[cardName].envelope = { state: 'envelope' };
                
                // Mark all players as not having it
                state.players.forEach(player => {
                  if (matrix[cardName][player.id].state !== 'not_owned') {
                    matrix[cardName][player.id] = { state: 'not_owned' };
                  }
                });
                
                newDeductions.push({
                  id: `deduction-lastenv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${cardName}`,
                  type: 'envelope',
                  description: `${cardName} must be in envelope (only ${type} unaccounted for)`,
                  cardName,
                  timestamp: new Date()
                });
                
                changed = true;
              }
            }
          });
          
          // Rule 6: Card count inference (Enhanced)
          // Use knowledge of how many cards each player has for sophisticated deductions
          state.players.forEach(player => {
            const cardCount = player.cardCount;
            if (!cardCount) return;
            
            const allCards = getAllCards();
            
            const ownedCards = allCards.filter(
              card => matrix[card.name][player.id].state === 'owned'
            );
            
            const notOwnedCards = allCards.filter(
              card => matrix[card.name][player.id].state === 'not_owned'
            );
            
            const potentiallyOwnedCards = allCards.filter(
              card => matrix[card.name][player.id].state === 'potentially_owned'
            );
            
            const unknownCards = allCards.filter(
              card => matrix[card.name][player.id].state === 'unknown'
            );
            
            const remainingSlots = cardCount - ownedCards.length;
            const possibleCards = [...potentiallyOwnedCards, ...unknownCards];
            
            // Rule 6a: If remaining slots equals the number of possible cards, they have all of them
            if (remainingSlots > 0 && remainingSlots === possibleCards.length) {
              possibleCards.forEach(card => {
                if (matrix[card.name][player.id].state !== 'owned') {
                  matrix[card.name][player.id] = { state: 'owned' };
                  matrix[card.name].envelope = { state: 'not_owned' };
                  
                  // Mark other players as not having this card
                  state.players.forEach(otherPlayer => {
                    if (otherPlayer.id !== player.id && matrix[card.name][otherPlayer.id].state !== 'owned') {
                      matrix[card.name][otherPlayer.id] = { state: 'not_owned' };
                    }
                  });
                  
                  newDeductions.push({
                    id: `deduction-count-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${card.name}`,
                    type: 'card_count',
                    description: `${player.name} must have ${card.name} (only ${possibleCards.length} possible cards for ${remainingSlots} remaining slots)`,
                    cardName: card.name,
                    playerId: player.id,
                    timestamp: new Date()
                  });
                  
                  changed = true;
                }
              });
            }
            
            // Rule 6b: If player has all their cards confirmed, mark everything else as not_owned
            if (ownedCards.length === cardCount) {
              allCards.forEach(card => {
                if (matrix[card.name][player.id].state !== 'owned' && 
                    matrix[card.name][player.id].state !== 'not_owned') {
                  matrix[card.name][player.id] = { state: 'not_owned' };
                  
                  newDeductions.push({
                    id: `deduction-full-hand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${card.name}`,
                    type: 'card_count',
                    description: `${player.name} doesn't have ${card.name} (already has all ${cardCount} cards)`,
                    cardName: card.name,
                    playerId: player.id,
                    timestamp: new Date()
                  });
                  
                  changed = true;
                }
              });
            }
            
            // Rule 6c: If player has more not_owned + owned cards than total - cardCount, 
            // we can infer from the constraint that remaining unknowns must be distributed
            // This helps when we know a card must be owned by one of a few players
            const knownNotOwned = notOwnedCards.length;
            const maxPossibleNotOwned = GAME_CONSTANTS.TOTAL_CARDS - cardCount;
            
            // If we've confirmed this player doesn't have maxPossibleNotOwned cards,
            // any remaining potentially_owned must actually be owned
            if (knownNotOwned >= maxPossibleNotOwned && potentiallyOwnedCards.length > 0) {
              potentiallyOwnedCards.forEach(card => {
                if (matrix[card.name][player.id].state !== 'owned') {
                  matrix[card.name][player.id] = { state: 'owned' };
                  matrix[card.name].envelope = { state: 'not_owned' };
                  
                  state.players.forEach(otherPlayer => {
                    if (otherPlayer.id !== player.id && matrix[card.name][otherPlayer.id].state !== 'owned') {
                      matrix[card.name][otherPlayer.id] = { state: 'not_owned' };
                    }
                  });
                  
                  newDeductions.push({
                    id: `deduction-constraint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${card.name}`,
                    type: 'card_count',
                    description: `${player.name} must have ${card.name} (eliminated ${knownNotOwned} cards, max possible to not have is ${maxPossibleNotOwned})`,
                    cardName: card.name,
                    playerId: player.id,
                    timestamp: new Date()
                  });
                  
                  changed = true;
                }
              });
            }
          });
          
          // Rule 6d: Cross-player card count constraint
          // If the total unknown/potentially_owned cards across all players for a specific card
          // is exactly 1, that player must have it (unless it's in envelope)
          getAllCards().forEach(card => {
            const cardName = card.name;
            if (matrix[cardName].envelope.state === 'envelope') return;
            
            // Check if anyone already owns this card
            const owner = state.players.find(p => matrix[cardName][p.id].state === 'owned');
            if (owner) return;
            
            // Find players who could potentially have this card
            const possibleOwners = state.players.filter(p => {
              const playerCardCount = p.cardCount;
              if (!playerCardCount) return true; // If no card count, they could have it
              
              const ownedByPlayer = getAllCards().filter(
                c => matrix[c.name][p.id].state === 'owned'
              ).length;
              
              // Can only have this card if they have room
              return ownedByPlayer < playerCardCount && 
                     matrix[cardName][p.id].state !== 'not_owned';
            });
            
            // If exactly one player can have this card and envelope can't have it
            if (possibleOwners.length === 1 && matrix[cardName].envelope.state === 'not_owned') {
              const soleOwner = possibleOwners[0];
              if (matrix[cardName][soleOwner.id].state !== 'owned') {
                matrix[cardName][soleOwner.id] = { state: 'owned' };
                
                state.players.forEach(player => {
                  if (player.id !== soleOwner.id) {
                    matrix[cardName][player.id] = { state: 'not_owned' };
                  }
                });
                
                newDeductions.push({
                  id: `deduction-sole-owner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${cardName}`,
                  type: 'card_count',
                  description: `${soleOwner.name} must have ${cardName} (only player with room for this card)`,
                  cardName,
                  playerId: soleOwner.id,
                  timestamp: new Date()
                });
                
                changed = true;
              }
            }
          });
          
          // Rule 7: If we confirm a player owns a card, mark all other players as not owning it
          getAllCards().forEach(card => {
            const cardName = card.name;
            const owner = state.players.find(p => matrix[cardName][p.id].state === 'owned');
            
            if (owner) {
              state.players.forEach(player => {
                if (player.id !== owner.id && 
                    matrix[cardName][player.id].state !== 'not_owned') {
                  matrix[cardName][player.id] = { state: 'not_owned' };
                  changed = true;
                }
              });
              
              if (matrix[cardName].envelope.state !== 'not_owned') {
                matrix[cardName].envelope = { state: 'not_owned' };
                changed = true;
              }
            }
          });
        }
        
        // Calculate solved envelope
        const solvedEnvelope = {
          suspect: GAME_CONSTANTS.SUSPECTS.find(s => matrix[s].envelope.state === 'envelope') || null,
          weapon: GAME_CONSTANTS.WEAPONS.find(w => matrix[w].envelope.state === 'envelope') || null,
          room: GAME_CONSTANTS.ROOMS.find(r => matrix[r].envelope.state === 'envelope') || null
        };
        
        set({
          knowledgeMatrix: matrix,
          cardLinks,
          deductions: [...state.deductions, ...newDeductions],
          solvedEnvelope
        });
      }
    }),
    {
      name: 'clue-master-storage',
      partialize: (state) => ({
        players: state.players,
        myPlayerId: state.myPlayerId,
        currentTurn: state.currentTurn,
        firstPlayerId: state.firstPlayerId,
        gameStarted: state.gameStarted,
        knowledgeMatrix: state.knowledgeMatrix,
        cardLinks: state.cardLinks,
        suggestions: state.suggestions,
        accusations: state.accusations,
        deductions: state.deductions,
        notes: state.notes,
        solvedEnvelope: state.solvedEnvelope
      })
    }
  )
);

