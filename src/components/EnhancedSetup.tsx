'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Minus,
  Users,
  Shuffle,
  GripVertical,
  Check,
  User,
  Crown,
  Hand,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Player, GAME_CONSTANTS } from '@/lib/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface EnhancedSetupProps {
  players: Player[];
  myPlayerId: string | null;
  firstPlayerId: string | null;
  onAddPlayer: (name: string) => void;
  onRemovePlayer: (playerId: string) => void;
  onReorderPlayers: (players: Player[]) => void;
  onSetMyPlayer: (playerId: string | null) => void;
  onSetFirstPlayer: (playerId: string | null) => void;
  onSetMyCards: (cardNames: string[]) => void;
  onStartGame: () => void;
}

interface SortablePlayerItemProps {
  player: Player;
  index: number;
  isMe: boolean;
  isFirst: boolean;
  onRemove: (playerId: string) => void;
  onSetMe: (playerId: string | null) => void;
  onSetFirst: (playerId: string | null) => void;
}

const SortablePlayerItem = ({
  player,
  index,
  isMe,
  isFirst,
  onRemove,
  onSetMe,
  onSetFirst
}: SortablePlayerItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 sm:p-4 rounded-lg bg-white border-2 transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-105 border-blue-400' : 'hover:border-blue-400'
      } ${isMe ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
    >
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1.5 sm:p-2 hover:bg-gray-100 rounded-md transition-colors touch-none flex-shrink-0"
        >
          <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" strokeWidth={2} />
        </div>
        <div
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-white flex-shrink-0"
          style={{ backgroundColor: player.color }}
        >
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-sm sm:text-lg block truncate">{player.name}</span>
          <div className="flex gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
            {isMe && (
              <Badge className="bg-blue-500 text-white border-0 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5">You</Badge>
            )}
            {isFirst && (
              <Badge className="bg-amber-500 text-white border-0 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5">First</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-wrap sm:flex-nowrap">
        <Button
          variant={isMe ? "default" : "outline"}
          size="sm"
          onClick={() => onSetMe(isMe ? null : player.id)}
          className={`h-8 px-2 sm:px-3 text-xs sm:text-sm ${isMe ? "bg-blue-500 hover:bg-blue-600" : ""}`}
          title={isMe ? "Click to unset" : "Set as me"}
        >
          <User className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
          <span className="hidden sm:inline">{isMe ? "You" : "Set as Me"}</span>
        </Button>
        <Button
          variant={isFirst ? "default" : "outline"}
          size="sm"
          onClick={() => onSetFirst(isFirst ? null : player.id)}
          className={`h-8 px-2 sm:px-3 text-xs sm:text-sm ${isFirst ? "bg-amber-500 hover:bg-amber-600" : ""}`}
          title={isFirst ? "Click to unset" : "Set as first player"}
        >
          <Crown className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
          <span className="hidden sm:inline">{isFirst ? "First" : "Goes First"}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(player.id)}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2"
        >
          <Minus className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
        </Button>
      </div>
    </div>
  );
};

// Card selection component
interface CardSelectorProps {
  title: string;
  cards: string[];
  selectedCards: string[];
  onToggleCard: (card: string) => void;
  color: string;
}

