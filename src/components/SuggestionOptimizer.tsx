'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Lightbulb,
  TrendingUp,
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
  Brain,
  Sparkles,
  BarChart3,
  Info,
  ArrowRight,
  Flame,
  Activity,
  RefreshCw
} from 'lucide-react';
import {
  KnowledgeMatrix,
  Player,
  CardLink,
  SuggestionAnalysis,
  GAME_CONSTANTS
} from '@/lib/types';
import {
  calculateProbabilities,
  calculateEntropy,
  findOptimalSuggestions,
  getSolutionConfidence,
  getProbabilityColor
} from '@/lib/probabilityEngine';

interface SuggestionOptimizerProps {
  knowledgeMatrix: KnowledgeMatrix;
  players: Player[];
  myPlayerId: string | null;
  cardLinks: CardLink[];
}

export const SuggestionOptimizer = ({
  knowledgeMatrix,
  players,
  myPlayerId,
  cardLinks
}: SuggestionOptimizerProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculations, setCalculations] = useState<ReturnType<typeof findOptimalSuggestions> | null>(null);

  // Calculate probability matrix
  const probMatrix = useMemo(() => {
    if (Object.keys(knowledgeMatrix).length === 0) return null;
    return calculateProbabilities(knowledgeMatrix, players, cardLinks);
  }, [knowledgeMatrix, players, cardLinks]);

  // Calculate entropy and confidence
  const { entropy, confidence } = useMemo(() => {
    if (!probMatrix) return { entropy: null, confidence: null };
    return {
      entropy: calculateEntropy(probMatrix),
      confidence: getSolutionConfidence(probMatrix)
    };
  }, [probMatrix]);

  // Calculate optimal suggestions
  const handleCalculate = () => {
    if (!probMatrix) return;
    setIsCalculating(true);
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const results = findOptimalSuggestions(
        myPlayerId,
        players,
        knowledgeMatrix,
        probMatrix,
        5
      );
      setCalculations(results);
      setIsCalculating(false);
    }, 50);
  };

  // Auto-calculate on first render if we have data
  useMemo(() => {
    if (probMatrix && !calculations && !isCalculating) {
      handleCalculate();
    }
  }, [probMatrix]);

  if (Object.keys(knowledgeMatrix).length === 0) {
    return (
      <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200">
        <CardContent className="py-12 text-center">
          <div className="w-14 h-14 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-7 h-7 text-cyan-400" />
          </div>
          <p className="text-gray-400 font-bold">Start the game to get optimal suggestions</p>
        </CardContent>
      </Card>
    );
  }

  const formatInfoGain = (gain: number) => {
    if (gain >= 1.5) return { label: 'Excellent', color: 'bg-emerald-500', textColor: 'text-emerald-700' };
    if (gain >= 1.0) return { label: 'Very Good', color: 'bg-green-500', textColor: 'text-green-700' };
    if (gain >= 0.6) return { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-700' };
    if (gain >= 0.3) return { label: 'Moderate', color: 'bg-amber-500', textColor: 'text-amber-700' };
    return { label: 'Limited', color: 'bg-gray-400', textColor: 'text-gray-600' };
  };

  return (
    <Card className="bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 border-2 border-cyan-200 overflow-hidden">
      <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-200/50">
        <CardTitle className="text-base sm:text-xl font-black flex items-center gap-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-200">
            <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-gray-800">Suggestion Optimizer</span>
            <span className="text-[10px] sm:text-xs font-bold text-cyan-600 uppercase tracking-wider">
              Information Gain Analysis
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCalculate}
            disabled={isCalculating || !probMatrix}
            className="ml-auto h-8 px-3 text-cyan-600 hover:bg-cyan-100"
          >
            <RefreshCw className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Current Game State */}
        {entropy && confidence && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {/* Entropy Score */}
            <div className="bg-white rounded-xl p-3 border border-cyan-100 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3.5 h-3.5 text-cyan-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">Uncertainty</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-gray-800">
                {entropy.total.toFixed(2)}
              </div>
              <div className="text-[10px] text-gray-500">bits of entropy</div>
            </div>

            {/* Solution Confidence */}
            <div className="bg-white rounded-xl p-3 border border-cyan-100 shadow-sm col-span-1 sm:col-span-3">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-3.5 h-3.5 text-cyan-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">Most Likely Solution</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {confidence.suspect.card && (
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{ 
                        backgroundColor: getProbabilityColor(confidence.suspect.confidence),
                        color: confidence.suspect.confidence > 0.5 ? 'white' : '#374151'
                      }}
                    >
                      {confidence.suspect.card}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500">
                      {(confidence.suspect.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {confidence.weapon.card && (
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{ 
                        backgroundColor: getProbabilityColor(confidence.weapon.confidence),
                        color: confidence.weapon.confidence > 0.5 ? 'white' : '#374151'
                      }}
                    >
                      {confidence.weapon.card}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500">
                      {(confidence.weapon.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {confidence.room.card && (
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{ 
                        backgroundColor: getProbabilityColor(confidence.room.confidence),
                        color: confidence.room.confidence > 0.5 ? 'white' : '#374151'
                      }}
                    >
                      {confidence.room.card}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500">
                      {(confidence.room.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Optimal Suggestions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
              Optimal Suggestions
            </h3>
            <span className="text-[10px] text-gray-500 font-medium ml-auto">
              Ranked by Expected Information Gain
            </span>
          </div>

          {isCalculating ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Brain className="w-10 h-10 text-cyan-400 mx-auto mb-3 animate-pulse" />
                <p className="text-sm text-gray-500 font-medium">Analyzing {GAME_CONSTANTS.TOTAL_CARDS - 3} cards...</p>
              </div>
            </div>
          ) : calculations?.recommendations.length ? (
            <div className="space-y-2">
              {calculations.recommendations.map((suggestion, index) => (
                <SuggestionCard
                  key={`${suggestion.suspect}-${suggestion.weapon}-${suggestion.room}`}
                  suggestion={suggestion}
                  index={index}
                  isExpanded={expandedIndex === index}
                  onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  formatInfoGain={formatInfoGain}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <p className="font-medium">No suggestions available</p>
              <p className="text-sm">Click refresh to calculate</p>
            </div>
          )}
        </div>

        {/* Information Gain Explanation */}
        <div className="bg-white/60 rounded-xl p-4 border border-cyan-100/50">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-bold text-gray-700">How Information Gain Works</p>
              <p>
                Each suggestion is scored by how much <strong>uncertainty</strong> it removes. 
                Higher scores mean that suggestion is more likely to give you useful information.
              </p>
              <p className="text-gray-500">
                The "What If" engine simulates all possible outcomes and calculates the expected 
                entropy reduction for each suggestion.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Individual suggestion card component
interface SuggestionCardProps {
  suggestion: SuggestionAnalysis;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  formatInfoGain: (gain: number) => { label: string; color: string; textColor: string };
}

const SuggestionCard = ({
  suggestion,
  index,
  isExpanded,
  onToggle,
  formatInfoGain
}: SuggestionCardProps) => {
  const infoGainRating = formatInfoGain(suggestion.expectedInfoGain);

  return (
    <div 
      className={`bg-white rounded-xl border-2 overflow-hidden transition-all duration-200 ${
        index === 0 
          ? 'border-cyan-300 shadow-lg shadow-cyan-100' 
          : 'border-gray-100 hover:border-gray-200'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full p-3 sm:p-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-start gap-3">
          {/* Rank */}
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-sm ${
            index === 0 
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md' 
              : 'bg-gray-100 text-gray-500'
          }`}>
            {index + 1}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Cards */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <Badge className="bg-rose-100 text-rose-700 border-0 text-[10px] sm:text-xs font-bold">
                {suggestion.suspect}
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] sm:text-xs font-bold">
                {suggestion.weapon}
              </Badge>
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] sm:text-xs font-bold">
                {suggestion.room}
              </Badge>
            </div>

            {/* Info gain score */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <TrendingUp className={`w-3.5 h-3.5 ${infoGainRating.textColor}`} />
                <span className={`text-xs font-bold ${infoGainRating.textColor}`}>
                  {suggestion.expectedInfoGain.toFixed(2)} bits
                </span>
              </div>
              <Badge className={`${infoGainRating.color} text-white border-0 text-[10px] font-bold`}>
                {infoGainRating.label}
              </Badge>
              
              {/* Category impact indicators */}
              {suggestion.categoryImpact.suspect > 0.3 && (
                <div className="flex items-center gap-0.5">
                  <Flame className="w-3 h-3 text-rose-500" />
                  <span className="text-[9px] font-bold text-rose-600">Suspect</span>
                </div>
              )}
              {suggestion.categoryImpact.weapon > 0.3 && (
                <div className="flex items-center gap-0.5">
                  <Flame className="w-3 h-3 text-blue-500" />
                  <span className="text-[9px] font-bold text-blue-600">Weapon</span>
                </div>
              )}
              {suggestion.categoryImpact.room > 0.3 && (
                <div className="flex items-center gap-0.5">
                  <Flame className="w-3 h-3 text-emerald-500" />
                  <span className="text-[9px] font-bold text-emerald-600">Room</span>
                </div>
              )}
            </div>
          </div>

          {/* Expand icon */}
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100">
          {/* Reasoning */}
          <div className="mt-3 mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-xs font-bold text-gray-700">Analysis</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              {suggestion.reasoning}
            </p>
          </div>

          {/* Possible outcomes */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-xs font-bold text-gray-700">Possible Outcomes</span>
            </div>
            <div className="space-y-1.5">
              {suggestion.outcomes.slice(0, 5).map((outcome, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-2 text-[10px] bg-gray-50 rounded-lg px-2 py-1.5"
                >
                  <div 
                    className="w-12 h-1.5 rounded-full bg-gray-200 overflow-hidden"
                  >
                    <div 
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${outcome.probability * 100}%` }}
                    />
                  </div>
                  <span className="font-bold text-gray-500 w-10 text-right">
                    {(outcome.probability * 100).toFixed(0)}%
                  </span>
                  <span className="text-gray-600 flex-1">
                    {outcome.showerId 
                      ? outcome.shownCard 
                        ? `Someone shows ${outcome.shownCard}`
                        : 'Someone shows a card'
                      : 'Everyone passes'
                    }
                  </span>
                  <span className="text-cyan-600 font-bold">
                    +{outcome.informationGain.toFixed(2)} bits
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestionOptimizer;

