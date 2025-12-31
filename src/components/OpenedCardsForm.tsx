'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, User, Eye } from 'lucide-react';
import { KnowledgeMatrix, Player, GAME_CONSTANTS } from '@/lib/types';

interface OpenedCardsFormProps {
  players: Player[];
  knowledgeMatrix: KnowledgeMatrix;
  onSubmit: (cardNames: string[], playerId?: string) => void;
  onCancel: () => void;
}

export const OpenedCardsForm = ({
  players,
  knowledgeMatrix,
  onSubmit,
  onCancel
}: OpenedCardsFormProps) => {
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('none');

  // Group cards by type
  const cardsByType = {
    suspects: [...GAME_CONSTANTS.SUSPECTS],
    weapons: [...GAME_CONSTANTS.WEAPONS],
    rooms: [...GAME_CONSTANTS.ROOMS]
  };

  const handleCardToggle = (cardName: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardName)) {
      newSelected.delete(cardName);
    } else {
      newSelected.add(cardName);
    }
    setSelectedCards(newSelected);
  };

  const handleSubmit = () => {
    if (selectedCards.size > 0) {
      const playerId = selectedPlayerId === 'none' ? undefined : selectedPlayerId;
      onSubmit(Array.from(selectedCards), playerId);
      setSelectedCards(new Set());
      setSelectedPlayerId('none');
    }
  };

  const CardGroup = ({ title, cards }: { title: string; cards: string[] }) => (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {cards.map(cardName => {
          const isSelected = selectedCards.has(cardName);
          const cardInfo = knowledgeMatrix[cardName];
          
          // Check if card is already definitively placed
          const isEnvelope = cardInfo?.envelope?.state === 'envelope';
          const isOwned = players.some(p => cardInfo?.[p.id]?.state === 'owned');
          const isDefinitelyPlaced = isEnvelope || isOwned;

          if (isDefinitelyPlaced) return null;

          return (
            <Button
              key={cardName}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => handleCardToggle(cardName)}
              className={`justify-start text-left h-auto py-2 px-3 ${isSelected ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
            >
              <div className="flex items-center gap-2">
                {isSelected && <Check className="w-3 h-3" />}
                <span className="text-xs">{cardName}</span>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Player selection */}
      <div>
        <Label className="text-sm font-medium mb-2 block">
          Card Owner (Optional)
        </Label>
        <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select owner..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-500" />
                <span>No owner (revealed/open card)</span>
              </div>
            </SelectItem>
            {players.map(player => (
              <SelectItem key={player.id} value={player.id}>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" style={{ color: player.color }} />
                  <span>{player.name}{player.isMe ? ' (You)' : ''}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Leave as &quot;No owner&quot; for leftover/revealed cards, or select a player if the card belongs to them.
        </p>
      </div>

      {/* Card selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Cards</h3>
        <div className="space-y-4">
          <CardGroup title="Suspects" cards={cardsByType.suspects} />
          <CardGroup title="Weapons" cards={cardsByType.weapons} />
          <CardGroup title="Rooms" cards={cardsByType.rooms} />
        </div>
      </div>

      {/* Selected count */}
      {selectedCards.size > 0 && (
        <div className="text-sm text-gray-600">
          <strong>{selectedCards.size}</strong> card{selectedCards.size !== 1 ? 's' : ''} selected
          {selectedPlayerId !== 'none' && (
            <span className="ml-1">
              → will be assigned to <strong>{players.find(p => p.id === selectedPlayerId)?.name}</strong>
            </span>
          )}
        </div>
      )}

      {/* Submit buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={selectedCards.size === 0}
          className="flex-1"
        >
          Record {selectedCards.size} Card{selectedCards.size !== 1 ? 's' : ''}
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Close
        </Button>
      </div>
    </div>
  );
};
