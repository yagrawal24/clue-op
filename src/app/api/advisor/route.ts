import { NextRequest, NextResponse } from 'next/server';
import {
  KnowledgeMatrix,
  Suggestion,
  Deduction,
  Player,
  GAME_CONSTANTS,
  CardLink
} from '@/lib/types';

interface AdvisorRequestBody {
  knowledgeMatrix: KnowledgeMatrix;
  suggestions: Suggestion[];
  deductions: Deduction[];
  players: Player[];
  myPlayerId: string | null;
  cardLinks: CardLink[];
  solvedEnvelope: {
    suspect: string | null;
    weapon: string | null;
    room: string | null;
  };
  notes: string;
  currentTurn: number;
  customQuestion?: string;
}

function buildGameStateContext(data: AdvisorRequestBody): string {
  const myPlayer = data.players.find(p => p.id === data.myPlayerId);
  
  // Build a human-readable summary of the knowledge matrix
  const buildMatrixSummary = () => {
    const lines: string[] = [];
    
    // Cards confirmed in envelope
    const envelopeCards = Object.entries(data.knowledgeMatrix)
      .filter(([_, info]) => info.envelope?.state === 'envelope')
      .map(([card]) => card);
    
    if (envelopeCards.length > 0) {
      lines.push(`SOLVED ENVELOPE CARDS: ${envelopeCards.join(', ')}`);
    }
    
    // Cards ruled out from envelope
    const notEnvelopeCards = Object.entries(data.knowledgeMatrix)
      .filter(([_, info]) => info.envelope?.state === 'not_owned')
      .map(([card]) => card);
    
    // Cards still unknown for envelope
    const unknownEnvelopeCards = Object.entries(data.knowledgeMatrix)
      .filter(([_, info]) => info.envelope?.state === 'unknown')
      .map(([card]) => card);
    
    // Categorize by type
    const categorize = (cards: string[]) => ({
      suspects: cards.filter(c => GAME_CONSTANTS.SUSPECTS.includes(c as any)),
      weapons: cards.filter(c => GAME_CONSTANTS.WEAPONS.includes(c as any)),
      rooms: cards.filter(c => GAME_CONSTANTS.ROOMS.includes(c as any))
    });
    
    const unknown = categorize(unknownEnvelopeCards);
    lines.push(`\nPOSSIBLE SOLUTION CANDIDATES:`);
    lines.push(`  Suspects still possible: ${unknown.suspects.length > 0 ? unknown.suspects.join(', ') : 'NONE - already solved!'}`);
    lines.push(`  Weapons still possible: ${unknown.weapons.length > 0 ? unknown.weapons.join(', ') : 'NONE - already solved!'}`);
    lines.push(`  Rooms still possible: ${unknown.rooms.length > 0 ? unknown.rooms.join(', ') : 'NONE - already solved!'}`);
    
    // Per-player card ownership
    lines.push(`\nPLAYER CARD KNOWLEDGE:`);
    data.players.forEach(player => {
      const owned = Object.entries(data.knowledgeMatrix)
        .filter(([_, info]) => info[player.id]?.state === 'owned')
        .map(([card]) => card);
      
      const notOwned = Object.entries(data.knowledgeMatrix)
        .filter(([_, info]) => info[player.id]?.state === 'not_owned')
        .map(([card]) => card);
      
      const potentiallyOwned = Object.entries(data.knowledgeMatrix)
        .filter(([_, info]) => info[player.id]?.state === 'potentially_owned')
        .map(([card]) => card);
      
      const isMe = player.id === data.myPlayerId ? ' (YOU)' : '';
      lines.push(`\n  ${player.name}${isMe}:`);
      lines.push(`    Confirmed owns: ${owned.length > 0 ? owned.join(', ') : 'None confirmed'}`);
      if (potentiallyOwned.length > 0) {
        lines.push(`    Possibly owns: ${potentiallyOwned.join(', ')}`);
      }
      lines.push(`    Confirmed NOT owning: ${notOwned.length} cards`);
    });
    
    return lines.join('\n');
  };
  
  // Build suggestion history
  const buildSuggestionHistory = () => {
    if (data.suggestions.length === 0) return 'No suggestions recorded yet.';
    
    return data.suggestions.map(s => {
      const suggester = data.players.find(p => p.id === s.suggesterId)?.name || 'Unknown';
      const passed = s.passedPlayerIds.map(id => data.players.find(p => p.id === id)?.name).filter(Boolean);
      const shower = s.showerId ? data.players.find(p => p.id === s.showerId)?.name : null;
      
      let result = `Turn ${s.turnNumber}: ${suggester} suggested "${s.suspect} with ${s.weapon} in ${s.room}"`;
      if (passed.length > 0) {
        result += `\n    Passed (don't have any): ${passed.join(', ')}`;
      }
      if (shower) {
        result += `\n    ${shower} showed a card`;
        if (s.shownCard) {
          result += `: ${s.shownCard}`;
        } else {
          result += ' (unknown which one)';
        }
      } else if (s.passedPlayerIds.length === data.players.length - 1) {
        result += `\n    NO ONE could show a card!`;
      }
      return result;
    }).join('\n\n');
  };
  
  // Build unresolved links (cards someone has but we don't know which)
  const buildUnresolvedLinks = () => {
    const unresolvedLinks = data.cardLinks.filter(l => !l.resolved);
    if (unresolvedLinks.length === 0) return 'No unresolved card links.';
    
    return unresolvedLinks.map(link => {
      const player = data.players.find(p => p.id === link.playerId)?.name || 'Unknown';
      return `${player} has ONE OF: ${link.possibleCards.join(' OR ')} (from suggestion)`;
    }).join('\n');
  };
  
  // Build deductions log
  const buildDeductionsLog = () => {
    if (data.deductions.length === 0) return 'No deductions made yet.';
    
    // Get the last 15 deductions
    const recentDeductions = data.deductions.slice(-15);
    return recentDeductions.map(d => `- ${d.description}`).join('\n');
  };

  return `
=== CLUE GAME STATE ===

GAME INFO:
- Current Turn: ${data.currentTurn}
- Number of Players: ${data.players.length}
- Your Player: ${myPlayer?.name || 'Not set'}
- Players in turn order: ${data.players.map(p => p.name + (p.id === data.myPlayerId ? ' (YOU)' : '')).join(' → ')}

${data.solvedEnvelope.suspect && data.solvedEnvelope.weapon && data.solvedEnvelope.room 
  ? `🎯 SOLUTION FULLY DEDUCED: ${data.solvedEnvelope.suspect} with ${data.solvedEnvelope.weapon} in ${data.solvedEnvelope.room}!`
  : `PARTIAL SOLUTION: Suspect=${data.solvedEnvelope.suspect || '?'}, Weapon=${data.solvedEnvelope.weapon || '?'}, Room=${data.solvedEnvelope.room || '?'}`
}

${buildMatrixSummary()}

UNRESOLVED CARD LINKS (one-of constraints):
${buildUnresolvedLinks()}

SUGGESTION HISTORY:
${buildSuggestionHistory()}

RECENT DEDUCTIONS:
${buildDeductionsLog()}

${data.notes ? `\nPLAYER NOTES:\n${data.notes}` : ''}
`.trim();
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Gemini API key not configured. Please set GEMINI_API_KEY environment variable.' },
      { status: 500 }
    );
  }

  try {
    const body: AdvisorRequestBody = await request.json();
    const gameContext = buildGameStateContext(body);
    
    const systemInstruction = `You are an expert Clue (Cluedo) game strategist. You have deep knowledge of:
- Deduction logic and constraint satisfaction
- Optimal suggestion strategies
- Reading opponent behavior and detecting bluffs
- Probability calculations for unknown cards

Your goal is to help the player WIN by providing sharp, actionable advice. Be concise but thorough. Focus on what matters most right now.

Rules reminder:
- 21 cards total: 6 suspects, 6 weapons, 9 rooms
- 3 cards in envelope (the solution): 1 suspect, 1 weapon, 1 room
- Remaining 18 cards dealt to players
- When suggesting, players must show ONE card if they have any of the 3 suggested
- If a player passes, they have NONE of the 3 suggested cards
- First to correctly accuse wins; wrong accusation = elimination`;

    const userPrompt = body.customQuestion
      ? `${gameContext}\n\n---\n\nThe player asks: "${body.customQuestion}"\n\nProvide a direct, helpful answer to their question based on the game state above.`
      : `${gameContext}\n\n---\n\nBased on this game state, provide strategic advice:

1. **RECOMMENDED SUGGESTION**: What should I suggest on my next turn? Give the exact suspect, weapon, and room, with a brief explanation of WHY this combination maximizes information gain.

2. **KEY INSIGHT**: What's the single most important thing I should know right now? (e.g., a card that's definitely in the envelope, a player who's close to solving, a pattern I should notice)

3. **THREAT ASSESSMENT**: Is any opponent close to winning? What should I watch out for?

Be specific and actionable. No fluff.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [
            {
              parts: [{ text: userPrompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to get AI response. Please try again.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Advisor API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

