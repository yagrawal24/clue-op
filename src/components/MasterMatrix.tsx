'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  X,
  HelpCircle,
  Crown,
  Link2,
  Grid3X3,
  User,
  Lock,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';
import {
  KnowledgeMatrix,
  Player,
  PlayerCardKnowledge,
  GAME_CONSTANTS,
  CardType
} from '@/lib/types';

interface MasterMatrixProps {
  knowledgeMatrix: KnowledgeMatrix;
  players: Player[];
  myPlayerId: string | null;
  onCellClick: (cardName: string, target: string | 'envelope', state: PlayerCardKnowledge['state'], createDeduction?: boolean) => void;
  onClearCardRow?: (cardName: string) => void;
}

type CellState = PlayerCardKnowledge['state'];

const getCellIcon = (state: CellState, isMe: boolean) => {
  switch (state) {
    case 'owned':
      return <Check className="w-4 h-4 text-emerald-600" strokeWidth={3} />;
    case 'not_owned':
      return <X className="w-4 h-4 text-red-500" strokeWidth={3} />;
    case 'potentially_owned':
      return <Link2 className="w-4 h-4 text-amber-500" strokeWidth={2.5} />;
    case 'envelope':
      return <Crown className="w-4 h-4 text-amber-500" strokeWidth={2.5} />;
    default:
      return <HelpCircle className="w-3 h-3 text-gray-300" strokeWidth={2} />;
  }
};

const getCellBg = (state: CellState, isMe: boolean) => {
  switch (state) {
    case 'owned':
      return isMe ? 'bg-emerald-100 border-emerald-400' : 'bg-emerald-50 border-emerald-300';
    case 'not_owned':
      return 'bg-red-50 border-red-200';
    case 'potentially_owned':
      return 'bg-amber-50 border-amber-300';
    case 'envelope':
      return 'bg-amber-100 border-amber-400';
    default:
      return 'bg-white border-gray-200 hover:bg-gray-50';
  }
};

const getNextState = (currentState: CellState, isEnvelope: boolean): CellState => {
  if (isEnvelope) {
    // Envelope cycles: unknown -> envelope -> not_owned -> unknown
    switch (currentState) {
      case 'unknown': return 'envelope';
      case 'envelope': return 'not_owned';
      case 'not_owned': return 'unknown';
      default: return 'unknown';
    }
  }
  // Player cycles: unknown -> owned -> not_owned -> potentially_owned -> unknown
  switch (currentState) {
    case 'unknown': return 'owned';
    case 'owned': return 'not_owned';
    case 'not_owned': return 'potentially_owned';
    case 'potentially_owned': return 'unknown';
    default: return 'unknown';
  }
};

interface CardRowProps {
  cardName: string;
  cardType: CardType;
  matrix: KnowledgeMatrix;
  players: Player[];
  myPlayerId: string | null;
  onCellClick: MasterMatrixProps['onCellClick'];
  onClearCardRow?: MasterMatrixProps['onClearCardRow'];
}

