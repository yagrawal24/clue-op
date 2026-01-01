'use client';

import { useState, useMemo } from 'react';
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
  Trash2,
  AlertCircle,
  Flame,
  Thermometer
} from 'lucide-react';
import {
  KnowledgeMatrix,
  Player,
  PlayerCardKnowledge,
  GAME_CONSTANTS,
  CardType,
  CardLink,
  ProbabilityMatrix,
  getAllCards
} from '@/lib/types';
import { ConfirmationDialog } from '@/components/ui/confirm-dialog';
import { calculateProbabilities, getProbabilityColor } from '@/lib/probabilityEngine';

interface MasterMatrixProps {
  knowledgeMatrix: KnowledgeMatrix;
  players: Player[];
  myPlayerId: string | null;
  cardLinks?: CardLink[];
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
  onClearRequest?: (cardName: string) => void;
  showHeatmap?: boolean;
  probMatrix?: ProbabilityMatrix;
}

const CardRow = ({ cardName, cardType, matrix, players, myPlayerId, onCellClick, onClearRequest, showHeatmap, probMatrix }: CardRowProps) => {
  const cardData = matrix[cardName];
  if (!cardData) return null;

  // Check if this row has any non-unknown states (can be cleared)
  const hasAnyData = cardData.envelope?.state !== 'unknown' || 
    players.some(p => cardData[p.id]?.state !== 'unknown');

  // Get probability data for this card
  const cardProb = probMatrix?.[cardName];
  const envelopeProb = cardProb?.envelopeProbability || 0;

  // Get heatmap background for envelope cell
  const getHeatmapBg = (probability: number) => {
    if (!showHeatmap || probability <= 0) return '';
    return getProbabilityColor(probability);
  };

  return (
    <tr className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors group">
      <td className="py-1 sm:py-1.5 px-2 pl-3 text-[10px] sm:text-xs font-bold text-gray-700 sticky left-0 bg-white z-10 border-r border-gray-100 shadow-[1px_0_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="truncate flex-1 group-hover:text-indigo-600 transition-colors">{cardName}</span>
          {/* Probability badge */}
          {showHeatmap && envelopeProb > 0.05 && cardData.envelope?.state !== 'envelope' && (
            <span 
              className="text-[8px] font-bold px-1 py-0.5 rounded-full flex-shrink-0 tabular-nums"
              style={{ 
                backgroundColor: getProbabilityColor(envelopeProb),
                color: envelopeProb > 0.5 ? '#fff' : '#374151'
              }}
              title={`${(envelopeProb * 100).toFixed(0)}% chance in envelope`}
            >
              {(envelopeProb * 100).toFixed(0)}%
            </span>
          )}
          {hasAnyData && onClearRequest && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearRequest(cardName);
              }}
              className="opacity-40 sm:opacity-0 group-hover:opacity-100 transition-all ml-auto p-1 hover:bg-red-50 rounded-full text-red-400 hover:text-red-600 flex-shrink-0 border border-transparent hover:border-red-100 active:scale-90"
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
        const playerProb = cardProb?.playerProbabilities[player.id] || 0;

        return (
          <td key={player.id} className="py-0.5 sm:py-1 px-0.5 sm:px-1 text-center">
            <div className="relative">
              <button
                onClick={() => onCellClick(cardName, player.id, cellData.state)}
                className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded sm:rounded-md border flex items-center justify-center transition-all duration-150 flex-shrink-0 mx-auto touch-manipulation active:scale-95 ${getCellBg(cellData.state, isMe)} ${isMe ? 'ring-2 ring-blue-500' : ''}`}
                style={showHeatmap && cellData.state === 'unknown' && playerProb > 0.05 ? {
                  backgroundColor: getHeatmapBg(playerProb),
                  borderColor: playerProb > 0.3 ? `hsl(${(1 - playerProb) * 240}, 60%, 50%)` : undefined
                } : undefined}
                title={`${cardName} - ${player.name}: ${cellData.state}${showHeatmap ? ` (${(playerProb * 100).toFixed(0)}%)` : ''}`}
              >
                {getCellIcon(cellData.state, isMe)}
              </button>
              {/* Mini probability indicator */}
              {showHeatmap && cellData.state === 'unknown' && playerProb > 0.2 && (
                <span 
                  className="absolute -bottom-1 -right-1 text-[6px] font-bold px-0.5 rounded bg-gray-800 text-white"
                >
                  {(playerProb * 100).toFixed(0)}
                </span>
              )}
            </div>
          </td>
        );
      })}
      <td className="py-0.5 sm:py-1 px-0.5 sm:px-1 text-center border-l border-gray-200">
        <div className="relative">
          <button
            onClick={() => onCellClick(cardName, 'envelope', cardData.envelope?.state || 'unknown')}
            className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded sm:rounded-md border flex items-center justify-center transition-all duration-150 flex-shrink-0 mx-auto touch-manipulation active:scale-95 ${getCellBg(cardData.envelope?.state || 'unknown', false)}`}
            style={showHeatmap && cardData.envelope?.state === 'unknown' && envelopeProb > 0.1 ? {
              backgroundColor: getHeatmapBg(envelopeProb),
              borderColor: envelopeProb > 0.3 ? `hsl(${(1 - envelopeProb) * 240}, 70%, 45%)` : undefined,
              boxShadow: envelopeProb > 0.5 ? `0 0 8px ${getProbabilityColor(envelopeProb)}` : undefined
            } : undefined}
            title={`${cardName} - Envelope: ${cardData.envelope?.state || 'unknown'}${showHeatmap ? ` (${(envelopeProb * 100).toFixed(0)}%)` : ''}`}
          >
            {getCellIcon(cardData.envelope?.state || 'unknown', false)}
          </button>
          {/* Probability flame indicator for high envelope probability */}
          {showHeatmap && envelopeProb > 0.4 && cardData.envelope?.state !== 'envelope' && (
            <Flame 
              className="absolute -top-1 -right-1 w-3 h-3 text-orange-500 animate-pulse" 
              style={{ filter: `drop-shadow(0 0 2px ${getProbabilityColor(envelopeProb)})` }}
            />
          )}
        </div>
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
  onClearRequest?: (cardName: string) => void;
  color: string;
  defaultExpanded?: boolean;
  showHeatmap?: boolean;
  probMatrix?: ProbabilityMatrix;
}

