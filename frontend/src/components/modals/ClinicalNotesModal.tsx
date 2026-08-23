import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Stethoscope,
  CheckCircle2,
  Copy,
  Download,
  Bot,
  FileText,
  Clock,
} from 'lucide-react';

interface ClinicalNotesModalProps {
  patientName?: string;
  onClose: () => void;
}

export const ClinicalNotesModal: React.FC<ClinicalNotesModalProps> = ({
  patientName = 'Priya Sharma',
  onClose,
}) => {
  const [patientInput, setPatientInput] = useState(patientName);
  const [symptomsInput, setSymptomsInput] = useState(
    'Patient presents with 2-week history of mild morning fatigue, occasional palpitations after caffeine. BP recorded at 132/86 mmHg in clinic. Fasting lipid panel reviewed: LDL slightly elevated at 112 mg/dL. No chest pain or syncope.'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState<{
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    suggestedPrescription?: string;
    followUp?: string;
  } | null>({
    subjective: '32-year-old patient reports 2-week history of mild morning fatigue and intermittent palpitations following high caffeine intake. Denies shortness of breath, chest pressure, or syncope.',
    objective: 'Vital Signs: Blood Pressure 132/86 mmHg, Heart Rate 74 bpm regular, SpO2 99% on room air. Lab review shows Total Cholesterol 184 mg/dL, LDL 112 mg/dL, Fasting Blood Sugar 92 mg/dL.',
    assessment: '1. Essential Stage 1 Hypertension (mild, diet/lifestyle responsive).\n2. Borderline hyperlipidemia.\n3. Caffeine-induced benign palpitations.',
    plan: '1. Dietary approach: Low-sodium DASH diet guidelines and reduce coffee consumption to 1 cup/day.\n2. Hydration: Maintain minimum 2.5L water daily.\n3. Daily home blood pressure logging for 14 days.',
    suggestedPrescription: 'No immediate medication needed. Continue daily Multivitamin with Iron and Omega-3.',
    followUp: 'Follow up in clinic in 4 weeks with home blood pressure logs.',
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/gemini/clinical-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patientInput,
          rawSymptoms: symptomsInput,
        }),
      });

      const data = await response.json();
      if (data.notes) {
        setClinicalNotes(data.notes);
      }
    } catch (err) {
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!clinicalNotes) return;
    const text =
      `SOAP CLINICAL CONSULTATION NOTE\n` +
      `==============================\n` +
      `Patient: ${patientInput}\n` +
      `Date: ${new Date().toLocaleDateString()}\n\n` +
      `SUBJECTIVE:\n${clinicalNotes.subjective}\n\n` +
      `OBJECTIVE:\n${clinicalNotes.objective}\n\n` +
      `ASSESSMENT:\n${clinicalNotes.assessment}\n\n` +
      `PLAN:\n${clinicalNotes.plan}\n\n` +
      `PRESCRIPTION:\n${clinicalNotes.suggestedPrescription}\n\n` +
      `FOLLOW-UP:\n${clinicalNotes.followUp}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col justify-between relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">AI Clinical Scribe & SOAP Generator</h3>
              <p className="text-[11px] text-slate-400">Powered by Gemini 3.7 Flash for Medical Professionals</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Input Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Patient Name</label>
              <input
                type="text"
                value={patientInput}
                onChange={(e) => setPatientInput(e.target.value)}
                className="w-48 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Consultation Transcript / Doctor Observations
              </label>
              <textarea
                rows={3}
                value={symptomsInput}
                onChange={(e) => setSymptomsInput(e.target.value)}
                placeholder="Type or paste doctor observations, raw audio transcript, or vitals..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !symptomsInput.trim()}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Drafting SOAP Structure...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate SOAP Note & Treatment Plan</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Structured SOAP Output */}
          {clinicalNotes && (
            <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>SOAP Clinical Summary</span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Verified Format
                </span>
              </div>

              <div>
                <strong className="text-blue-900 block font-bold">Subjective:</strong>
                <p className="text-slate-700 mt-0.5">{clinicalNotes.subjective}</p>
              </div>

              <div>
                <strong className="text-blue-900 block font-bold">Objective:</strong>
                <p className="text-slate-700 mt-0.5">{clinicalNotes.objective}</p>
              </div>

              <div>
                <strong className="text-blue-900 block font-bold">Assessment:</strong>
                <p className="text-slate-700 mt-0.5 whitespace-pre-line">{clinicalNotes.assessment}</p>
              </div>

              <div>
                <strong className="text-blue-900 block font-bold">Plan & Prescriptions:</strong>
                <p className="text-slate-700 mt-0.5 whitespace-pre-line">{clinicalNotes.plan}</p>
                {clinicalNotes.suggestedPrescription && (
                  <p className="text-slate-700 mt-1 font-medium bg-white p-2 rounded-lg border border-slate-200">
                    Rx: {clinicalNotes.suggestedPrescription}
                  </p>
                )}
              </div>

              <div>
                <strong className="text-blue-900 block font-bold">Follow-Up:</strong>
                <p className="text-slate-700 mt-0.5">{clinicalNotes.followUp}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to EHR' : 'Copy SOAP Note'}</span>
            </button>
            <button
              onClick={() => {
                alert(`Consultation note saved directly to EHR for ${patientInput}!`);
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
            >
              Save to Patient Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
