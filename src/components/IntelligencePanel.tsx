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
  const cardOwnedDeductions = deductions.filter(d => d.type === 'card_owned' || d.type === 'manual_adjustment');
  const linkResolvedDeductions = deductions.filter(d => d.type === 'link_resolved');
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
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          Intelligence Panel
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0 space-y-4">
        {/* Solution Status */}
        <div className={`rounded-lg p-4 ${isSolved ? 'bg-gradient-to-br from-amber-100 to-amber-50 border-2 border-amber-300' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-500" />
              Solution Progress
            </h3>
            {isSolved && (
              <div className="flex items-center gap-1 text-amber-600">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold">SOLVED!</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Suspect:</span>
              {solvedEnvelope.suspect ? (
                <Badge className="bg-emerald-500 text-white border-0">
                  {solvedEnvelope.suspect}
                </Badge>
              ) : (
                <span className="text-sm text-gray-400">Unknown</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Weapon:</span>
              {solvedEnvelope.weapon ? (
                <Badge className="bg-emerald-500 text-white border-0">
                  {solvedEnvelope.weapon}
                </Badge>
              ) : (
                <span className="text-sm text-gray-400">Unknown</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Room:</span>
              {solvedEnvelope.room ? (
                <Badge className="bg-emerald-500 text-white border-0">
                  {solvedEnvelope.room}
                </Badge>
              ) : (
                <span className="text-sm text-gray-400">Unknown</span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{solutionProgress}/3</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${isSolved ? 'bg-amber-500' : 'bg-blue-500'}`}
                style={{ width: `${(solutionProgress / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Unresolved Links Warning */}
        {unresolvedLinks.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-amber-800">
                  {unresolvedLinks.length} Unresolved Link{unresolvedLinks.length !== 1 ? 's' : ''}
                </h4>
                <p className="text-xs text-amber-700 mt-1">
                  Cards shown but not yet determined which one
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-emerald-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {cardOwnedDeductions.length}
            </div>
            <div className="text-xs text-emerald-700 font-medium">Cards Found</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {linkResolvedDeductions.length}
            </div>
            <div className="text-xs text-purple-700 font-medium">Links Resolved</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {envelopeDeductions.length}
            </div>
            <div className="text-xs text-amber-700 font-medium">Envelope</div>
          </div>
        </div>

        {/* Recent Deductions */}
        <div className="flex-1 min-h-0">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Deductions
          </h3>
          
          {recentDeductions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No deductions yet</p>
              <p className="text-xs">Record suggestions to see insights</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-2">
              <div className="space-y-2">
                {recentDeductions.map((deduction, index) => (
                  <div
                    key={deduction.id}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        <DeductionIcon type={deduction.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 leading-tight">
                          {deduction.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <DeductionBadge type={deduction.type} />
                          {deduction.sourceSuggestionId && (
                            <span className="text-xs text-gray-400">
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

