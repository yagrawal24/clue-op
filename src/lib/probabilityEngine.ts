/**
 * Probabilistic Reasoning Engine for Clue
 * 
 * Implements Bayesian probability calculations for card ownership
 * and suggestion optimization using information gain (entropy reduction).
 */

import {
  KnowledgeMatrix,
  Player,
  CardLink,
  Suggestion,
  ProbabilityMatrix,
  CardProbability,
  CategoryEntropy,
  SolutionConfidence,
  SuggestionAnalysis,
  SuggestionOutcome,
  OptimalSuggestions,
  CardType,
  GAME_CONSTANTS,
  getAllCards,
  getCardType,
  getCardsByType
} from './types';

// ============================================
// PROBABILITY CALCULATION ENGINE
// ============================================

/**
 * Calculate probability distributions for all cards.
 * Uses constraint propagation and card count constraints.
 */
export function calculateProbabilities(
  knowledgeMatrix: KnowledgeMatrix,
  players: Player[],
  cardLinks: CardLink[]
): ProbabilityMatrix {
  const allCards = getAllCards();
  const probMatrix: ProbabilityMatrix = {};

  // First pass: Initialize based on known states
  allCards.forEach(card => {
    const knowledge = knowledgeMatrix[card.name];
    const cardProb: CardProbability = {
      cardName: card.name,
      cardType: card.type,
      envelopeProbability: 0,
      playerProbabilities: {}
    };

    // Handle definite states
    if (knowledge?.envelope?.state === 'envelope') {
      cardProb.envelopeProbability = 1.0;
      players.forEach(p => cardProb.playerProbabilities[p.id] = 0);
    } else if (knowledge?.envelope?.state === 'not_owned') {
      cardProb.envelopeProbability = 0;
      
      // Check if any player definitely owns it
      const owner = players.find(p => knowledge[p.id]?.state === 'owned');
      if (owner) {
        players.forEach(p => {
          cardProb.playerProbabilities[p.id] = p.id === owner.id ? 1.0 : 0;
        });
      } else {
        // Distribute probability among candidates
        const candidates = players.filter(p => 
          knowledge[p.id]?.state !== 'not_owned'
        );
        
        if (candidates.length > 0) {
          // Weight by remaining card slots
          const weights = calculateCandidateWeights(candidates, players, knowledgeMatrix);
          const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
          
          players.forEach(p => {
            if (knowledge[p.id]?.state === 'not_owned') {
              cardProb.playerProbabilities[p.id] = 0;
            } else if (totalWeight > 0) {
              cardProb.playerProbabilities[p.id] = (weights[p.id] || 0) / totalWeight;
            } else {
              cardProb.playerProbabilities[p.id] = 1 / candidates.length;
            }
          });
        } else {
          // No candidates - shouldn't happen but handle gracefully
          players.forEach(p => cardProb.playerProbabilities[p.id] = 0);
        }
      }
    } else {
      // Unknown envelope state - could be in envelope or owned by someone
      const candidates = players.filter(p => 
        knowledge?.[p.id]?.state !== 'not_owned'
      );
      
      // Calculate base probability for envelope
      const envelopeProb = calculateEnvelopeProbability(
        card.name,
        card.type,
        knowledgeMatrix,
        players
      );
      
      cardProb.envelopeProbability = envelopeProb;
      
      // Remaining probability distributed among players
      const remainingProb = 1 - envelopeProb;
      
      if (candidates.length > 0 && remainingProb > 0) {
        const weights = calculateCandidateWeights(candidates, players, knowledgeMatrix);
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
        
        players.forEach(p => {
          if (knowledge?.[p.id]?.state === 'owned') {
            // This card is confirmed owned by this player
            cardProb.envelopeProbability = 0;
            cardProb.playerProbabilities[p.id] = 1.0;
            players.filter(op => op.id !== p.id).forEach(op => {
              cardProb.playerProbabilities[op.id] = 0;
            });
          } else if (knowledge?.[p.id]?.state === 'not_owned') {
            cardProb.playerProbabilities[p.id] = 0;
          } else if (totalWeight > 0) {
            cardProb.playerProbabilities[p.id] = remainingProb * (weights[p.id] || 0) / totalWeight;
          } else {
            cardProb.playerProbabilities[p.id] = remainingProb / candidates.length;
          }
        });
      } else {
        players.forEach(p => cardProb.playerProbabilities[p.id] = 0);
      }
    }

    probMatrix[card.name] = cardProb;
  });

  // Second pass: Refine using card links (potentially_owned states)
  refineWithCardLinks(probMatrix, cardLinks, players, knowledgeMatrix);

  // Third pass: Apply card count constraints
  applyCardCountConstraints(probMatrix, players, knowledgeMatrix);

  // Normalize probabilities
  normalizeProbabilities(probMatrix, players);

  return probMatrix;
}

