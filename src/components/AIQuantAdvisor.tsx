import React, { useState } from 'react';
import { Sparkles, Brain, AlertCircle, RefreshCw, Compass, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AIAnalysisResult } from '../types';

interface AIQuantAdvisorProps {
  selectedSymbol: string;
  aiAnalysis: AIAnalysisResult | null;
  isLoading: boolean;
  onRunAudit: () => void;
}

export const AIQuantAdvisor: React.FC<AIQuantAdvisorProps> = ({
  selectedSymbol,
  aiAnalysis,
  isLoading,
  onRunAudit,
}) => {
  const getRegimeColor = (regime?: string) => {
    switch (regime) {
      case 'BULLISH_EXPANSION':
        return 'bg-emerald-950/60 border-emerald-700/60 text-emerald-400';
      case 'BEARISH_TREND':
        return 'bg-rose-950/60 border-rose-700/60 text-rose-400';
      case 'VOLATILITY_COMPRESSION':
        return 'bg-amber-950/60 border-amber-700/60 text-amber-400';
      case 'LIQUIDITY_HUNT':
        return 'bg-purple-950/60 border-purple-700/60 text-purple-400';
      default:
        return 'bg-blue-950/60 border-blue-700/60 text-blue-400';
    }
  };

  return (
    <div id="ai-quant-advisor-panel" className="bg-[#0b101c] border border-[#1a253d] rounded-xl flex flex-col h-full overflow-hidden text-xs font-mono select-none">
      {/* Header */}
      <div className="bg-[#0e1526] border-b border-[#1c2842] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-200 font-bold">
          <Brain className="w-3.5 h-3.5 text-cyan-400" />
          <span className="truncate">
            {aiAnalysis?.modelUsed && aiAnalysis.source === 'QUANT_ENGINE_FALLBACK'
              ? 'AI QUANT REASONING (QUANT CORE)'
              : aiAnalysis?.modelUsed
              ? `AI QUANT REASONING (${aiAnalysis.modelUsed.toUpperCase()})`
              : 'AI QUANT REASONING (GEMINI 3.8 FLASH)'}
          </span>
          {aiAnalysis?.source === 'QUANT_ENGINE_FALLBACK' ? (
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] bg-amber-950/60 border border-amber-600/40 text-amber-300">
              Auto Quant Engine
            </span>
          ) : aiAnalysis?.source === 'GEMINI_AI' ? (
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] bg-cyan-950/60 border border-cyan-600/40 text-cyan-300">
              Live AI Model
            </span>
          ) : null}
        </div>
        <button
          type="button"
          disabled={isLoading}
          onClick={onRunAudit}
          className="px-2.5 py-1 rounded bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 text-cyan-300 transition-all flex items-center gap-1 text-[11px] disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Synthesizing...' : 'Run Audit'}</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-3.5 flex-1 overflow-y-auto space-y-3">
        {aiAnalysis ? (
          <>
            {/* Regime Badge & Confidence */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0e1628] border border-[#1d2b47]">
              <div>
                <span className="text-[10px] text-slate-400 block">Identified Market Regime:</span>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold border ${getRegimeColor(aiAnalysis.regime)}`}>
                  {aiAnalysis.regime.replace('_', ' ')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Confidence Score:</span>
                <span className="text-sm font-bold text-slate-100">
                  {(aiAnalysis.confidenceScore * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Factor Scores Matrix */}
            {aiAnalysis.factors && (
              <div className="grid grid-cols-2 gap-2 bg-[#0e1628] border border-[#1d2b47] rounded-lg p-2.5">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Momentum Score:</span>
                    <span className={aiAnalysis.factors.momentumScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {aiAnalysis.factors.momentumScore > 0 ? '+' : ''}{aiAnalysis.factors.momentumScore}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${aiAnalysis.factors.momentumScore >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(100, Math.abs(aiAnalysis.factors.momentumScore))}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Volatility Risk:</span>
                    <span className={aiAnalysis.factors.volatilityRisk > 60 ? 'text-rose-400' : 'text-amber-400'}>
                      {aiAnalysis.factors.volatilityRisk}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${aiAnalysis.factors.volatilityRisk}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Liquidity Depth:</span>
                    <span className="text-cyan-400">{aiAnalysis.factors.liquidityDepth}/100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500"
                      style={{ width: `${aiAnalysis.factors.liquidityDepth}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Order Flow Bias:</span>
                    <span className={aiAnalysis.factors.orderFlowBias >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {aiAnalysis.factors.orderFlowBias > 0 ? '+' : ''}{aiAnalysis.factors.orderFlowBias}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${aiAnalysis.factors.orderFlowBias >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(100, Math.abs(aiAnalysis.factors.orderFlowBias))}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Macro Assessment */}
            <div className="bg-[#0e1628] border border-[#1d2b47] rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-xs">
                <Compass className="w-3.5 h-3.5 text-blue-400" />
                <span>Multi-Factor Market Synthesis</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {aiAnalysis.macroAssessment}
              </p>
            </div>

            {/* Algorithmic Recommendation */}
            <div className="bg-[#0e1628] border border-emerald-900/40 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Autonomous Execution Directive</span>
              </div>
              <p className="text-[11px] text-slate-200 leading-relaxed font-medium">
                {aiAnalysis.recommendedAction}
              </p>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-[#1c2a44]">
                Preferred Strategy: <span className="text-cyan-400 font-semibold">{aiAnalysis.preferredStrategy}</span>
              </div>
            </div>

            {/* Risk Advisory */}
            <div className="bg-[#1a1215] border border-rose-900/40 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-rose-300 leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-rose-400">Risk Advisory:</span>
                {aiAnalysis.riskAdvisory}
              </div>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-slate-400 space-y-3">
            <Sparkles className="w-6 h-6 text-cyan-400 mx-auto opacity-80" />
            <p className="text-xs">
              Click &ldquo;Run Audit&rdquo; to trigger server-side Gemini 3.8 Flash multi-factor quantitative diagnosis on {selectedSymbol}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
