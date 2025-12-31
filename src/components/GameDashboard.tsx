'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Grid3X3,
  MessageSquare,
  Brain,
  Sparkles,
  Target,
  Users,
  Menu,
  X,
  Eye
} from 'lucide-react';
import { GameState, Suggestion, PlayerCardKnowledge } from '@/lib/types';
import { MasterMatrix } from './MasterMatrix';
import { SuggestionLog } from './SuggestionLog';
import { IntelligencePanel } from './IntelligencePanel';
import { AIAdvisor } from './AIAdvisor';
import { EnhancedSuggestionForm } from './EnhancedSuggestionForm';
import { OpenedCardsForm } from './OpenedCardsForm';

interface GameDashboardProps {
  gameState: GameState;
  onRecordSuggestion: (suggestion: Omit<Suggestion, 'id' | 'timestamp' | 'turnNumber'>) => void;
  onSetCardState: (cardName: string, target: string | 'envelope', state: PlayerCardKnowledge['state'], createDeduction?: boolean) => void;
  onRecordOpenedCards: (cardNames: string[], playerId?: string) => void;
  onClearCardRow: (cardName: string) => void;
}

export const GameDashboard = ({
  gameState,
  onRecordSuggestion,
  onSetCardState,
  onRecordOpenedCards,
  onClearCardRow
}: GameDashboardProps) => {
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [showOpenedCardsDialog, setShowOpenedCardsDialog] = useState(false);
  const [showAISidebar, setShowAISidebar] = useState(false);
  const [activeTab, setActiveTab] = useState<'matrix' | 'log' | 'intel'>('matrix');

  const handleRecordSuggestion = (suggestion: Omit<Suggestion, 'id' | 'timestamp' | 'turnNumber'>) => {
    onRecordSuggestion(suggestion);
    setShowSuggestionDialog(false);
  };

  // Solution progress
  const solutionProgress = [
    gameState.solvedEnvelope.suspect,
    gameState.solvedEnvelope.weapon,
    gameState.solvedEnvelope.room
  ].filter(Boolean).length;

  const isSolved = solutionProgress === 3;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Clue Master</h1>
              <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                Turn {gameState.currentTurn}
              </Badge>
              {isSolved && (
                <Badge className="bg-amber-100 text-amber-700 border-0 flex items-center gap-1 text-xs">
                  <Sparkles className="w-3 h-3" />
                  <span className="hidden sm:inline">Solved!</span>
                  <span className="sm:hidden">✓</span>
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-3">
              {/* Player count - show on all screens */}
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden min-[480px]:inline">{gameState.players.length} players</span>
                <span className="min-[480px]:hidden">{gameState.players.length}p</span>
              </div>

              {/* Solution Progress - show on larger screens */}
              <div className="hidden sm:flex items-center gap-2 bg-gray-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                <Target className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                <span className="text-xs sm:text-sm font-medium">{solutionProgress}/3 solved</span>
              </div>

              {/* AI Advisor Toggle */}
              <Button
                variant={showAISidebar ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAISidebar(!showAISidebar)}
                className={`${showAISidebar ? "bg-indigo-500 hover:bg-indigo-600" : ""} h-8 sm:h-9 px-2 sm:px-3`}
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden md:inline ml-1">AI Advisor</span>
              </Button>

              {/* Record Opened Cards */}
              <Button
                variant="outline"
                onClick={() => setShowOpenedCardsDialog(true)}
                className="h-8 sm:h-9 px-2 sm:px-3 mr-2"
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline ml-1">Opened Cards</span>
                <span className="sm:hidden ml-1">Opened</span>
              </Button>

              {/* Record Suggestion */}
              <Button
                onClick={() => setShowSuggestionDialog(true)}
                className="bg-blue-500 hover:bg-blue-600 h-8 sm:h-9 px-2 sm:px-3"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline ml-1">Record Suggestion</span>
                <span className="sm:hidden ml-1">New</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto p-3 sm:p-4 overflow-x-hidden">
        <div className={`grid gap-4 sm:gap-6 ${showAISidebar ? 'lg:grid-cols-[1fr_380px]' : ''}`}>
          {/* Main Panel */}
          <div className="space-y-4 sm:space-y-6 min-w-0 overflow-x-hidden">
            {/* Mobile Tabs */}
            <div className="block lg:hidden">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList className="grid grid-cols-3 w-full h-12">
                  <TabsTrigger value="matrix" className="flex items-center gap-1 text-xs sm:text-sm">
                    <Grid3X3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Matrix</span>
                    <span className="sm:hidden">Grid</span>
                  </TabsTrigger>
                  <TabsTrigger value="log" className="flex items-center gap-1 text-xs sm:text-sm">
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">Log</span>
                    <span className="sm:hidden">Log</span>
                  </TabsTrigger>
                  <TabsTrigger value="intel" className="flex items-center gap-1 text-xs sm:text-sm">
                    <Brain className="w-4 h-4" />
                    <span className="hidden sm:inline">Intel</span>
                    <span className="sm:hidden">AI</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="matrix" className="mt-4">
                  <MasterMatrix
                    knowledgeMatrix={gameState.knowledgeMatrix}
                    players={gameState.players}
                    myPlayerId={gameState.myPlayerId}
                    onCellClick={onSetCardState}
                    onClearCardRow={onClearCardRow}
                  />
                </TabsContent>

                <TabsContent value="log" className="mt-4">
                  <SuggestionLog
                    suggestions={gameState.suggestions}
                    players={gameState.players}
                    cardLinks={gameState.cardLinks}
                  />
                </TabsContent>

                <TabsContent value="intel" className="mt-4">
                  <IntelligencePanel
                    deductions={gameState.deductions}
                    players={gameState.players}
                    solvedEnvelope={gameState.solvedEnvelope}
                    cardLinks={gameState.cardLinks}
                    knowledgeMatrix={gameState.knowledgeMatrix}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid lg:grid-cols-[1fr_400px] gap-4 sm:gap-6">
              {/* Left Column - Matrix */}
              <MasterMatrix
                knowledgeMatrix={gameState.knowledgeMatrix}
                players={gameState.players}
                myPlayerId={gameState.myPlayerId}
                onCellClick={onSetCardState}
                onClearCardRow={onClearCardRow}
              />
              
              {/* Right Column - Log & Intel */}
              <div className="space-y-4 sm:space-y-6">
                <SuggestionLog
                  suggestions={gameState.suggestions}
                  players={gameState.players}
                  cardLinks={gameState.cardLinks}
                  maxHeight="300px"
                />
                
                <IntelligencePanel
                  deductions={gameState.deductions}
                  players={gameState.players}
                  solvedEnvelope={gameState.solvedEnvelope}
                  cardLinks={gameState.cardLinks}
                  knowledgeMatrix={gameState.knowledgeMatrix}
                />
              </div>
            </div>
          </div>

          {/* AI Advisor Sidebar */}
          {showAISidebar && (
            <div className="hidden lg:block">
              <div className="sticky top-20">
                <AIAdvisor
                  knowledgeMatrix={gameState.knowledgeMatrix}
                  suggestions={gameState.suggestions}
                  deductions={gameState.deductions}
                  players={gameState.players}
                  myPlayerId={gameState.myPlayerId}
                  cardLinks={gameState.cardLinks}
                  currentTurn={gameState.currentTurn}
                  notes={gameState.notes}
                  solvedEnvelope={gameState.solvedEnvelope}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile AI Sidebar */}
      {showAISidebar && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowAISidebar(false)}>
          <div 
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[90%] max-w-[450px] bg-white shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="font-bold text-base sm:text-lg">AI Advisor</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAISidebar(false)} className="h-8 w-8 p-0">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
            <div className="flex-1 min-h-0 p-3 sm:p-4">
              <AIAdvisor
                knowledgeMatrix={gameState.knowledgeMatrix}
                suggestions={gameState.suggestions}
                deductions={gameState.deductions}
                players={gameState.players}
                myPlayerId={gameState.myPlayerId}
                cardLinks={gameState.cardLinks}
                currentTurn={gameState.currentTurn}
                notes={gameState.notes}
                solvedEnvelope={gameState.solvedEnvelope}
              />
            </div>
          </div>
        </div>
      )}

      {/* Suggestion Dialog */}
      <Dialog open={showSuggestionDialog} onOpenChange={setShowSuggestionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-2xl font-bold">Record Suggestion</DialogTitle>
          </DialogHeader>
          <EnhancedSuggestionForm
            players={gameState.players}
            myPlayerId={gameState.myPlayerId}
            onSubmit={handleRecordSuggestion}
            onCancel={() => setShowSuggestionDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Opened Cards Dialog */}
      <Dialog open={showOpenedCardsDialog} onOpenChange={setShowOpenedCardsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-xl font-bold">Record Opened Cards</DialogTitle>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              Select cards that were revealed (leftover cards in uneven player games, etc.)
            </p>
          </DialogHeader>
          <OpenedCardsForm
            players={gameState.players}
            knowledgeMatrix={gameState.knowledgeMatrix}
            onSubmit={(cardNames, playerId) => {
              onRecordOpenedCards(cardNames, playerId);
              setShowOpenedCardsDialog(false);
            }}
            onCancel={() => setShowOpenedCardsDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Solution Alert */}
      {isSolved && (
        <div className="fixed bottom-3 sm:bottom-4 left-3 right-3 sm:left-4 sm:right-4 md:left-auto md:right-4 md:w-96 z-50">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg shadow-xl p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base sm:text-lg">Solution Deduced!</h3>
                <p className="text-xs sm:text-sm opacity-90 mt-1 break-words">
                  <strong>{gameState.solvedEnvelope.suspect}</strong> with the{' '}
                  <strong>{gameState.solvedEnvelope.weapon}</strong> in the{' '}
                  <strong>{gameState.solvedEnvelope.room}</strong>
                </p>
                <p className="text-[10px] sm:text-xs opacity-75 mt-1.5 sm:mt-2">
                  You can now make your accusation!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