/**
 * Calculate weights for candidates based on remaining card slots.
 * Players with more empty slots are more likely to hold any given unknown card.
 */
function calculateCandidateWeights(
  candidates: Player[],
  allPlayers: Player[],
  knowledgeMatrix: KnowledgeMatrix
): { [playerId: string]: number } {
  const weights: { [playerId: string]: number } = {};
  const allCards = getAllCards();

  candidates.forEach(player => {
    const cardCount = player.cardCount || Math.floor(18 / allPlayers.length);
    const confirmedOwned = allCards.filter(
      card => knowledgeMatrix[card.name]?.[player.id]?.state === 'owned'
    ).length;
    
    const remainingSlots = Math.max(0, cardCount - confirmedOwned);
    weights[player.id] = remainingSlots;
  });

  return weights;
}

/**
 * Calculate the probability that a card is in the envelope.
 */
function calculateEnvelopeProbability(
  cardName: string,
  cardType: CardType,
  knowledgeMatrix: KnowledgeMatrix,
  players: Player[]
): number {
  const cardsOfType = getCardsByType(cardType);
  
  // Check if this category already has a confirmed envelope card
  const confirmedEnvelope = cardsOfType.find(
    c => knowledgeMatrix[c]?.envelope?.state === 'envelope'
  );
  if (confirmedEnvelope) {
    return confirmedEnvelope === cardName ? 1.0 : 0;
  }

  // Count how many cards of this type could still be in envelope
  const possibleEnvelopeCards = cardsOfType.filter(c => {
    const knowledge = knowledgeMatrix[c];
    // Can't be in envelope if owned by someone or explicitly not in envelope
    const isOwnedByPlayer = players.some(p => knowledge?.[p.id]?.state === 'owned');
    const isDefinitelyNotEnvelope = knowledge?.envelope?.state === 'not_owned';
    return !isOwnedByPlayer && !isDefinitelyNotEnvelope;
  });

  if (possibleEnvelopeCards.length === 0) return 0;
  if (!possibleEnvelopeCards.includes(cardName)) return 0;

  // Base probability is 1/N where N is number of candidates
  let baseProbability = 1 / possibleEnvelopeCards.length;

  // Adjust based on how many players definitely don't have this card
  const playersWithoutCard = players.filter(
    p => knowledgeMatrix[cardName]?.[p.id]?.state === 'not_owned'
  ).length;

  // More eliminations = higher envelope probability
  const eliminationBonus = playersWithoutCard / players.length * 0.3;
  
  return Math.min(1.0, baseProbability + eliminationBonus);
}

/**
 * Refine probabilities using card link information.
 */
function refineWithCardLinks(
  probMatrix: ProbabilityMatrix,
  cardLinks: CardLink[],
  players: Player[],
  knowledgeMatrix: KnowledgeMatrix
): void {
  cardLinks.forEach(link => {
    if (link.resolved) return;

    const possibleCards = link.possibleCards.filter(
      c => knowledgeMatrix[c]?.[link.playerId]?.state !== 'not_owned'
    );

    if (possibleCards.length === 0) return;

    // The player definitely has AT LEAST ONE of these cards
    // Boost probabilities for these cards for this player
    const boostFactor = 1.5;

    possibleCards.forEach(cardName => {
      if (probMatrix[cardName]) {
        const currentProb = probMatrix[cardName].playerProbabilities[link.playerId] || 0;
        probMatrix[cardName].playerProbabilities[link.playerId] = Math.min(
          1.0,
          currentProb * boostFactor
        );
      }
    });
  });
}

/**
 * Apply card count constraints to normalize probabilities.
 */
