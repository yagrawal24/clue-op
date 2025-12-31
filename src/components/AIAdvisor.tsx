'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  Brain,
  Loader2,
  Send,
  MessageSquare,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import {
  Player,
  Suggestion,
  Deduction,
  KnowledgeMatrix,
  CardLink
} from '@/lib/types';

interface AIAdvisorProps {
  knowledgeMatrix: KnowledgeMatrix;
  suggestions: Suggestion[];
  deductions: Deduction[];
  players: Player[];
  myPlayerId: string | null;
  cardLinks: CardLink[];
  currentTurn: number;
  notes: string;
  solvedEnvelope: {
    suspect: string | null;
    weapon: string | null;
    room: string | null;
  };
}

export const AIAdvisor = ({
  knowledgeMatrix,
  suggestions,
  deductions,
  players,
  myPlayerId,
  cardLinks,
  currentTurn,
  notes,
  solvedEnvelope
}: AIAdvisorProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [customAnswer, setCustomAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);

  const callAdvisorAPI = async (question?: string): Promise<string> => {
    const response = await fetch('/api/advisor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        knowledgeMatrix,
        suggestions,
        deductions,
        players,
        myPlayerId,
        cardLinks,
        solvedEnvelope,
        notes,
        currentTurn,
        customQuestion: question,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to get AI advice');
    }

    const data = await response.json();
    return data.response;
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await callAdvisorAPI();
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCustomQuestion = async () => {
    if (!customQuestion.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await callAdvisorAPI(customQuestion);
      setCustomAnswer(result);
    } catch (err) {
      setCustomAnswer(err instanceof Error ? err.message : 'Failed to process question. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatAnalysis = (text: string) => {
    // Convert markdown-style formatting to styled elements
    return text.split('\n').map((line, i) => {
      // Headers (bold with **)
      if (line.match(/^\d+\.\s*\*\*.*\*\*:/)) {
        const match = line.match(/^\d+\.\s*\*\*(.*?)\*\*:(.*)/);
        if (match) {
          return (
            <div key={i} className="mb-2 sm:mb-3">
              <h3 className="font-bold text-indigo-700 text-xs sm:text-sm mb-0.5 sm:mb-1 leading-tight">{match[1]}</h3>
              {match[2] && <p className="text-gray-700 text-xs sm:text-sm leading-snug">{match[2].trim()}</p>}
            </div>
          );
        }
      }
      
      // Bold text (**text**)
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="text-xs sm:text-sm text-gray-700 mb-1.5 sm:mb-2 leading-relaxed">
            {parts.map((part, j) => 
              j % 2 === 1 ? <strong key={j} className="font-semibold text-gray-900">{part}</strong> : part
            )}
          </p>
        );
      }
      
      // Bullet points
      if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        return (
          <p key={i} className="text-xs sm:text-sm text-gray-700 mb-1 pl-2 sm:pl-3 leading-relaxed">
            <span className="text-indigo-400 mr-1.5 sm:mr-2">•</span>
            {line.replace(/^[\s\-•]+/, '')}
          </p>
        );
      }
      
      // Empty lines
      if (!line.trim()) {
        return <div key={i} className="h-1.5 sm:h-2" />;
      }
      
      // Regular text
      return <p key={i} className="text-xs sm:text-sm text-gray-700 mb-1.5 sm:mb-2 leading-relaxed">{line}</p>;
    });
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 flex flex-col h-full max-h-full overflow-hidden">
      <CardHeader className="pb-2 sm:pb-3 flex-shrink-0 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="text-base sm:text-xl font-bold flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="truncate">AI Strategist</span>
          <span className="ml-auto text-[10px] sm:text-xs font-normal text-blue-500 bg-blue-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0">
            Gemini
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0 space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6 overflow-hidden">
        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 h-10 sm:h-12 text-sm sm:text-base font-semibold shadow-lg shadow-indigo-200 flex-shrink-0"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
              <span className="hidden sm:inline">Analyzing with AI...</span>
              <span className="sm:hidden">Analyzing...</span>
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="hidden sm:inline">Get Strategic Advice</span>
              <span className="sm:hidden">Get Advice</span>
            </>
          )}
        </Button>

        {/* Game Stats Summary */}
        <div className="flex gap-1.5 sm:gap-2 text-xs flex-shrink-0">
          <div className="flex-1 bg-white rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-indigo-100 text-center min-w-0">
            <div className="font-bold text-indigo-600 text-sm sm:text-base">{currentTurn}</div>
            <div className="text-gray-500 text-[10px] sm:text-xs truncate">Turn</div>
          </div>
          <div className="flex-1 bg-white rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-indigo-100 text-center min-w-0">
            <div className="font-bold text-indigo-600 text-sm sm:text-base">{suggestions.length}</div>
            <div className="text-gray-500 text-[10px] sm:text-xs truncate">Suggests</div>
          </div>
          <div className="flex-1 bg-white rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-indigo-100 text-center min-w-0">
            <div className="font-bold text-indigo-600 text-sm sm:text-base">{deductions.length}</div>
            <div className="text-gray-500 text-[10px] sm:text-xs truncate">Deducts</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 text-xs sm:text-sm text-red-700 flex items-start gap-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1 scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-transparent">
          {/* Analysis Results */}
          {analysis && (
            <div className="mb-3 sm:mb-4">
              <div className="bg-white rounded-lg p-3 sm:p-4 border border-indigo-100 shadow-sm">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 flex-shrink-0" />
                    <h3 className="font-bold text-xs sm:text-sm text-gray-800">AI Analysis</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="h-6 sm:h-7 px-1.5 sm:px-2 text-indigo-500 hover:text-indigo-700"
                  >
                    <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none">
                  {formatAnalysis(analysis)}
                </div>
              </div>
            </div>
          )}

          {!analysis && !error && (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <div className="text-center text-gray-400 px-4">
                <Brain className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                <p className="text-xs sm:text-sm leading-relaxed">Click above to analyze the current board state with AI</p>
              </div>
            </div>
          )}

          {customAnswer && (
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-indigo-100 text-xs sm:text-sm text-gray-700 shadow-sm">
              <div className="prose prose-sm max-w-none">
                {formatAnalysis(customAnswer)}
              </div>
            </div>
          )}
        </div>

        {/* Custom Question - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-indigo-200 pt-3 sm:pt-4 -mx-3 sm:-mx-6 px-3 sm:px-6 pb-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 flex-shrink-0" />
            <h3 className="font-bold text-xs sm:text-sm text-gray-800">Ask the Strategist</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Textarea
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="e.g., Should I accuse now?"
              className="h-20 sm:h-10 min-h-[40px] resize-none text-xs sm:text-sm bg-white flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCustomQuestion();
                }
              }}
            />
            <Button
              size="sm"
              onClick={handleCustomQuestion}
              disabled={isAnalyzing || !customQuestion.trim()}
              className="px-3 sm:px-4 bg-indigo-500 hover:bg-indigo-600 h-10 flex-shrink-0 w-full sm:w-auto"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-0" />
              <span className="sm:hidden ml-2">Send</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
