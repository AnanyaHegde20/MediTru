import React, { createContext, useCallback, useContext, useState } from 'react';
import { LabReport } from '../types';

interface AIAssistantContextValue {
  aiInitialQuery: string | undefined;
  selectedReport: LabReport | null;
  setAiInitialQuery: (query: string | undefined) => void;
  setSelectedReport: (report: LabReport | null) => void;
  quickAskAI: (query: string) => void;
  askAIAboutReport: (report: LabReport) => void;
}

const AIAssistantContext = createContext<AIAssistantContextValue | null>(null);

export function AIAssistantProvider({ children }: { children: React.ReactNode }) {
  const [aiInitialQuery, setAiInitialQuery] = useState<string | undefined>(undefined);
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);

  const quickAskAI = useCallback((query: string) => {
    setAiInitialQuery(query);
  }, []);

  const askAIAboutReport = useCallback((report: LabReport) => {
    setAiInitialQuery(
      `Please provide a detailed clinical review of my ${report.name} dated ${report.date}. Status is ${report.status}. What should I discuss with ${report.doctorName}?`
    );
  }, []);

  return (
    <AIAssistantContext.Provider
      value={{
        aiInitialQuery,
        selectedReport,
        setAiInitialQuery,
        setSelectedReport,
        quickAskAI,
        askAIAboutReport,
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  );
}

export function useAIAssistant(): AIAssistantContextValue {
  const ctx = useContext(AIAssistantContext);
  if (!ctx) throw new Error('useAIAssistant must be used within an AIAssistantProvider');
  return ctx;
}