function applyCardCountConstraints(
  probMatrix: ProbabilityMatrix,
  players: Player[],
  knowledgeMatrix: KnowledgeMatrix
): void {
  const allCards = getAllCards();

  players.forEach(player => {
    const cardCount = player.cardCount;
    if (!cardCount) return;

    // Calculate expected cards based on current probabilities
    let expectedCards = 0;
    allCards.forEach(card => {
      expectedCards += probMatrix[card.name]?.playerProbabilities[player.id] || 0;
    });

    // If expected doesn't match card count, normalize
    if (expectedCards > 0 && Math.abs(expectedCards - cardCount) > 0.1) {
      const scaleFactor = cardCount / expectedCards;
      allCards.forEach(card => {
        if (probMatrix[card.name]) {
          const currentProb = probMatrix[card.name].playerProbabilities[player.id];
          if (currentProb > 0 && currentProb < 1) {
            probMatrix[card.name].playerProbabilities[player.id] = 
              Math.min(1, Math.max(0, currentProb * scaleFactor));
          }
        }
      });
    }
  });
}

/**
 * Normalize probabilities so they sum to 1 for each card.
 */
function normalizeProbabilities(
  probMatrix: ProbabilityMatrix,
  players: Player[]
): void {
  Object.keys(probMatrix).forEach(cardName => {
    const cardProb = probMatrix[cardName];
    let total = cardProb.envelopeProbability;
    players.forEach(p => {
      total += cardProb.playerProbabilities[p.id] || 0;
    });

    if (total > 0 && Math.abs(total - 1) > 0.01) {
      cardProb.envelopeProbability /= total;
      players.forEach(p => {
        cardProb.playerProbabilities[p.id] = 
          (cardProb.playerProbabilities[p.id] || 0) / total;
      });
    }
  });
}

// ============================================
// ENTROPY CALCULATIONS
// ============================================

/**
 * Calculate entropy (uncertainty) for the current game state.
 * Lower entropy = more certainty.
 */
export function calculateEntropy(probMatrix: ProbabilityMatrix): CategoryEntropy {
  const calculateCategoryEntropy = (cards: string[]): number => {
    // Entropy for "which card is in envelope"
    let entropy = 0;
    
    cards.forEach(cardName => {
      const prob = probMatrix[cardName]?.envelopeProbability || 0;
      if (prob > 0 && prob < 1) {
        entropy -= prob * Math.log2(prob);
      }
    });

    return entropy;
  };

  const suspectEntropy = calculateCategoryEntropy(GAME_CONSTANTS.SUSPECTS);
  const weaponEntropy = calculateCategoryEntropy(GAME_CONSTANTS.WEAPONS);
  const roomEntropy = calculateCategoryEntropy(GAME_CONSTANTS.ROOMS);

  return {
    suspects: suspectEntropy,
    weapons: weaponEntropy,
    rooms: roomEntropy,
    total: suspectEntropy + weaponEntropy + roomEntropy
  };
}

/**
 * Get the most likely solution with confidence levels.
 */
export function getSolutionConfidence(
  probMatrix: ProbabilityMatrix
): SolutionConfidence {
  const getBestCandidate = (cards: string[]): { card: string | null; confidence: number } => {
    let bestCard: string | null = null;
    let bestProb = 0;

    cards.forEach(cardName => {
      const prob = probMatrix[cardName]?.envelopeProbability || 0;
      if (prob > bestProb) {
        bestProb = prob;
        bestCard = cardName;
      }
    });

    return { card: bestCard, confidence: bestProb };
  };

  return {
    suspect: getBestCandidate(GAME_CONSTANTS.SUSPECTS),
    weapon: getBestCandidate(GAME_CONSTANTS.WEAPONS),
    room: getBestCandidate(GAME_CONSTANTS.ROOMS)
  };
}

// ============================================
// SUGGESTION OPTIMIZATION (INFORMATION GAIN)
// ============================================

/**
 * Calculate information gain for a potential suggestion.
 * Uses Expected Information Gain (related to KL divergence).
 */
