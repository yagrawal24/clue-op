'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  SkipForward,
  AlertCircle
} from 'lucide-react';
import { Player, GAME_CONSTANTS, Suggestion } from '@/lib/types';

interface EnhancedSuggestionFormProps {
  players: Player[];
  myPlayerId: string | null;
  onSubmit: (suggestion: Omit<Suggestion, 'id' | 'timestamp' | 'turnNumber'>) => void;
  onCancel: () => void;
}

type Step = 'suggester' | 'suggestion' | 'responses';

export const EnhancedSuggestionForm = ({
  players,
  myPlayerId,
  onSubmit,
  onCancel
}: EnhancedSuggestionFormProps) => {
  const [step, setStep] = useState<Step>('suggester');
  const [suggesterId, setSuggesterId] = useState<string>('');
  const [suspect, setSuspect] = useState<string>('');
  const [weapon, setWeapon] = useState<string>('');
  const [room, setRoom] = useState<string>('');
  const [passedPlayerIds, setPassedPlayerIds] = useState<string[]>([]);
  const [showerId, setShowerId] = useState<string | null>(null);
  const [shownCard, setShownCard] = useState<string | null>(null);

  // Players who can respond (everyone except suggester)
  const respondingPlayers = useMemo(() => {
    if (!suggesterId) return [];
    const suggesterIndex = players.findIndex(p => p.id === suggesterId);
    if (suggesterIndex === -1) return [];
    
    // Get players in turn order after suggester
    const ordered: Player[] = [];
    for (let i = 1; i < players.length; i++) {
      const idx = (suggesterIndex + i) % players.length;
      ordered.push(players[idx]);
    }
    return ordered;
  }, [players, suggesterId]);

  // Suggested cards for "which card shown" selection
  const suggestedCards = [suspect, weapon, room].filter(Boolean);

  const handleTogglePass = (playerId: string) => {
    if (passedPlayerIds.includes(playerId)) {
      setPassedPlayerIds(prev => prev.filter(id => id !== playerId));
    } else {
      setPassedPlayerIds(prev => [...prev, playerId]);
      // If this player was the shower, clear that
      if (showerId === playerId) {
        setShowerId(null);
        setShownCard(null);
      }
    }
  };

  const handleSetShower = (playerId: string) => {
    setShowerId(playerId);
    // Remove from passed list if they were there
    setPassedPlayerIds(prev => prev.filter(id => id !== playerId));
    setShownCard(null);
  };

  const handleSubmit = () => {
    if (!suggesterId || !suspect || !weapon || !room) return;

    onSubmit({
      suggesterId,
      suspect,
      weapon,
      room,
      passedPlayerIds,
      showerId: showerId || undefined,
      shownCard: shownCard || undefined
    });
  };

  const canProceedToSuggestion = !!suggesterId;
  const canProceedToResponses = suspect && weapon && room;
  const isFormComplete = suggesterId && suspect && weapon && room && 
    (showerId || passedPlayerIds.length === respondingPlayers.length);

  const getPlayer = (id: string) => players.find(p => p.id === id);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
        <button
          onClick={() => setStep('suggester')}
          className={`px-2 sm:px-3 py-1 rounded-full font-medium transition-all ${
            step === 'suggester' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <span className="hidden sm:inline">1. Suggester</span>
          <span className="sm:hidden">1</span>
        </button>
        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
        <button
          onClick={() => canProceedToSuggestion && setStep('suggestion')}
          disabled={!canProceedToSuggestion}
          className={`px-2 sm:px-3 py-1 rounded-full font-medium transition-all ${
            step === 'suggestion' ? 'bg-blue-500 text-white' : 
            canProceedToSuggestion ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-400'
          }`}
        >
          <span className="hidden sm:inline">2. Cards</span>
          <span className="sm:hidden">2</span>
        </button>
        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
        <button
          onClick={() => canProceedToResponses && setStep('responses')}
          disabled={!canProceedToResponses}
          className={`px-2 sm:px-3 py-1 rounded-full font-medium transition-all ${
            step === 'responses' ? 'bg-blue-500 text-white' : 
            canProceedToResponses ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-400'
          }`}
        >
          <span className="hidden sm:inline">3. Response</span>
          <span className="sm:hidden">3</span>
        </button>
      </div>

      {/* Step 1: Who made the suggestion */}
      {step === 'suggester' && (
        <div className="space-y-3 sm:space-y-4">
          <Label className="text-base sm:text-lg font-bold flex items-center gap-2">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            <span className="text-sm sm:text-base">Who made the suggestion?</span>
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
            {players.map(player => (
              <button
                key={player.id}
                type="button"
                onClick={() => setSuggesterId(player.id)}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${
                  suggesterId === player.id
                    ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${
                      player.id === myPlayerId ? 'ring-2 ring-blue-400 ring-offset-1 sm:ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: player.color }}
                  >
                    <span className="text-xs sm:text-base">{player.name[0]}</span>
                  </div>
                  <div className="text-left min-w-0">
                    <span className="font-semibold text-sm sm:text-base truncate block">{player.name}</span>
                    {player.id === myPlayerId && (
                      <div className="text-xs text-blue-600 font-medium">You</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {suggesterId && (
            <Button onClick={() => setStep('suggestion')} className="w-full mt-3 sm:mt-4 h-10 sm:h-auto">
              <span className="text-sm sm:text-base">Continue</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      )}

      {/* Step 2: What was suggested */}
      {step === 'suggestion' && (
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
            <div
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: getPlayer(suggesterId)?.color }}
            >
              {getPlayer(suggesterId)?.name[0]}
            </div>
            <span className="font-medium text-sm sm:text-base truncate">{getPlayer(suggesterId)?.name} suggests:</span>
          </div>

          {/* Suspect */}
          <div>
            <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-rose-600 mb-1.5 sm:mb-2 block">
              Suspect
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2">
              {GAME_CONSTANTS.SUSPECTS.map(s => (
                <button
                  key={s}
                  onClick={() => setSuspect(s)}
                  className={`p-2 sm:p-3 rounded-lg border-2 text-xs sm:text-sm font-medium transition-all ${
                    suspect === s
                      ? 'border-rose-500 bg-rose-50 text-rose-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Weapon */}
          <div>
            <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-600 mb-1.5 sm:mb-2 block">
              Weapon
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2">
              {GAME_CONSTANTS.WEAPONS.map(w => (
                <button
                  key={w}
                  onClick={() => setWeapon(w)}
                  className={`p-2 sm:p-3 rounded-lg border-2 text-xs sm:text-sm font-medium transition-all ${
                    weapon === w
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Room */}
          <div>
            <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-600 mb-1.5 sm:mb-2 block">
              Room
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2">
              {GAME_CONSTANTS.ROOMS.map(r => (
                <button
                  key={r}
                  onClick={() => setRoom(r)}
                  className={`p-2 sm:p-3 rounded-lg border-2 text-xs sm:text-sm font-medium transition-all ${
                    room === r
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {suspect && weapon && room && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
              <CardContent className="p-2 sm:p-3 md:p-4">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                  <Badge className="bg-rose-500 text-white text-[10px] sm:text-xs">{suspect}</Badge>
                  <span className="text-gray-500">with</span>
                  <Badge className="bg-blue-500 text-white text-[10px] sm:text-xs">{weapon}</Badge>
                  <span className="text-gray-500">in</span>
                  <Badge className="bg-emerald-500 text-white text-[10px] sm:text-xs">{room}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 sm:gap-3">
            <Button variant="outline" onClick={() => setStep('suggester')} className="h-9 sm:h-10 text-sm">
              Back
            </Button>
            <Button 
              onClick={() => setStep('responses')} 
              disabled={!canProceedToResponses}
              className="flex-1 h-9 sm:h-10 text-sm"
            >
              Continue
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Responses */}
      {step === 'responses' && (
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Suggestion Summary */}
          <Card className="bg-gray-50 border-2 border-gray-200">
            <CardContent className="p-2 sm:p-3 md:p-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: getPlayer(suggesterId)?.color }}
                >
                  {getPlayer(suggesterId)?.name[0]}
                </div>
                <span className="font-medium text-sm sm:text-base truncate">{getPlayer(suggesterId)?.name} suggested:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <Badge variant="outline" className="text-[10px] sm:text-xs">{suspect}</Badge>
                <Badge variant="outline" className="text-[10px] sm:text-xs">{weapon}</Badge>
                <Badge variant="outline" className="text-[10px] sm:text-xs">{room}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Response Options */}
          <div>
            <Label className="text-sm sm:text-base md:text-lg font-bold mb-2 sm:mb-3 md:mb-4 block">
              Who responded? (in turn order)
            </Label>
            
            <div className="space-y-2 sm:space-y-3">
              {respondingPlayers.map((player, index) => {
                const isPassed = passedPlayerIds.includes(player.id);
                const isShower = showerId === player.id;
                const isDisabled = !!(showerId && !isShower && !isPassed &&
                  respondingPlayers.findIndex(p => p.id === showerId) < index);
                
                return (
                  <div
                    key={player.id}
                    className={`p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all ${
                      isPassed ? 'bg-red-50 border-red-200' :
                      isShower ? 'bg-emerald-50 border-emerald-300' :
                      isDisabled ? 'bg-gray-50 border-gray-200 opacity-50' :
                      'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-base flex-shrink-0"
                          style={{ backgroundColor: player.color }}
                        >
                          {player.name[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm sm:text-base truncate">{player.name}</span>
                            {player.id === myPlayerId && (
                              <span className="text-xs text-blue-600 font-medium flex-shrink-0">You</span>
                            )}
                          </div>
                          {isPassed && (
                            <div className="text-xs text-red-600 font-medium flex items-center gap-1 mt-0.5">
                              <SkipForward className="w-3 h-3" />
                              <span className="truncate">Passed</span>
                            </div>
                          )}
                          {isShower && (
                            <div className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                              <Eye className="w-3 h-3" />
                              Showed
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
                        <Button
                          variant={isPassed ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTogglePass(player.id)}
                          disabled={isDisabled}
                          className={`flex-1 sm:flex-none h-8 sm:h-9 text-xs sm:text-sm ${isPassed ? "bg-red-500 hover:bg-red-600" : ""}`}
                        >
                          <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Pass</span>
                        </Button>
                        <Button
                          variant={isShower ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSetShower(player.id)}
                          disabled={isDisabled}
                          className={`flex-1 sm:flex-none h-8 sm:h-9 text-xs sm:text-sm ${isShower ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Show</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nobody Showed Option */}
          <Button
            variant={passedPlayerIds.length === respondingPlayers.length ? "default" : "outline"}
            onClick={() => {
              setPassedPlayerIds(respondingPlayers.map(p => p.id));
              setShowerId(null);
              setShownCard(null);
            }}
            className={`w-full h-9 sm:h-10 text-xs sm:text-sm ${
              passedPlayerIds.length === respondingPlayers.length 
                ? "bg-amber-500 hover:bg-amber-600" 
                : ""
            }`}
          >
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Nobody Showed a Card</span>
            <span className="sm:hidden">Nobody Showed</span>
          </Button>

          {/* Which Card Was Shown */}
          {showerId && (
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-xs sm:text-sm font-bold">
                Which card did {getPlayer(showerId)?.name} show? (optional)
              </Label>
              <p className="text-[10px] sm:text-xs text-gray-500">
                Leave empty if you don't know which card was shown
              </p>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3">
                {suggestedCards.map(card => (
                  <button
                    key={card}
                    onClick={() => setShownCard(shownCard === card ? null : card)}
                    className={`p-2 sm:p-3 rounded-lg border-2 text-xs sm:text-sm font-medium transition-all ${
                      shownCard === card
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {shownCard === card && <Check className="w-3 h-3 sm:w-4 sm:h-4 inline mr-0.5 sm:mr-1" />}
                    <span className="break-words">{card}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setStep('suggestion')} className="h-9 sm:h-10 text-sm order-2 sm:order-1">
              Back
            </Button>
            <Button variant="outline" onClick={onCancel} className="h-9 sm:h-10 text-sm order-3 sm:order-2">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormComplete}
              className="h-9 sm:h-10 text-sm sm:flex-1 order-1 sm:order-3"
            >
              <span className="hidden sm:inline">Record Suggestion</span>
              <span className="sm:hidden">Record</span>
              <Check className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