const CardSection = ({ 
  title, 
  cards, 
  cardType, 
  matrix, 
  players, 
  myPlayerId, 
  onCellClick,
  onClearRequest,
  color,
  defaultExpanded = true,
  showHeatmap,
  probMatrix
}: CardSectionProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  // Count stats
  const envelopeCount = cards.filter(c => matrix[c]?.envelope?.state === 'envelope').length;
  const unknownCount = cards.filter(c => matrix[c]?.envelope?.state === 'unknown').length;
  
  // Calculate highest probability card for this category
  const highestProbCard = useMemo(() => {
    if (!showHeatmap || !probMatrix) return null;
    let best = { card: '', prob: 0 };
    cards.forEach(c => {
      const prob = probMatrix[c]?.envelopeProbability || 0;
      if (prob > best.prob && matrix[c]?.envelope?.state !== 'envelope') {
        best = { card: c, prob };
      }
    });
    return best.prob > 0.2 ? best : null;
  }, [cards, probMatrix, showHeatmap, matrix]);
  
  return (
    <div className="mb-2 sm:mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl ${color} shadow-sm border-b-4 border-black/10 active:translate-y-0.5 active:border-b-0 transition-all duration-100`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-white/20 p-1 rounded-lg">
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-white" /> : <ChevronDown className="w-3.5 h-3.5 text-white" />}
          </div>
          <span className="uppercase font-black text-xs sm:text-sm tracking-[0.15em] text-white drop-shadow-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Highest probability indicator */}
          {showHeatmap && highestProbCard && (
            <Badge className="bg-orange-500/90 text-white border-0 text-[10px] px-2 py-0.5 font-bold backdrop-blur-sm animate-pulse">
              <Flame className="w-3 h-3 mr-1" />
              {(highestProbCard.prob * 100).toFixed(0)}%
            </Badge>
          )}
          {envelopeCount > 0 && (
            <Badge className="bg-white/30 text-white border-0 text-[10px] px-2 py-0.5 font-bold backdrop-blur-sm">
              <Crown className="w-3 h-3 mr-1" />
              {envelopeCount}
            </Badge>
          )}
          <Badge className="bg-black/10 text-white border-0 text-[10px] px-2 py-0.5 font-bold">
            {unknownCount} <span className="hidden sm:inline ml-1">UNKNOWN</span>
          </Badge>
        </div>
      </button>
      
      {expanded && (
        <div className="mt-1 bg-white border-2 border-gray-100 rounded-xl overflow-x-auto shadow-inner pr-1">
          <table className="w-full table-fixed">
            <colgroup>
              <col style={{ width: '100px', minWidth: '100px' }} />
              {players.map((_, idx) => (
                <col key={`player-col-${idx}`} style={{ width: '36px', minWidth: '36px' }} />
              ))}
              <col style={{ width: '36px', minWidth: '36px' }} />
            </colgroup>
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
                  onClearRequest={onClearRequest}
                  showHeatmap={showHeatmap}
                  probMatrix={probMatrix}
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
  cardLinks = [],
  onCellClick,
  onClearCardRow
}: MasterMatrixProps) => {
  const [confirmClear, setConfirmClear] = useState<{ isOpen: boolean; cardName: string }>({
    isOpen: false,
    cardName: ''
  });
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Calculate probability matrix
  const probMatrix = useMemo(() => {
    if (Object.keys(knowledgeMatrix).length === 0) return null;
    return calculateProbabilities(knowledgeMatrix, players, cardLinks);
  }, [knowledgeMatrix, players, cardLinks]);

  const handleCellClick = (cardName: string, target: string | 'envelope', currentState: CellState) => {
    const nextState = getNextState(currentState, target === 'envelope');
    // Create deductions when user is making an active choice (changing from unknown or overriding existing state)
    // Don't create deductions for simple cycling through states when exploring
    const shouldCreateDeduction = currentState !== 'unknown' || nextState === 'owned' || nextState === 'envelope';
    onCellClick(cardName, target, nextState, shouldCreateDeduction);
  };

  const handleClearRequest = (cardName: string) => {
    setConfirmClear({ isOpen: true, cardName });
  };

  const executeClear = () => {
    if (onClearCardRow && confirmClear.cardName) {
      onClearCardRow(confirmClear.cardName);
    }
  };

  if (Object.keys(knowledgeMatrix).length === 0) {
    return (
      <Card className="bg-white border-2 border-gray-200 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="py-16 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Grid3X3 className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-400 font-bold text-lg">Waiting for the mystery to begin...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white border-2 border-gray-200 overflow-hidden max-w-full shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl">
        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-5 flex-shrink-0 bg-gray-50/50 border-b">
          <CardTitle className="text-base sm:text-lg md:text-xl font-black flex items-center gap-3 min-w-0 text-gray-800 tracking-tight">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-100 transition-transform hover:rotate-6">
              <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="truncate">Master Knowledge Matrix</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Bayesian Inference Engine</span>
            </div>
            {/* Heatmap Toggle */}
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                showHeatmap 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-200' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={showHeatmap ? 'Hide probability heatmap' : 'Show probability heatmap'}
            >
              <Thermometer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{showHeatmap ? 'Heatmap ON' : 'Heatmap'}</span>
              {showHeatmap && <Flame className="w-3 h-3 animate-pulse" />}
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto max-w-full">
          {/* Header - Scrollable with players */}
          <div className="overflow-x-auto overflow-y-visible scrollbar-hide pr-2 sm:pr-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Calculate minimum width based on number of players */}
            <div style={{ minWidth: `${Math.max(300, 100 + (players.length + 1) * 36)}px` }}>
                {/* Player header row */}
                <div className="sticky top-0 bg-white border-b-2 border-gray-100 z-20 shadow-sm">
                  <table className="w-full table-fixed">
                    <colgroup>
                      <col style={{ width: '100px', minWidth: '100px' }} />
                      {players.map((_, idx) => (
                        <col key={`player-col-${idx}`} style={{ width: '36px', minWidth: '36px' }} />
                      ))}
                      <col style={{ width: '36px', minWidth: '36px' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="py-3 px-3 pl-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] sticky left-0 bg-white z-30 border-r border-gray-50">
                          <div className="truncate">Cards</div>
                        </th>
                        {players.map(player => {
                          // Calculate owned cards for this player
                          const allCards = getAllCards();
                          const ownedCount = allCards.filter(
                            card => knowledgeMatrix[card.name]?.[player.id]?.state === 'owned'
                          ).length;
                          const cardCount = player.cardCount || '?';
                          
                          return (
                            <th
                              key={player.id}
                              className="py-2 px-0.5"
                            >
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                <div
                                  className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white flex-shrink-0 shadow-sm transition-transform hover:scale-110 ${player.id === myPlayerId ? 'ring-2 ring-blue-500 ring-offset-1' : 'border border-white/20'}`}
                                  style={{ backgroundColor: player.color }}
                                  title={`${player.name} (${ownedCount}/${cardCount} cards known)`}
                                >
                                  {player.name[0]}
                                </div>
                                <span 
                                  className={`text-[8px] sm:text-[9px] font-bold tabular-nums ${
                                    ownedCount === cardCount 
                                      ? 'text-emerald-600' 
                                      : ownedCount > 0 
                                        ? 'text-amber-600' 
                                        : 'text-gray-400'
                                  }`}
                                  title={`${ownedCount} of ${cardCount} cards identified`}
                                >
                                  {ownedCount}/{cardCount}
                                </span>
                              </div>
                            </th>
                          );
                        })}
                        <th className="py-2 px-0.5 border-l-2 border-gray-50">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm transition-transform hover:scale-110">
                              <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" strokeWidth={2.5} />
                            </div>
                          </div>
                        </th>
                      </tr>
                    </thead>
                  </table>
                </div>

                {/* Card sections */}
                <div className="p-2 sm:p-4 space-y-3 sm:space-y-6">
                  <CardSection
                    title="SUSPECTS"
                    cards={[...GAME_CONSTANTS.SUSPECTS]}
                    cardType="suspect"
                    matrix={knowledgeMatrix}
                    players={players}
                    myPlayerId={myPlayerId}
                    onCellClick={handleCellClick}
                    onClearRequest={handleClearRequest}
                    color="bg-rose-500"
                    showHeatmap={showHeatmap}
                    probMatrix={probMatrix || undefined}
                  />
                  
                  <CardSection
                    title="WEAPONS"
                    cards={[...GAME_CONSTANTS.WEAPONS]}
                    cardType="weapon"
                    matrix={knowledgeMatrix}
                    players={players}
                    myPlayerId={myPlayerId}
                    onCellClick={handleCellClick}
                    onClearRequest={handleClearRequest}
                    color="bg-blue-500"
                    showHeatmap={showHeatmap}
                    probMatrix={probMatrix || undefined}
                  />
                  
                  <CardSection
                    title="ROOMS"
                    cards={[...GAME_CONSTANTS.ROOMS]}
                    cardType="room"
                    matrix={knowledgeMatrix}
                    players={players}
                    myPlayerId={myPlayerId}
                    onCellClick={handleCellClick}
                    onClearRequest={handleClearRequest}
                    color="bg-emerald-500"
                    showHeatmap={showHeatmap}
                    probMatrix={probMatrix || undefined}
                />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="px-3 sm:px-6 pb-4 sm:pb-8 mt-4 space-y-4">
            <div className="bg-gray-50/50 rounded-2xl p-3 sm:p-5 border border-gray-100 shadow-inner">
              <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                Matrix Legend
              </h4>
              <div className="grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-6 text-[10px] sm:text-xs">
                <div className="flex items-center gap-2.5 group cursor-default">
                  <div className="w-8 h-8 rounded-xl border-2 bg-white border-gray-100 flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 group-hover:border-gray-200 shadow-sm">
                    <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-200" />
                  </div>
                  <span className="font-bold text-gray-400 truncate">Unknown</span>
                </div>
                <div className="flex items-center gap-2.5 group cursor-default">
                  <div className="w-8 h-8 rounded-xl border-2 bg-emerald-50 border-emerald-100 flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 group-hover:bg-emerald-100 shadow-sm">
                    <Check className="w-4 h-4 text-emerald-600" strokeWidth={3} />
                  </div>
                  <span className="font-bold text-gray-600 truncate">Owned</span>
                </div>
                <div className="flex items-center gap-2.5 group cursor-default">
                  <div className="w-8 h-8 rounded-xl border-2 bg-red-50 border-red-100 flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 group-hover:bg-red-100 shadow-sm">
                    <X className="w-4 h-4 text-red-500" strokeWidth={3} />
                  </div>
                  <span className="font-bold text-gray-600 truncate">Not Owned</span>
                </div>
                <div className="flex items-center gap-2.5 group cursor-default">
                  <div className="w-8 h-8 rounded-xl border-2 bg-amber-50 border-amber-100 flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 group-hover:bg-amber-100 shadow-sm">
                    <Link2 className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="font-bold text-gray-600 truncate">Maybe</span>
                </div>
                <div className="flex items-center gap-2.5 group cursor-default">
                  <div className="w-8 h-8 rounded-xl border-2 bg-amber-50 border-amber-200 flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 group-hover:bg-amber-200 shadow-sm">
                    <Crown className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="font-bold text-gray-600 truncate">Envelope</span>
                </div>
              </div>
            </div>

            {/* Probability Heatmap Legend */}
            {showHeatmap && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-3 sm:p-5 border border-orange-100 shadow-inner">
                <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-orange-600 mb-4 flex items-center gap-2">
                  <Thermometer className="w-3 h-3" />
                  Probability Heatmap
                </h4>
                <div className="space-y-3">
                  {/* Gradient bar */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-500">0%</span>
                    <div 
                      className="flex-1 h-4 rounded-full shadow-inner"
                      style={{
                        background: 'linear-gradient(to right, hsl(240, 20%, 95%), hsl(180, 40%, 85%), hsl(120, 50%, 80%), hsl(60, 60%, 75%), hsl(30, 70%, 70%), hsl(0, 80%, 65%))'
                      }}
                    />
                    <span className="text-[10px] font-bold text-gray-500">100%</span>
                  </div>
                  {/* Indicators */}
                  <div className="flex flex-wrap items-center gap-4 text-[10px] sm:text-xs">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                      <span className="font-bold text-gray-600">High probability (&gt;40%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-bold px-1 py-0.5 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white">87%</span>
                      <span className="font-bold text-gray-600">Envelope likelihood</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={confirmClear.isOpen}
        onOpenChange={(open) => setConfirmClear(prev => ({ ...prev, isOpen: open }))}
        title="Clear Card Data"
        description={`Are you sure you want to clear all recorded information for "${confirmClear.cardName}"? This cannot be undone.`}
        onConfirm={executeClear}
        confirmText="Clear Data"
        variant="danger"
      />
    </>
  );
};


