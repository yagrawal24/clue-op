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
        <div className="max-w-[1800px] mx-auto px-2 sm:px-4 py-1.5 sm:py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-2xl font-bold text-gray-900 truncate">Clue Master</h1>
                <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] sm:text-xs px-1.5 py-0">
                  T{gameState.currentTurn}
                </Badge>
              </div>
              
              <div className="flex items-center gap-1 sm:hidden">
                {isSolved && (
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full text-[10px] font-medium">
                  <Target className="w-3 h-3 text-amber-500" />
                  <span>{solutionProgress}/3</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1 sm:gap-3 overflow-x-auto pb-0.5 sm:pb-0 no-scrollbar">
              {/* Solution Progress - desktop only */}
              <div className="hidden sm:flex items-center gap-2 bg-gray-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                <Target className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                <span className="text-xs sm:text-sm font-medium">{solutionProgress}/3 solved</span>
              </div>

              {/* AI Advisor Toggle */}
              <Button
                variant={showAISidebar ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAISidebar(!showAISidebar)}
                className={`${showAISidebar ? "bg-indigo-500 hover:bg-indigo-600" : ""} h-7 sm:h-9 px-2 sm:px-3 text-[10px] sm:text-xs flex-shrink-0`}
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden min-[400px]:inline ml-1">Advisor</span>
                <span className="hidden md:inline ml-0.5">AI</span>
              </Button>

              {/* Record Opened Cards */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOpenedCardsDialog(true)}
                className="h-7 sm:h-9 px-2 sm:px-3 text-[10px] sm:text-xs flex-shrink-0"
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden min-[400px]:inline ml-1">Opened</span>
              </Button>

              {/* Record Suggestion */}
              <Button
                size="sm"
                onClick={() => setShowSuggestionDialog(true)}
                className="bg-blue-500 hover:bg-blue-600 h-7 sm:h-9 px-2 sm:px-3 text-[10px] sm:text-xs flex-shrink-0 font-bold"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Suggestion</span>
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
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200" onClick={() => setShowAISidebar(false)}>
          <div 
            className="absolute right-0 top-0 bottom-0 w-[95%] sm:w-[85%] max-w-[420px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ease-out border-l border-indigo-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-indigo-50 bg-indigo-50/30 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-bold text-base sm:text-lg text-indigo-900">AI Advisor</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAISidebar(false)} className="h-8 w-8 p-0 rounded-full hover:bg-indigo-100">
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
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
        <div className="fixed bottom-4 sm:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[400px] z-50 animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl shadow-2xl p-4 sm:p-5 border-2 border-white/20 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:scale-125 transition-transform">
              <Sparkles className="w-16 h-16" />
            </div>
            <div className="flex items-start gap-3 sm:gap-4 relative z-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-lg border border-white/10">
                <Target className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-lg sm:text-xl tracking-tight">Case Solved!</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm sm:text-base font-bold bg-white/10 px-2 py-1 rounded-lg inline-block border border-white/10">
                    {gameState.solvedEnvelope.suspect}
                  </p>
                  <p className="text-xs sm:text-sm opacity-90 font-medium">
                    with the <span className="underline decoration-2 underline-offset-2">{gameState.solvedEnvelope.weapon}</span>
                  </p>
                  <p className="text-xs sm:text-sm opacity-90 font-medium">
                    in the <span className="underline decoration-2 underline-offset-2">{gameState.solvedEnvelope.room}</span>
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-80">
                    Accusation ready
                  </p>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse delay-75" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse delay-150" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

