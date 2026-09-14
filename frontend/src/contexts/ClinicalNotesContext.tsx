import React, { createContext, useCallback, useContext, useState } from 'react';

interface ClinicalNotesContextValue {
  showClinicalNotesModal: boolean;
  activePatientForNotes: string;
  openClinicalNotes: (patientName?: string) => void;
  closeClinicalNotes: () => void;
}

const ClinicalNotesContext = createContext<ClinicalNotesContextValue | null>(null);

export function ClinicalNotesProvider({ children }: { children: React.ReactNode }) {
  const [showClinicalNotesModal, setShowClinicalNotesModal] = useState(false);
  const [activePatientForNotes, setActivePatientForNotes] = useState('Priya Sharma');

  const openClinicalNotes = useCallback((patientName?: string) => {
    if (patientName) setActivePatientForNotes(patientName);
    setShowClinicalNotesModal(true);
  }, []);

  const closeClinicalNotes = useCallback(() => {
    setShowClinicalNotesModal(false);
  }, []);

  return (
    <ClinicalNotesContext.Provider
      value={{
        showClinicalNotesModal,
        activePatientForNotes,
        openClinicalNotes,
        closeClinicalNotes,
      }}
    >
      {children}
    </ClinicalNotesContext.Provider>
  );
}

export function useClinicalNotes(): ClinicalNotesContextValue {
  const ctx = useContext(ClinicalNotesContext);
  if (!ctx) throw new Error('useClinicalNotes must be used within a ClinicalNotesProvider');
  return ctx;
}
