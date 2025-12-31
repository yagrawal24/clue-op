'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  X,
  HelpCircle,
  Link2,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  KnowledgeMatrix,
  Player,
  PlayerCardKnowledge,
  CardType,
  getAllCards,
  getCardsByType
} from '@/lib/types';
import { useState } from 'react';

interface PlayerCardsViewProps {
  knowledgeMatrix: KnowledgeMatrix;
  players: Player[];
  myPlayerId: string | null;
}

interface PlayerCardSectionProps {
  title: string;
  cards: string[];
  color: string;
  defaultExpanded?: boolean;
}

const PlayerCardSection = ({ 
  title, 
  cards, 
  color, 
  defaultExpanded = true 
}: PlayerCardSectionProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg ${color} shadow-sm border-b-2 border-black/10 active:translate-y-0.5 active:border-b-0 transition-all duration-100`}
      >
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1 rounded">
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-white" /> : <ChevronDown className="w-3.5 h-3.5 text-white" />}
          </div>
          <span className="uppercase font-bold text-xs tracking-wide text-white">{title}</span>
        </div>
        <Badge className="bg-white/30 text-white border-0 text-[10px] px-2 py-0.5 font-bold">
          {cards.length}
        </Badge>
      </button>
      
      {expanded && cards.length > 0 && (
        <div className="mt-2 space-y-1">
          {cards.map(card => (
            <div
              key={card}
              className="px-3 py-2 bg-white rounded-md border border-gray-200 text-sm"
            >
              {card}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const PlayerCardsView = ({
  knowledgeMatrix,
  players,
  myPlayerId
}: PlayerCardsViewProps) => {
  const allCards = getAllCards();
  
  // Group cards by state for each player
  const getPlayerCards = (playerId: string) => {
    const owned: string[] = [];
    const potentiallyOwned: string[] = [];
    const notOwned: string[] = [];
    const unknown: string[] = [];
    
    allCards.forEach(card => {
      const cardData = knowledgeMatrix[card.name];
      if (!cardData) {
        unknown.push(card.name);
        return;
      }
      
      const playerData = cardData[playerId];
      const state = playerData?.state || 'unknown';
      
      switch (state) {
        case 'owned':
          owned.push(card.name);
          break;
        case 'potentially_owned':
          potentiallyOwned.push(card.name);
          break;
        case 'not_owned':
          notOwned.push(card.name);
          break;
        default:
          unknown.push(card.name);
      }
    });
    
    return { owned, potentiallyOwned, notOwned, unknown };
  };
  
  // Get cards by type for a specific state
  const getCardsByTypeAndState = (cards: string[], cardType: CardType) => {
    const typeCards = getCardsByType(cardType);
    return cards.filter(card => typeCards.includes(card));
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-gray-600" />
        <h2 className="text-xl font-bold text-gray-900">Player Cards</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {players.map(player => {
          const { owned, potentiallyOwned, notOwned, unknown } = getPlayerCards(player.id);
          const isMe = player.id === myPlayerId;
          const cardCount = player.cardCount;
          const confirmedCount = owned.length;
          
          return (
            <Card key={player.id} className={`${isMe ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.name[0]}
                    </div>
                    <CardTitle className="text-base font-bold">{player.name}</CardTitle>
                    {isMe && (
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">You</Badge>
                    )}
                  </div>
                </div>
                {cardCount && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                    <span className="font-medium">
                      Cards: {confirmedCount}/{cardCount}
                    </span>
                    {confirmedCount === cardCount && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                        Complete
                      </Badge>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Owned Cards */}
                {owned.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-gray-700">
                        Confirmed ({owned.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      <PlayerCardSection
                        title="Suspects"
                        cards={getCardsByTypeAndState(owned, 'suspect')}
                        color="bg-emerald-500"
                      />
                      <PlayerCardSection
                        title="Weapons"
                        cards={getCardsByTypeAndState(owned, 'weapon')}
                        color="bg-emerald-500"
                      />
                      <PlayerCardSection
                        title="Rooms"
                        cards={getCardsByTypeAndState(owned, 'room')}
                        color="bg-emerald-500"
                      />
                    </div>
                  </div>
                )}
                
                {/* Potentially Owned Cards */}
                {potentiallyOwned.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Link2 className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-semibold text-gray-700">
                        Possibly Owned ({potentiallyOwned.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      <PlayerCardSection
                        title="Suspects"
                        cards={getCardsByTypeAndState(potentiallyOwned, 'suspect')}
                        color="bg-amber-500"
                      />
                      <PlayerCardSection
                        title="Weapons"
                        cards={getCardsByTypeAndState(potentiallyOwned, 'weapon')}
                        color="bg-amber-500"
                      />
                      <PlayerCardSection
                        title="Rooms"
                        cards={getCardsByTypeAndState(potentiallyOwned, 'room')}
                        color="bg-amber-500"
                      />
                    </div>
                  </div>
                )}
                
                {/* Unknown Cards */}
                {unknown.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-700">
                        Unknown ({unknown.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      <PlayerCardSection
                        title="Suspects"
                        cards={getCardsByTypeAndState(unknown, 'suspect')}
                        color="bg-gray-500"
                        defaultExpanded={false}
                      />
                      <PlayerCardSection
                        title="Weapons"
                        cards={getCardsByTypeAndState(unknown, 'weapon')}
                        color="bg-gray-500"
                        defaultExpanded={false}
                      />
                      <PlayerCardSection
                        title="Rooms"
                        cards={getCardsByTypeAndState(unknown, 'room')}
                        color="bg-gray-500"
                        defaultExpanded={false}
                      />
                    </div>
                  </div>
                )}
                
                {/* Not Owned Cards - Show count only */}
                {notOwned.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-gray-600">
                        {notOwned.length} cards confirmed not owned
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Empty state */}
                {owned.length === 0 && potentiallyOwned.length === 0 && unknown.length === 0 && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    No card information available
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