const CardRow = ({ cardName, cardType, matrix, players, myPlayerId, onCellClick, onClearCardRow }: CardRowProps) => {
  const cardData = matrix[cardName];
  if (!cardData) return null;

  // Check if this row has any non-unknown states (can be cleared)
  const hasAnyData = cardData.envelope?.state !== 'unknown' || 
    players.some(p => cardData[p.id]?.state !== 'unknown');

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group">
      <td className="py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200 w-[100px] sm:w-[140px]">
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="truncate">{cardName}</span>
          {hasAnyData && onClearCardRow && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Clear all data for ${cardName}? This will reset it to unknown state.`)) {
                  onClearCardRow(cardName);
                }
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto p-0.5 sm:p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-700"
              title={`Clear ${cardName} row`}
            >
              <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </button>
          )}
        </div>
      </td>
      {players.map(player => {
        const cellData = cardData[player.id] || { state: 'unknown' };
        const isMe = player.id === myPlayerId;

        return (
          <td key={player.id} className="py-0.5 sm:py-1 px-0.5 sm:px-1 text-center w-8 sm:w-9 md:w-10">
            <button
              onClick={() => onCellClick(cardName, player.id, cellData.state)}
              className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-md sm:rounded-lg border-2 flex items-center justify-center transition-all duration-150 ${getCellBg(cellData.state, isMe)} ${isMe ? 'ring-1 sm:ring-2 ring-blue-200 ring-offset-1' : ''}`}
              title={`${cardName} - ${player.name}: ${cellData.state}`}
            >
              {getCellIcon(cellData.state, isMe)}
            </button>
          </td>
        );
      })}
      <td className="py-0.5 sm:py-1 px-0.5 sm:px-1 text-center border-l-2 border-gray-300 w-8 sm:w-9 md:w-10">
        <button
          onClick={() => onCellClick(cardName, 'envelope', cardData.envelope?.state || 'unknown')}
          className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-md sm:rounded-lg border-2 flex items-center justify-center transition-all duration-150 ${getCellBg(cardData.envelope?.state || 'unknown', false)}`}
          title={`${cardName} - Envelope: ${cardData.envelope?.state || 'unknown'}`}
        >
          {getCellIcon(cardData.envelope?.state || 'unknown', false)}
        </button>
      </td>
    </tr>
  );
};

interface CardSectionProps {
  title: string;
  cards: string[];
  cardType: CardType;
  matrix: KnowledgeMatrix;
  players: Player[];
  myPlayerId: string | null;
  onCellClick: MasterMatrixProps['onCellClick'];
  onClearCardRow?: MasterMatrixProps['onClearCardRow'];
  color: string;
  defaultExpanded?: boolean;
}

const CardSection = ({ 
  title, 
  cards, 
  cardType, 
  matrix, 
  players, 
  myPlayerId, 
  onCellClick,
  onClearCardRow,
  color,
  defaultExpanded = true 
}: CardSectionProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  // Count stats
  const envelopeCount = cards.filter(c => matrix[c]?.envelope?.state === 'envelope').length;
  const unknownCount = cards.filter(c => matrix[c]?.envelope?.state === 'unknown').length;
  
  return (
    <div className="mb-3 sm:mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-t-lg ${color} text-white font-bold text-xs sm:text-sm`}
      >
        <div className="flex items-center gap-1 sm:gap-2">
          {expanded ? <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />}
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs">
          {envelopeCount > 0 && (
            <Badge className="bg-white/20 text-white border-0 text-[9px] sm:text-xs px-1 sm:px-2">
              <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
              {envelopeCount}
            </Badge>
          )}
          <Badge className="bg-white/20 text-white border-0 text-[9px] sm:text-xs px-1 sm:px-2">
            <span className="hidden sm:inline">{unknownCount} unknown</span>
            <span className="sm:hidden">{unknownCount}</span>
          </Badge>
        </div>
      </button>
      
      {expanded && (
        <div className="border-x-2 border-b-2 border-gray-200 rounded-b-lg overflow-hidden">
          <table className="w-full">
            <tbody>
              {cards.map(cardName => (
                <CardRow
                  key={cardName}
                  cardName={cardName}
                  cardType={cardType}
                  matrix={matrix}
                  players={players}
                  myPlayerId={myPlayerId}
                  onCellClick={onCellClick}
                  onClearCardRow={onClearCardRow}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const MasterMatrix = ({ 
  knowledgeMatrix, 
  players, 
  myPlayerId, 
  onCellClick,
  onClearCardRow
}: MasterMatrixProps) => {
  const handleCellClick = (cardName: string, target: string | 'envelope', currentState: CellState) => {
    const nextState = getNextState(currentState, target === 'envelope');
    // Create deductions when user is making an active choice (changing from unknown or overriding existing state)
    // Don't create deductions for simple cycling through states when exploring
    const shouldCreateDeduction = currentState !== 'unknown' || nextState === 'owned' || nextState === 'envelope';
    onCellClick(cardName, target, nextState, shouldCreateDeduction);
  };

  if (Object.keys(knowledgeMatrix).length === 0) {
    return (
      <Card className="bg-white border-2 border-gray-200">
        <CardContent className="py-12 text-center">
          <Grid3X3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Start the game to see the matrix</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-2 border-gray-200">
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="text-base sm:text-xl font-bold flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="truncate">Master Matrix</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Header - Scrollable with players */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="min-w-[600px]">
            {/* Player header row */}
            <div className="sticky top-0 bg-gray-100 border-b-2 border-gray-200 z-20">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="py-2 sm:py-3 px-2 sm:px-3 text-left text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-100 z-30 w-[100px] sm:w-[140px] border-r border-gray-200">
                      Card
                    </th>
                    {players.map(player => (
                      <th
                        key={player.id}
                        className="py-0.5 sm:py-1 px-0.5 sm:px-1 text-center w-8 sm:w-9 md:w-10"
                      >
                        <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                          <div
                            className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white ${player.id === myPlayerId ? 'ring-1 sm:ring-2 ring-blue-400 ring-offset-1' : ''}`}
                            style={{ backgroundColor: player.color }}
                            title={player.name}
                          >
                            {player.name[0]}
                          </div>
                          {player.id === myPlayerId && (
                            <span className="text-[8px] sm:text-[10px] text-blue-600 font-bold">ME</span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="py-0.5 sm:py-1 px-0.5 sm:px-1 text-center border-l-2 border-gray-300 w-8 sm:w-9 md:w-10">
                      <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-amber-500 flex items-center justify-center">
                          <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" strokeWidth={2.5} />
                        </div>
                        <span className="text-[8px] sm:text-[10px] text-amber-600 font-bold">ENV</span>
                      </div>
                    </th>
                  </tr>
                </thead>
              </table>
            </div>

            {/* Card sections */}
            <div className="p-1.5 sm:p-2 md:p-4">
              <CardSection
                title="SUSPECTS"
                cards={[...GAME_CONSTANTS.SUSPECTS]}
                cardType="suspect"
                matrix={knowledgeMatrix}
                players={players}
                myPlayerId={myPlayerId}
                onCellClick={handleCellClick}
                onClearCardRow={onClearCardRow}
                color="bg-rose-500"
              />
              
              <CardSection
                title="WEAPONS"
                cards={[...GAME_CONSTANTS.WEAPONS]}
                cardType="weapon"
                matrix={knowledgeMatrix}
                players={players}
                myPlayerId={myPlayerId}
                onCellClick={handleCellClick}
                onClearCardRow={onClearCardRow}
                color="bg-blue-500"
              />
              
              <CardSection
                title="ROOMS"
                cards={[...GAME_CONSTANTS.ROOMS]}
                cardType="room"
                matrix={knowledgeMatrix}
                players={players}
                myPlayerId={myPlayerId}
                onCellClick={handleCellClick}
                onClearCardRow={onClearCardRow}
                color="bg-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="px-2 sm:px-4 pb-2 sm:pb-4">
          <div className="bg-gray-50 rounded-lg p-2 sm:p-3 md:p-4">
            <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 sm:mb-3">Legend</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2 md:gap-3 text-[10px] sm:text-xs">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded border-2 bg-white border-gray-200 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-300" />
                </div>
                <span className="font-medium text-gray-600 truncate">Unknown</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded border-2 bg-emerald-50 border-emerald-300 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" strokeWidth={3} />
                </div>
                <span className="font-medium text-gray-600 truncate">Owned</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded border-2 bg-red-50 border-red-200 flex items-center justify-center flex-shrink-0">
                  <X className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" strokeWidth={3} />
                </div>
                <span className="font-medium text-gray-600 truncate">Not Owned</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded border-2 bg-amber-50 border-amber-300 flex items-center justify-center flex-shrink-0">
                  <Link2 className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                </div>
                <span className="font-medium text-gray-600 truncate">Maybe</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded border-2 bg-amber-100 border-amber-400 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                </div>
                <span className="font-medium text-gray-600 truncate">Envelope</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

