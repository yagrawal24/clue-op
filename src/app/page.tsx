'use client';

import { Button } from '@/components/ui/button';
import { EnhancedSetup } from '@/components/EnhancedSetup';
import { GameDashboard } from '@/components/GameDashboard';
import { useGameStore } from '@/store/gameStore';
import { ChevronLeft, RotateCcw, Target, Zap, Brain, Shield, Grid3X3 } from 'lucide-react';

export default function Home() {
  const {
    gameStarted,
    players,
    myPlayerId,
    firstPlayerId,
    knowledgeMatrix,
    suggestions,
    deductions,
    cardLinks,
    solvedEnvelope,
    currentTurn,
    notes,
    addPlayer,
    removePlayer,
    reorderPlayers,
    setMyPlayer,
    setFirstPlayer,
    setMyCards,
    startGame,
    resetGame,
    recordSuggestion,
    setCardState,
    recordOpenedCards,
    clearCardRow,
    updateNotes
  } = useGameStore();

  const handleBackToSetup = () => {
    // We'd need to add a way to go back - for now we'll reset
    if (confirm('Going back will reset the current game. Are you sure?')) {
      resetGame();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Only show when not in game */}
      {!gameStarted && (
        <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 text-white overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute top-1/2 -left-20 w-60 h-60 rounded-full bg-purple-500/20 blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-40 h-40 rounded-full bg-blue-400/20 blur-2xl"></div>
          </div>
          
          <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20 max-w-6xl relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-sm mb-6 sm:mb-8 rotate-3 hover:rotate-0 transition-transform duration-300">
                <Target className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" strokeWidth={2} />
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4 sm:mb-6 font-black tracking-tight">
                Clue Master
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed font-medium opacity-90 mb-8 sm:mb-10 md:mb-12 px-2">
                The ultimate competitive advantage. Track every clue, deduce every card,
                solve the mystery before anyone else.
              </p>
              
              {/* Feature badges */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 px-2">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">AI Strategist</span>
                  <span className="xs:hidden">AI</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Auto Inference</span>
                  <span className="xs:hidden">Inference</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
                  <Grid3X3 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Master Matrix</span>
                  <span className="xs:hidden">Matrix</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Link Tracking</span>
                  <span className="xs:hidden">Links</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 50L48 45.8333C96 41.6667 192 33.3333 288 35.4167C384 37.5 480 50 576 58.3333C672 66.6667 768 70.8333 864 66.6667C960 62.5 1056 50 1152 43.75C1248 37.5 1344 37.5 1392 37.5L1440 37.5V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V50Z" fill="white"/>
            </svg>
          </div>
        </div>
      )}

      {/* Navigation Bar for active game */}
      {gameStarted && (
        <div className="bg-white border-b-2 border-gray-100 shadow-sm">
          <div className="max-w-[1800px] mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={handleBackToSetup}
                className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Back to Setup</span>
                <span className="xs:hidden">Back</span>
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => {
                  if (confirm('Are you sure you want to reset the game? All progress will be lost.')) {
                    resetGame();
                  }
                }}
                className="flex items-center gap-1 sm:gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
              >
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Reset</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!gameStarted ? (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <EnhancedSetup
            players={players}
            myPlayerId={myPlayerId}
            firstPlayerId={firstPlayerId}
            onAddPlayer={addPlayer}
            onRemovePlayer={removePlayer}
            onReorderPlayers={reorderPlayers}
            onSetMyPlayer={setMyPlayer}
            onSetFirstPlayer={setFirstPlayer}
            onSetMyCards={setMyCards}
            onStartGame={startGame}
          />
          
          {/* Features section */}
          <div className="mt-20 mb-12">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
              Powerful Features
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                <div className="w-14 h-14 rounded-xl bg-indigo-500 flex items-center justify-center mx-auto mb-4">
                  <Grid3X3 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">Master Matrix</h3>
                <p className="text-gray-600">
                  Visual grid showing all 21 cards × all players + envelope. 
                  Click to manually override any cell.
                </p>
              </div>
              
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                <div className="w-14 h-14 rounded-xl bg-purple-500 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">Auto Inference</h3>
                <p className="text-gray-600">
                  Constraint satisfaction logic automatically deduces card ownership
                  from passes and shows.
                </p>
              </div>
              
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                <div className="w-14 h-14 rounded-xl bg-amber-500 flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">AI Strategist</h3>
                <p className="text-gray-600">
                  Get strategic advice, optimal suggestions, and bluff detection
                  powered by AI analysis.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center text-sm text-gray-500 py-8 border-t border-gray-200">
            <p className="font-medium">
              Built with Next.js, Zustand, and Tailwind CSS
            </p>
          </footer>
        </div>
      ) : (
        <GameDashboard
          gameState={{
            players,
            myPlayerId,
            firstPlayerId,
            gameStarted,
            currentTurn,
            knowledgeMatrix,
            cardLinks,
            suggestions,
            accusations: [],
            deductions,
            notes,
            solvedEnvelope
          }}
          onRecordSuggestion={recordSuggestion}
          onSetCardState={setCardState}
          onRecordOpenedCards={recordOpenedCards}
          onClearCardRow={clearCardRow}
        />
      )}
    </div>
  );
}
