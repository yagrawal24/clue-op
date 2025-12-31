'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Eye,
  EyeOff,
  SkipForward,
  ArrowRight,
  Link2
} from 'lucide-react';
import { Suggestion, Player, CardLink } from '@/lib/types';

interface SuggestionLogProps {
  suggestions: Suggestion[];
  players: Player[];
  cardLinks: CardLink[];
  maxHeight?: string;
}

export const SuggestionLog = ({
  suggestions,
  players,
  cardLinks,
  maxHeight = "400px"
}: SuggestionLogProps) => {
  const getPlayer = (id: string) => players.find(p => p.id === id);
  
  const getLink = (linkId?: string) => {
    if (!linkId) return null;
    return cardLinks.find(l => l.id === linkId);
  };

  // Reverse to show most recent first
  const sortedSuggestions = [...suggestions].reverse();

  return (
    <Card className="bg-white border-2 border-gray-200 h-full flex flex-col">
      <CardHeader className="pb-2 sm:pb-3 flex-shrink-0 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="text-base sm:text-xl font-bold flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="truncate">Suggestions</span>
          <Badge className="ml-auto bg-gray-100 text-gray-700 border-0 text-[10px] sm:text-xs flex-shrink-0">
            {suggestions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0 px-3 sm:px-6 pb-3 sm:pb-6">
        {suggestions.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-400">
            <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
            <p className="font-medium text-sm sm:text-base">No suggestions recorded</p>
            <p className="text-xs sm:text-sm mt-1">Record a suggestion to start tracking</p>
          </div>
        ) : (
          <ScrollArea className={`h-full max-h-[${maxHeight}]`}>
            <div className="space-y-2 sm:space-y-3 pr-1 sm:pr-2">
              {sortedSuggestions.map((suggestion, index) => {
                const suggester = getPlayer(suggestion.suggesterId);
                const shower = suggestion.showerId ? getPlayer(suggestion.showerId) : null;
                const link = getLink(suggestion.linkId);
                const nobodyShowed = suggestion.passedPlayerIds.length === players.length - 1;
                
                return (
                  <div
                    key={suggestion.id}
                    className="p-2 sm:p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    {/* Turn number and timestamp */}
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] sm:text-xs">
                        Turn {suggestion.turnNumber}
                      </Badge>
                      <span className="text-[10px] sm:text-xs text-gray-400">
                        {new Date(suggestion.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>

                    {/* Suggester */}
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <div
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: suggester?.color || '#6b7280' }}
                      >
                        {suggester?.name[0] || '?'}
                      </div>
                      <span className="font-semibold text-xs sm:text-sm truncate">{suggester?.name || 'Unknown'}</span>
                      <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    </div>

                    {/* Suggestion cards */}
                    <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3">
                      <Badge className="bg-rose-100 text-rose-700 border-0 text-[10px] sm:text-xs">
                        {suggestion.suspect}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] sm:text-xs">
                        {suggestion.weapon}
                      </Badge>
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] sm:text-xs">
                        {suggestion.room}
                      </Badge>
                    </div>

                    {/* Response */}
                    <div className="pt-1.5 sm:pt-2 border-t border-gray-200">
                      {nobodyShowed ? (
                        <div className="flex items-center gap-1.5 sm:gap-2 text-amber-600">
                          <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-medium">Nobody showed</span>
                        </div>
                      ) : shower ? (
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
                            <div
                              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-white text-[9px] sm:text-[10px] font-bold flex-shrink-0"
                              style={{ backgroundColor: shower.color }}
                            >
                              {shower.name[0]}
                            </div>
                            <span className="text-xs sm:text-sm font-medium truncate">{shower.name}</span>
                            {suggestion.shownCard ? (
                              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] sm:text-xs">
                                {suggestion.shownCard}
                              </Badge>
                            ) : link && !link.resolved ? (
                              <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] sm:text-xs flex items-center gap-1 max-w-full">
                                <Link2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                                <span className="truncate">{link.possibleCards.join(', ')}</span>
                              </Badge>
                            ) : link?.resolved ? (
                              <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px] sm:text-xs">
                                {link.resolvedCard}
                              </Badge>
                            ) : (
                              <span className="text-[10px] sm:text-xs text-gray-400">unknown</span>
                            )}
                          </div>
                        </div>
                      ) : null}

                      {/* Passed players */}
                      {suggestion.passedPlayerIds.length > 0 && !nobodyShowed && (
                        <div className="flex items-start gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-gray-500">
                          <SkipForward className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span className="text-[10px] sm:text-xs break-words">
                            Passed: {suggestion.passedPlayerIds.map(id => getPlayer(id)?.name).filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