export function analyzeSuggestion(
  suspect: string,
  weapon: string,
  room: string,
  myPlayerId: string | null,
  players: Player[],
  knowledgeMatrix: KnowledgeMatrix,
  probMatrix: ProbabilityMatrix
): SuggestionAnalysis {
  const suggestedCards = [suspect, weapon, room];
  
  // Get players who would respond (in turn order after "me")
  const myIndex = players.findIndex(p => p.id === myPlayerId);
  const respondingPlayers: Player[] = [];
  for (let i = 1; i < players.length; i++) {
    const idx = (myIndex + i) % players.length;
    respondingPlayers.push(players[idx]);
  }

  // Calculate all possible outcomes
  const outcomes: SuggestionOutcome[] = [];
  let totalInfoGain = 0;
  let totalProbability = 0;

  // Generate all possible outcome scenarios
  const possibleOutcomes = generateOutcomes(
    respondingPlayers,
    suggestedCards,
    knowledgeMatrix,
    probMatrix
  );

  possibleOutcomes.forEach(outcome => {
    const infoGain = calculateOutcomeInfoGain(
      outcome,
      suggestedCards,
      knowledgeMatrix,
      probMatrix,
      players
    );

    outcome.informationGain = infoGain;
    outcomes.push(outcome);
    totalInfoGain += outcome.probability * infoGain;
    totalProbability += outcome.probability;
  });

  // Calculate category impact
  const categoryImpact = calculateCategoryImpact(suggestedCards, probMatrix);

  // Generate reasoning
  const reasoning = generateReasoning(
    suspect, weapon, room,
    outcomes,
    totalInfoGain,
    probMatrix
  );

  return {
    suspect,
    weapon,
    room,
    expectedInfoGain: totalInfoGain,
    outcomes,
    reasoning,
    categoryImpact
  };
}

/**
 * Generate possible outcomes for a suggestion.
 */
function generateOutcomes(
  respondingPlayers: Player[],
  suggestedCards: string[],
  knowledgeMatrix: KnowledgeMatrix,
  probMatrix: ProbabilityMatrix
): SuggestionOutcome[] {
  const outcomes: SuggestionOutcome[] = [];

  // Scenario: Everyone passes
  let everyonePassesProb = 1;
  respondingPlayers.forEach(player => {
    // Probability that player doesn't have ANY of the suggested cards
    let probNoCards = 1;
    suggestedCards.forEach(card => {
      const hasCard = probMatrix[card]?.playerProbabilities[player.id] || 0;
      probNoCards *= (1 - hasCard);
    });
    everyonePassesProb *= probNoCards;
  });

  if (everyonePassesProb > 0.001) {
    outcomes.push({
      passedPlayerIds: respondingPlayers.map(p => p.id),
      probability: everyonePassesProb,
      informationGain: 0 // Will be calculated
    });
  }

  // Scenarios: Each player shows a card
  let accumulatedPassProb = 1;
  
  respondingPlayers.forEach((player, playerIdx) => {
    // Players before this one passed
    const passedPlayers = respondingPlayers.slice(0, playerIdx);
    
    // Probability this player has at least one of the cards
    let probNoCards = 1;
    suggestedCards.forEach(card => {
      const hasCard = probMatrix[card]?.playerProbabilities[player.id] || 0;
      probNoCards *= (1 - hasCard);
    });
    const probHasCard = 1 - probNoCards;

    if (probHasCard > 0.001) {
      // Calculate which card they're most likely to show
      suggestedCards.forEach(card => {
        const cardProb = probMatrix[card]?.playerProbabilities[player.id] || 0;
        if (cardProb > 0.001) {
          const outcomeProb = accumulatedPassProb * cardProb;
          
          outcomes.push({
            passedPlayerIds: passedPlayers.map(p => p.id),
            showerId: player.id,
            shownCard: card,
            probability: outcomeProb,
            informationGain: 0
          });
        }
      });

      // Unknown card shown
      const unknownShowProb = accumulatedPassProb * probHasCard * 0.5; // Discount for unknown
      outcomes.push({
        passedPlayerIds: passedPlayers.map(p => p.id),
        showerId: player.id,
        probability: unknownShowProb,
        informationGain: 0
      });
    }

    accumulatedPassProb *= probNoCards;
  });

  // Normalize probabilities
  const totalProb = outcomes.reduce((sum, o) => sum + o.probability, 0);
  if (totalProb > 0) {
    outcomes.forEach(o => o.probability /= totalProb);
  }

  return outcomes;
}

/**
 * Calculate information gain for a specific outcome.
 */
