'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain,
  Lightbulb,
  Crown,
  Check,
  X,
  Link2,
  Target,
  Sparkles,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Deduction, Player, KnowledgeMatrix, GAME_CONSTANTS, CardLink } from '@/lib/types';

interface IntelligencePanelProps {
  deductions: Deduction[];
  players: Player[];
  solvedEnvelope: {
    suspect: string | null;
    weapon: string | null;
    room: string | null;
  };
  cardLinks: CardLink[];
  knowledgeMatrix: KnowledgeMatrix;
}

const DeductionIcon = ({ type }: { type: Deduction['type'] }) => {
  switch (type) {
    case 'card_owned':
      return <Check className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />;
    case 'card_not_owned':
      return <X className="w-4 h-4 text-red-500" strokeWidth={2.5} />;
    case 'envelope':
      return <Crown className="w-4 h-4 text-amber-500" strokeWidth={2.5} />;
    case 'link_resolved':
      return <Link2 className="w-4 h-4 text-purple-500" strokeWidth={2.5} />;
    case 'cross_reference':
      return <Sparkles className="w-4 h-4 text-cyan-500" strokeWidth={2.5} />;
    case 'card_count':
      return <Target className="w-4 h-4 text-blue-500" strokeWidth={2.5} />;
    case 'manual_adjustment':
      return <Target className="w-4 h-4 text-orange-500" strokeWidth={2.5} />;
    default:
      return <Lightbulb className="w-4 h-4 text-blue-500" strokeWidth={2.5} />;
  }
};

const DeductionBadge = ({ type }: { type: Deduction['type'] }) => {
  switch (type) {
    case 'card_owned':
      return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Owned</Badge>;
    case 'card_not_owned':
      return <Badge className="bg-red-100 text-red-700 border-0 text-xs">Not Owned</Badge>;
    case 'envelope':
      return <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Solution</Badge>;
    case 'link_resolved':
      return <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">Deduced</Badge>;
    case 'cross_reference':
      return <Badge className="bg-cyan-100 text-cyan-700 border-0 text-xs">Cross-Ref</Badge>;
    case 'card_count':
      return <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">Count</Badge>;
    case 'manual_adjustment':
      return <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">Manual</Badge>;
    default:
      return <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">Info</Badge>;
  }
};

export const IntelligencePanel = ({
  deductions,
  players,
  solvedEnvelope,
  cardLinks,
  knowledgeMatrix
}: IntelligencePanelProps) => {
  // Get recent important deductions (last 15)
  const recentDeductions = [...deductions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);

  // Count stats
  const envelopeDeductions = deductions.filter(d => d.type === 'envelope');
  const cardOwnedDeductions = deductions.filter(d => d.type === 'card_owned' || d.type === 'manual_adjustment' || d.type === 'card_count');
  const linkResolvedDeductions = deductions.filter(d => d.type === 'link_resolved' || d.type === 'cross_reference');
  const unresolvedLinks = cardLinks.filter(l => !l.resolved);

  // Solution progress
  const solutionProgress = [
    solvedEnvelope.suspect,
    solvedEnvelope.weapon,
    solvedEnvelope.room
  ].filter(Boolean).length;

  const isSolved = solutionProgress === 3;

  return (
    <Card className="bg-white border-2 border-gray-200 h-full flex flex-col">
      <CardHeader className="pb-2 sm:pb-3 flex-shrink-0 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="text-base sm:text-xl font-bold flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="truncate">Intelligence</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0 space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
        {/* Solution Status */}
        <div className={`rounded-lg p-2 sm:p-3 md:p-4 ${isSolved ? 'bg-gradient-to-br from-amber-100 to-amber-50 border-2 border-amber-300' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1 sm:gap-2">
              <Target className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
              <span className="hidden sm:inline">Solution Progress</span>
              <span className="sm:hidden">Solution</span>
            </h3>
            {isSolved && (
              <div className="flex items-center gap-0.5 sm:gap-1 text-amber-600">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-xs font-bold">SOLVED!</span>
              </div>
            )}
          </div>
          
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-600 truncate">Suspect:</span>
              {solvedEnvelope.suspect ? (
                <Badge className="bg-emerald-500 text-white border-0 text-[10px] sm:text-xs truncate max-w-[120px]">
                  {solvedEnvelope.suspect}
                </Badge>
              ) : (
                <span className="text-xs sm:text-sm text-gray-400">Unknown</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-600 truncate">Weapon:</span>
              {solvedEnvelope.weapon ? (
                <Badge className="bg-emerald-500 text-white border-0 text-[10px] sm:text-xs truncate max-w-[120px]">
                  {solvedEnvelope.weapon}
                </Badge>
              ) : (
                <span className="text-xs sm:text-sm text-gray-400">Unknown</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-600 truncate">Room:</span>
              {solvedEnvelope.room ? (
                <Badge className="bg-emerald-500 text-white border-0 text-[10px] sm:text-xs truncate max-w-[120px]">
                  {solvedEnvelope.room}
                </Badge>
              ) : (
                <span className="text-xs sm:text-sm text-gray-400">Unknown</span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2 sm:mt-3">
            <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{solutionProgress}/3</span>
            </div>
            <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${isSolved ? 'bg-amber-500' : 'bg-blue-500'}`}
                style={{ width: `${(solutionProgress / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Unresolved Links Warning */}
        {unresolvedLinks.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-2 sm:p-3">
            <div className="flex items-start gap-1.5 sm:gap-2">
              <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-amber-800">
                  {unresolvedLinks.length} Unresolved
                </h4>
                <p className="text-[10px] sm:text-xs text-amber-700 mt-0.5">
                  Cards shown but not determined
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <div className="bg-emerald-50 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600">
              {cardOwnedDeductions.length}
            </div>
            <div className="text-[9px] sm:text-xs text-emerald-700 font-medium leading-tight">
              <span className="hidden sm:inline">Cards Found</span>
              <span className="sm:hidden">Found</span>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600">
              {linkResolvedDeductions.length}
            </div>
            <div className="text-[9px] sm:text-xs text-purple-700 font-medium leading-tight">
              <span className="hidden sm:inline">Links</span>
              <span className="sm:hidden">Links</span>
            </div>
          </div>
          <div className="bg-amber-50 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-amber-600">
              {envelopeDeductions.length}
            </div>
            <div className="text-[9px] sm:text-xs text-amber-700 font-medium leading-tight">Envelope</div>
          </div>
        </div>

        {/* Recent Deductions */}
        <div className="flex-1 min-h-0">
          <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            Recent Deductions
          </h3>
          
          {recentDeductions.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-400">
              <Lightbulb className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 opacity-50" />
              <p className="text-xs sm:text-sm">No deductions yet</p>
              <p className="text-[10px] sm:text-xs">Record suggestions to see insights</p>
            </div>
          ) : (
            <ScrollArea className="h-[200px] sm:h-[300px] pr-1 sm:pr-2">
              <div className="space-y-1.5 sm:space-y-2">
                {recentDeductions.map((deduction, index) => (
                  <div
                    key={deduction.id}
                    className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-start gap-1.5 sm:gap-2">
                      <div className="mt-0.5 flex-shrink-0">
                        <DeductionIcon type={deduction.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-800 leading-tight break-words">
                          {deduction.description}
                        </p>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 flex-wrap">
                          <DeductionBadge type={deduction.type} />
                          {deduction.sourceSuggestionId && (
                            <span className="text-[10px] sm:text-xs text-gray-400">
                              from suggestion
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

