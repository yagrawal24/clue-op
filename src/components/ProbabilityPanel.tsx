'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PieChart,
  BarChart3,
  Crown,
  Target,
  Flame,
  TrendingDown,
  Activity,
  Users
} from 'lucide-react';
import {
  KnowledgeMatrix,
  Player,
  CardLink,
  GAME_CONSTANTS,
  CardType
} from '@/lib/types';
import {
  calculateProbabilities,
  calculateEntropy,
  getSolutionConfidence,
  getProbabilityColor,
  getProbabilityLevel
} from '@/lib/probabilityEngine';

interface ProbabilityPanelProps {
  knowledgeMatrix: KnowledgeMatrix;
  players: Player[];
  cardLinks: CardLink[];
  compact?: boolean;
}

export const ProbabilityPanel = ({
  knowledgeMatrix,
  players,
  cardLinks,
  compact = false
}: ProbabilityPanelProps) => {
  // Calculate probabilities
  const probMatrix = useMemo(() => {
    if (Object.keys(knowledgeMatrix).length === 0) return null;
    return calculateProbabilities(knowledgeMatrix, players, cardLinks);
  }, [knowledgeMatrix, players, cardLinks]);

  const entropy = useMemo(() => {
    if (!probMatrix) return null;
    return calculateEntropy(probMatrix);
  }, [probMatrix]);

  const confidence = useMemo(() => {
    if (!probMatrix) return null;
    return getSolutionConfidence(probMatrix);
  }, [probMatrix]);

  // Get top candidates per category
  const topCandidates = useMemo(() => {
    if (!probMatrix) return null;

    const getTopN = (cards: readonly string[], n: number) => {
      return cards
        .map(card => ({
          card,
          probability: probMatrix[card]?.envelopeProbability || 0,
          state: knowledgeMatrix[card]?.envelope?.state
        }))
        .filter(c => c.state !== 'envelope' && c.state !== 'not_owned')
        .sort((a, b) => b.probability - a.probability)
        .slice(0, n);
    };

    return {
      suspects: getTopN(GAME_CONSTANTS.SUSPECTS, 3),
      weapons: getTopN(GAME_CONSTANTS.WEAPONS, 3),
      rooms: getTopN(GAME_CONSTANTS.ROOMS, 3)
    };
  }, [probMatrix, knowledgeMatrix]);

  if (!probMatrix || !entropy || !confidence || !topCandidates) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
        <CardContent className="py-8 text-center">
          <PieChart className="w-10 h-10 text-purple-300 mx-auto mb-3" />
          <p className="text-gray-400 font-bold">Waiting for game data...</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate certainty percentage (inverse of normalized entropy)
  const maxEntropy = Math.log2(6) + Math.log2(6) + Math.log2(9); // Max possible entropy
  const certaintyPercent = Math.max(0, ((maxEntropy - entropy.total) / maxEntropy) * 100);

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <PieChart className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-800">Probability Analysis</span>
            </div>
            <Badge className="bg-purple-500 text-white border-0 font-bold">
              {certaintyPercent.toFixed(0)}% certain
            </Badge>
          </div>

          {/* Mini solution display */}
          <div className="flex flex-wrap gap-2">
            {confidence.suspect.card && confidence.suspect.confidence > 0.2 && (
              <div 
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
                style={{ 
                  backgroundColor: getProbabilityColor(confidence.suspect.confidence),
                  color: confidence.suspect.confidence > 0.5 ? 'white' : '#374151'
                }}
              >
                <Crown className="w-3 h-3" />
                {confidence.suspect.card} ({(confidence.suspect.confidence * 100).toFixed(0)}%)
              </div>
            )}
            {confidence.weapon.card && confidence.weapon.confidence > 0.2 && (
              <div 
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
                style={{ 
                  backgroundColor: getProbabilityColor(confidence.weapon.confidence),
                  color: confidence.weapon.confidence > 0.5 ? 'white' : '#374151'
                }}
              >
                {confidence.weapon.card} ({(confidence.weapon.confidence * 100).toFixed(0)}%)
              </div>
            )}
            {confidence.room.card && confidence.room.confidence > 0.2 && (
              <div 
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
                style={{ 
                  backgroundColor: getProbabilityColor(confidence.room.confidence),
                  color: confidence.room.confidence > 0.5 ? 'white' : '#374151'
                }}
              >
                {confidence.room.card} ({(confidence.room.confidence * 100).toFixed(0)}%)
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-50 border-2 border-purple-200 overflow-hidden">
      <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-b border-purple-200/50">
        <CardTitle className="text-base sm:text-xl font-black flex items-center gap-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-200">
            <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-gray-800">Bayesian Analysis</span>
            <span className="text-[10px] sm:text-xs font-bold text-purple-600 uppercase tracking-wider">
              Probabilistic Reasoning
            </span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* Certainty Meter */}
        <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-bold text-gray-700">Solution Certainty</span>
            </div>
            <span className="text-2xl font-black text-purple-600">
              {certaintyPercent.toFixed(0)}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-400 via-indigo-500 to-violet-600"
              style={{ width: `${certaintyPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
            <span>0% (Max Uncertainty)</span>
            <span>100% (Solved)</span>
          </div>
        </div>

        {/* Entropy by Category */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white rounded-xl p-3 border border-rose-100 shadow-sm">
            <div className="text-[10px] font-bold text-rose-500 uppercase mb-1">Suspects</div>
            <div className="text-lg font-black text-gray-800">{entropy.suspects.toFixed(2)}</div>
            <div className="text-[10px] text-gray-400">bits</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-blue-100 shadow-sm">
            <div className="text-[10px] font-bold text-blue-500 uppercase mb-1">Weapons</div>
            <div className="text-lg font-black text-gray-800">{entropy.weapons.toFixed(2)}</div>
            <div className="text-[10px] text-gray-400">bits</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm">
            <div className="text-[10px] font-bold text-emerald-500 uppercase mb-1">Rooms</div>
            <div className="text-lg font-black text-gray-800">{entropy.rooms.toFixed(2)}</div>
            <div className="text-[10px] text-gray-400">bits</div>
          </div>
        </div>

        {/* Top Candidates per Category */}
        <div className="space-y-4">
          {/* Suspects */}
          <CategorySection
            title="Top Suspect Candidates"
            icon={<Target className="w-4 h-4 text-rose-500" />}
            color="rose"
            candidates={topCandidates.suspects}
          />

          {/* Weapons */}
          <CategorySection
            title="Top Weapon Candidates"
            icon={<BarChart3 className="w-4 h-4 text-blue-500" />}
            color="blue"
            candidates={topCandidates.weapons}
          />

          {/* Rooms */}
          <CategorySection
            title="Top Room Candidates"
            icon={<Crown className="w-4 h-4 text-emerald-500" />}
            color="emerald"
            candidates={topCandidates.rooms}
          />
        </div>

        {/* Players Analysis */}
        <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-bold text-gray-700">Player Card Distribution</span>
          </div>
          <div className="space-y-2">
            {players.map(player => {
              const ownedCount = Object.values(probMatrix).filter(
                p => (p.playerProbabilities[player.id] || 0) > 0.9
              ).length;
              const possibleCount = Object.values(probMatrix).filter(
                p => (p.playerProbabilities[player.id] || 0) > 0.1 && 
                     (p.playerProbabilities[player.id] || 0) < 0.9
              ).length;

              return (
                <div key={player.id} className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.name[0]}
                  </div>
                  <span className="text-xs font-medium text-gray-700 flex-1">{player.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">
                      {ownedCount} confirmed
                    </Badge>
                    <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">
                      {possibleCount} possible
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Category section for top candidates
interface CategorySectionProps {
  title: string;
  icon: React.ReactNode;
  color: 'rose' | 'blue' | 'emerald';
  candidates: Array<{ card: string; probability: number; state?: string }>;
}

const CategorySection = ({ title, icon, color, candidates }: CategorySectionProps) => {
  const bgColors = {
    rose: 'bg-rose-50 border-rose-100',
    blue: 'bg-blue-50 border-blue-100',
    emerald: 'bg-emerald-50 border-emerald-100'
  };

  return (
    <div className={`rounded-xl p-3 border ${bgColors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-bold text-gray-700">{title}</span>
      </div>
      <div className="space-y-1.5">
        {candidates.length > 0 ? candidates.map((candidate, index) => (
          <div key={candidate.card} className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 w-4">{index + 1}.</span>
            <span className="text-xs font-medium text-gray-700 flex-1">{candidate.card}</span>
            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full"
                style={{ 
                  width: `${candidate.probability * 100}%`,
                  backgroundColor: getProbabilityColor(candidate.probability)
                }}
              />
            </div>
            <span 
              className="text-[10px] font-bold w-10 text-right"
              style={{ color: candidate.probability > 0.5 ? '#dc2626' : '#6b7280' }}
            >
              {(candidate.probability * 100).toFixed(0)}%
            </span>
            {candidate.probability > 0.5 && (
              <Flame className="w-3 h-3 text-orange-500 animate-pulse" />
            )}
          </div>
        )) : (
          <p className="text-[10px] text-gray-400">No candidates yet</p>
        )}
      </div>
    </div>
  );
};

export default ProbabilityPanel;