function calculateOutcomeInfoGain(
  outcome: SuggestionOutcome,
  suggestedCards: string[],
  knowledgeMatrix: KnowledgeMatrix,
  probMatrix: ProbabilityMatrix,
  players: Player[]
): number {
  let infoGain = 0;

  // Information from passes
  outcome.passedPlayerIds.forEach(playerId => {
    suggestedCards.forEach(card => {
      const currentProb = probMatrix[card]?.playerProbabilities[playerId] || 0;
      // If we learn they don't have the card, gain = -log2(1-prob) bits
      if (currentProb > 0 && currentProb < 1) {
        infoGain += currentProb * Math.log2(1 / currentProb);
      }
    });
  });

  // Information from a show
  if (outcome.showerId) {
    if (outcome.shownCard) {
      // We learn exactly which card
      const currentProb = probMatrix[outcome.shownCard]?.playerProbabilities[outcome.showerId] || 0;
      if (currentProb > 0 && currentProb < 1) {
        infoGain += Math.log2(1 / currentProb);
      }
    } else {
      // We learn they have at least one of the cards (partial info)
      let probNoCards = 1;
      suggestedCards.forEach(card => {
        const hasCard = probMatrix[card]?.playerProbabilities[outcome.showerId!] || 0;
        probNoCards *= (1 - hasCard);
      });
      if (probNoCards > 0 && probNoCards < 1) {
        infoGain += Math.log2(1 / (1 - probNoCards)) * 0.5; // Partial information
      }
    }
  }

  // If everyone passes, potential envelope information
  if (outcome.passedPlayerIds.length === players.length - 1 && !outcome.showerId) {
    // If no one showed, at least one card might be in envelope
    suggestedCards.forEach(card => {
      const envProb = probMatrix[card]?.envelopeProbability || 0;
      if (envProb > 0 && envProb < 1) {
        infoGain += 0.5; // Some envelope information gained
      }
    });
  }

  return infoGain;
}

/**
 * Calculate how much a suggestion could impact each category.
 */
function calculateCategoryImpact(
  suggestedCards: string[],
  probMatrix: ProbabilityMatrix
): { suspect: number; weapon: number; room: number } {
  const impact = { suspect: 0, weapon: 0, room: 0 };

  suggestedCards.forEach(card => {
    const cardType = getCardType(card);
    const envProb = probMatrix[card]?.envelopeProbability || 0;
    
    // Higher envelope probability = more potential to solve category
    if (cardType === 'suspect') {
      impact.suspect = Math.max(impact.suspect, envProb);
    } else if (cardType === 'weapon') {
      impact.weapon = Math.max(impact.weapon, envProb);
    } else if (cardType === 'room') {
      impact.room = Math.max(impact.room, envProb);
    }
  });

  return impact;
}

/**
 * Generate human-readable reasoning for a suggestion.
 */
function generateReasoning(
  suspect: string,
  weapon: string,
  room: string,
  outcomes: SuggestionOutcome[],
  expectedInfoGain: number,
  probMatrix: ProbabilityMatrix
): string {
  const reasons: string[] = [];

  // Envelope probabilities
  const suspectEnvProb = (probMatrix[suspect]?.envelopeProbability || 0) * 100;
  const weaponEnvProb = (probMatrix[weapon]?.envelopeProbability || 0) * 100;
  const roomEnvProb = (probMatrix[room]?.envelopeProbability || 0) * 100;

  if (suspectEnvProb > 30) {
    reasons.push(`${suspect} has ${suspectEnvProb.toFixed(0)}% chance of being the murderer`);
  }
  if (weaponEnvProb > 30) {
    reasons.push(`${weapon} has ${weaponEnvProb.toFixed(0)}% chance of being the weapon`);
  }
  if (roomEnvProb > 30) {
    reasons.push(`${room} has ${roomEnvProb.toFixed(0)}% chance of being the room`);
  }

  // Find most likely outcome
  const mostLikely = outcomes.reduce((a, b) => a.probability > b.probability ? a : b);
  if (mostLikely.showerId && mostLikely.shownCard) {
    reasons.push(`Most likely: Someone shows ${mostLikely.shownCard}`);
  } else if (mostLikely.passedPlayerIds.length === outcomes[0]?.passedPlayerIds.length) {
    reasons.push('Good chance of eliminations if everyone passes');
  }

  // Info gain assessment
  if (expectedInfoGain > 1.5) {
    reasons.push('HIGH information potential');
  } else if (expectedInfoGain > 0.8) {
    reasons.push('Moderate information gain expected');
  } else {
    reasons.push('Limited new information expected');
  }

  return reasons.join('. ') + '.';
}