const CardSelector = ({ title, cards, selectedCards, onToggleCard, color }: CardSelectorProps) => (
  <div>
    <h4 className={`text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-3 ${color}`}>{title}</h4>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2">
      {cards.map(card => {
        const isSelected = selectedCards.includes(card);
        return (
          <button
            key={card}
            onClick={() => onToggleCard(card)}
            className={`p-2 sm:p-3 rounded-lg border-2 transition-all duration-200 text-left touch-manipulation active:scale-95 ${
              isSelected
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              }`}>
                {isSelected && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" strokeWidth={3} />}
              </div>
              <span className={`text-xs sm:text-sm font-medium leading-tight ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                {card}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

export const EnhancedSetup = ({
  players,
  myPlayerId,
  firstPlayerId,
  onAddPlayer,
  onRemovePlayer,
  onReorderPlayers,
  onSetMyPlayer,
  onSetFirstPlayer,
  onSetMyCards,
  onStartGame
}: EnhancedSetupProps) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [step, setStep] = useState<'players' | 'cards'>('players');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate expected card count
  const expectedCardCount = useMemo(() => {
    const numPlayers = players.length;
    if (numPlayers < 3) return 0;
    // 21 cards total, 3 in envelope = 18 distributed
    return Math.floor(18 / numPlayers);
  }, [players.length]);

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      onAddPlayer(newPlayerName.trim());
      setNewPlayerName('');
    }
  };

  const shufflePlayers = () => {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    onReorderPlayers(shuffled);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = players.findIndex((player) => player.id === active.id);
      const newIndex = players.findIndex((player) => player.id === over.id);
      const newPlayers = arrayMove(players, oldIndex, newIndex);
      onReorderPlayers(newPlayers);
    }
  };

  const handleToggleCard = (card: string) => {
    setSelectedCards(prev =>
      prev.includes(card)
        ? prev.filter(c => c !== card)
        : [...prev, card]
    );
  };

  const handleStartGame = () => {
    if (selectedCards.length > 0) {
      onSetMyCards(selectedCards);
    }
    onStartGame();
  };

  const canProceedToCards = players.length >= 3 && players.length <= 6 && myPlayerId && firstPlayerId;
  const canStartGame = canProceedToCards && selectedCards.length >= 3;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <button
          onClick={() => setStep('players')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all text-xs sm:text-base touch-manipulation active:scale-95 ${
            step === 'players'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Users className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden min-[360px]:inline">1. Players</span>
          <span className="min-[360px]:hidden">1</span>
        </button>
        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
        <button
          onClick={() => canProceedToCards && setStep('cards')}
          disabled={!canProceedToCards}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all text-xs sm:text-base touch-manipulation active:scale-95 ${
            step === 'cards'
              ? 'bg-blue-500 text-white'
              : canProceedToCards
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Hand className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden min-[360px]:inline">2. Your Cards</span>
          <span className="min-[360px]:hidden">2</span>
        </button>
      </div>

      {step === 'players' && (
        <>
          {/* Add Player */}
          <Card className="bg-white border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                Add Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Label htmlFor="player-name" className="text-sm font-semibold mb-2 block">
                    Player Name
                  </Label>
                  <Input
                    id="player-name"
                    type="text"
                    placeholder="Enter player name..."
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleAddPlayer}
                    disabled={!newPlayerName.trim() || players.length >= 6}
                    className="w-full sm:w-auto touch-manipulation active:scale-95 transition-transform"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Player
                  </Button>
                </div>
              </div>
              {players.length >= 6 && (
                <div className="mt-4 p-3 rounded-md bg-red-50 border-2 border-red-200">
                  <p className="text-sm text-red-600 font-medium">
                    Maximum of 6 players reached
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Player List */}
          {players.length > 0 && (
            <Card className="bg-white border-2 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  Player Order ({players.length}/6)
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shufflePlayers}
                  disabled={players.length < 2}
                  className="touch-manipulation active:scale-95 transition-transform"
                >
                  <Shuffle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Shuffle</span>
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Drag to reorder. Set yourself and who goes first.
                </p>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={players.map(player => player.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {players.map((player, index) => (
                        <SortablePlayerItem
                          key={player.id}
                          player={player}
                          index={index}
                          isMe={player.id === myPlayerId}
                          isFirst={player.id === firstPlayerId}
                          onRemove={onRemovePlayer}
                          onSetMe={onSetMyPlayer}
                          onSetFirst={onSetFirstPlayer}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {/* Validation Messages */}
                <div className="mt-6 space-y-3">
                  {players.length < 3 && (
                    <div className="p-4 rounded-lg bg-amber-50 border-2 border-amber-200 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      <p className="text-sm text-amber-800 font-medium">
                        Add {3 - players.length} more player{3 - players.length !== 1 ? 's' : ''} (minimum 3 required)
                      </p>
                    </div>
                  )}
                  {!myPlayerId && players.length >= 3 && (
                    <div className="p-4 rounded-lg bg-blue-50 border-2 border-blue-200 flex items-center gap-3">
                      <User className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <p className="text-sm text-blue-800 font-medium">
                        Click "Set as Me" on your player
                      </p>
                    </div>
                  )}
                  {!firstPlayerId && players.length >= 3 && (
                    <div className="p-4 rounded-lg bg-amber-50 border-2 border-amber-200 flex items-center gap-3">
                      <Crown className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      <p className="text-sm text-amber-800 font-medium">
                        Click "Goes First" to set turn order
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Continue Button */}
          {canProceedToCards && (
            <div className="flex justify-center">
              <Button
                onClick={() => setStep('cards')}
                size="lg"
                className="text-base sm:text-lg px-8 sm:px-12 h-12 sm:h-14 touch-manipulation active:scale-95 transition-transform"
              >
                Continue to Your Cards
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
            </div>
          )}
        </>
      )}

      {step === 'cards' && (
        <>
          {/* My Cards Selection */}
          <Card className="bg-white border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                  <Hand className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                Your Cards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Select the cards in your hand.</strong> Each player should have approximately {expectedCardCount} cards.
                  You've selected <strong>{selectedCards.length}</strong> cards.
                </p>
              </div>

              <CardSelector
                title="Suspects"
                cards={GAME_CONSTANTS.SUSPECTS as unknown as string[]}
                selectedCards={selectedCards}
                onToggleCard={handleToggleCard}
                color="text-rose-600"
              />

              <CardSelector
                title="Weapons"
                cards={GAME_CONSTANTS.WEAPONS as unknown as string[]}
                selectedCards={selectedCards}
                onToggleCard={handleToggleCard}
                color="text-blue-600"
              />

              <CardSelector
                title="Rooms"
                cards={GAME_CONSTANTS.ROOMS as unknown as string[]}
                selectedCards={selectedCards}
                onToggleCard={handleToggleCard}
                color="text-emerald-600"
              />

              {/* Selected Cards Summary */}
              {selectedCards.length > 0 && (
                <div className="p-4 rounded-lg bg-gray-50 border-2 border-gray-200">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gray-600 mb-3">
                    Your Hand ({selectedCards.length} cards)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCards.map(card => (
                      <Badge
                        key={card}
                        className="bg-blue-500 text-white border-0 cursor-pointer hover:bg-blue-600"
                        onClick={() => handleToggleCard(card)}
                      >
                        {card} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
            <Button
              variant="outline"
              onClick={() => setStep('players')}
              size="lg"
              className="touch-manipulation active:scale-95 transition-transform"
            >
              Back to Players
            </Button>
            <Button
              onClick={handleStartGame}
              disabled={selectedCards.length < 3}
              size="lg"
              className="text-base sm:text-lg px-8 sm:px-12 h-12 sm:h-14 touch-manipulation active:scale-95 transition-transform"
            >
              Start Game
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </Button>
          </div>

          {selectedCards.length < 3 && (
            <p className="text-center text-sm text-amber-600 font-medium">
              Select at least 3 cards to continue
            </p>
          )}
        </>
      )}
    </div>
  );
};

