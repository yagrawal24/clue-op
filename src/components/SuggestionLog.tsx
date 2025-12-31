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
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          Suggestion Log
          <Badge className="ml-auto bg-gray-100 text-gray-700 border-0">
            {suggestions.length} total
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0">
        {suggestions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No suggestions recorded</p>
            <p className="text-sm mt-1">Record a suggestion to start tracking</p>
          </div>
        ) : (
          <ScrollArea className={`h-full max-h-[${maxHeight}]`}>
            <div className="space-y-3 pr-2">
              {sortedSuggestions.map((suggestion, index) => {
                const suggester = getPlayer(suggestion.suggesterId);
                const shower = suggestion.showerId ? getPlayer(suggestion.showerId) : null;
                const link = getLink(suggestion.linkId);
                const nobodyShowed = suggestion.passedPlayerIds.length === players.length - 1;
                
                return (
                  <div
                    key={suggestion.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    {/* Turn number and timestamp */}
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                        Turn {suggestion.turnNumber}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(suggestion.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>

                    {/* Suggester */}
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: suggester?.color || '#6b7280' }}
                      >
                        {suggester?.name[0] || '?'}
                      </div>
                      <span className="font-semibold text-sm">{suggester?.name || 'Unknown'}</span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                    </div>

                    {/* Suggestion cards */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <Badge className="bg-rose-100 text-rose-700 border-0 text-xs">
                        {suggestion.suspect}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                        {suggestion.weapon}
                      </Badge>
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                        {suggestion.room}
                      </Badge>
                    </div>

                    {/* Response */}
                    <div className="pt-2 border-t border-gray-200">
                      {nobodyShowed ? (
                        <div className="flex items-center gap-2 text-amber-600">
                          <EyeOff className="w-4 h-4" />
                          <span className="text-sm font-medium">Nobody showed a card!</span>
                        </div>
                      ) : shower ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-emerald-500" />
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                              style={{ backgroundColor: shower.color }}
                            >
                              {shower.name[0]}
                            </div>
                            <span className="text-sm font-medium">{shower.name} showed</span>
                            {suggestion.shownCard ? (
                              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                                {suggestion.shownCard}
                              </Badge>
                            ) : link && !link.resolved ? (
                              <Badge className="bg-amber-100 text-amber-700 border-0 text-xs flex items-center gap-1">
                                <Link2 className="w-3 h-3" />
                                One of: {link.possibleCards.join(', ')}
                              </Badge>
                            ) : link?.resolved ? (
                              <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">
                                Deduced: {link.resolvedCard}
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-400">unknown card</span>
                            )}
                          </div>
                        </div>
                      ) : null}

                      {/* Passed players */}
                      {suggestion.passedPlayerIds.length > 0 && !nobodyShowed && (
                        <div className="flex items-center gap-2 mt-2 text-gray-500">
                          <SkipForward className="w-3 h-3" />
                          <span className="text-xs">
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