/**
 * Find optimal suggestions ranked by expected information gain.
 */
export function findOptimalSuggestions(
  myPlayerId: string | null,
  players: Player[],
  knowledgeMatrix: KnowledgeMatrix,
  probMatrix: ProbabilityMatrix,
  topN: number = 5
): OptimalSuggestions {
  const currentEntropy = calculateEntropy(probMatrix);
  const allAnalyses: SuggestionAnalysis[] = [];

  // Smart card selection: Focus on high-value cards
  const suspectCandidates = selectHighValueCards(GAME_CONSTANTS.SUSPECTS, probMatrix, 4);
  const weaponCandidates = selectHighValueCards(GAME_CONSTANTS.WEAPONS, probMatrix, 4);
  const roomCandidates = selectHighValueCards(GAME_CONSTANTS.ROOMS, probMatrix, 4);

  // Analyze combinations
  suspectCandidates.forEach(suspect => {
    weaponCandidates.forEach(weapon => {
      roomCandidates.forEach(room => {
        const analysis = analyzeSuggestion(
          suspect,
          weapon,
          room,
          myPlayerId,
          players,
          knowledgeMatrix,
          probMatrix
        );
        allAnalyses.push(analysis);
      });
    });
  });

  // Sort by expected information gain
  allAnalyses.sort((a, b) => b.expectedInfoGain - a.expectedInfoGain);

  // Take top N diverse suggestions
  const recommendations = selectDiverseSuggestions(allAnalyses, topN);

  const bestReduction = recommendations.length > 0 
    ? recommendations[0].expectedInfoGain 
    : 0;

  return {
    recommendations,
    currentEntropy,
    bestEntropyReduction: bestReduction
  };
}

/**
 * Select high-value cards for suggestion optimization.
 */
function selectHighValueCards(
  cards: readonly string[],
  probMatrix: ProbabilityMatrix,
  count: number
): string[] {
  // Score cards by uncertainty (middle probabilities are most valuable)
  const scored = cards.map(card => {
    const envProb = probMatrix[card]?.envelopeProbability || 0;
    // Value cards where we're uncertain
    const uncertaintyScore = 1 - Math.abs(2 * envProb - 1);
    // Also value cards that might be in envelope
    const potentialScore = envProb;
    return {
      card,
      score: uncertaintyScore * 0.7 + potentialScore * 0.3
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map(s => s.card);
}

/**
 * Select diverse suggestions to avoid redundancy.
 */
function selectDiverseSuggestions(
  analyses: SuggestionAnalysis[],
  count: number
): SuggestionAnalysis[] {
  const selected: SuggestionAnalysis[] = [];
  const usedCards = new Set<string>();

  for (const analysis of analyses) {
    if (selected.length >= count) break;

    // Check for diversity
    const cards = [analysis.suspect, analysis.weapon, analysis.room];
    const overlap = cards.filter(c => usedCards.has(c)).length;

    // Allow up to 1 overlapping card with previous selections
    if (overlap <= 1 || selected.length < 2) {
      selected.push(analysis);
      cards.forEach(c => usedCards.add(c));
    }
  }

  // Fill remaining with top picks if not enough diverse
  while (selected.length < count && selected.length < analyses.length) {
    const next = analyses.find(a => !selected.includes(a));
    if (next) selected.push(next);
    else break;
  }

  return selected;
}

/**
 * Get probability color for heatmap visualization.
 * Returns HSL color string from blue (low) to red (high).
 */
export function getProbabilityColor(probability: number): string {
  // probability 0 = cool (blue/gray), 1 = hot (red)
  // Using HSL: 0 = red, 240 = blue
  const hue = (1 - probability) * 240;
  const saturation = 20 + probability * 60;
  const lightness = 95 - probability * 30;
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Get a description of the probability level.
 */
export function getProbabilityLevel(probability: number): string {
  if (probability >= 0.9) return 'Extremely Likely';
  if (probability >= 0.7) return 'Very Likely';
  if (probability >= 0.5) return 'Likely';
  if (probability >= 0.3) return 'Possible';
  if (probability >= 0.1) return 'Unlikely';
  return 'Very Unlikely';
}

