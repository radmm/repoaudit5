import React, { useState } from 'react';
import { BrutalistCard } from '../common/GlassCard';
import { CorpusValidationView } from '../corpus/CorpusValidationView';
import { OOPArchitectureModal } from '../oop/OOPArchitectureModal';
import { CheckMark, CodeMark } from '../common/BrutalistIcon';

interface ReviewMaterialsProps {
  initialSection?: 'corpus' | 'oop';
  onClose: () => void;
  onRunTestRepo: (repoUrl: string) => void;
}

export const ReviewMaterialsModal: React.FC<ReviewMaterialsProps> = ({
  initialSection = 'corpus',
  onClose,
  onRunTestRepo,
}) => {
  const [section, setSection] = useState<'corpus' | 'oop'>(initialSection);

  return (
    <div className="space-y-4">
      {/* Top Bar with Tab switcher and Close button */}
      <BrutalistCard bg="white" className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#D7FF3E] border border-[#0D0D0D]">
              ACADEMIC EVALUATION ARTIFACTS
            </span>
            <h1 className="font-display font-extrabold text-xl sm:text-2xl text-[#0D0D0D] mt-1">
              PROJECT DOCUMENTATION & REVIEW MATERIALS
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSection('corpus')}
              className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 border-[#0D0D0D] transition-all cursor-pointer flex items-center gap-1.5 ${
                section === 'corpus'
                  ? 'bg-[#0D0D0D] text-white shadow-[2px_2px_0px_#0D0D0D]'
                  : 'bg-[#F2EFE9] text-[#0D0D0D] hover:bg-white'
              }`}
            >
              <CheckMark size={14} />
              <span>Section 9 (Validation)</span>
            </button>
            <button
              onClick={() => setSection('oop')}
              className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 border-[#0D0D0D] transition-all cursor-pointer flex items-center gap-1.5 ${
                section === 'oop'
                  ? 'bg-[#0D0D0D] text-white shadow-[2px_2px_0px_#0D0D0D]'
                  : 'bg-[#F2EFE9] text-[#0D0D0D] hover:bg-white'
              }`}
            >
              <CodeMark size={14} />
              <span>Section 10 (OOP Core)</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase border-2 border-[#0D0D0D] hover:bg-black transition-all cursor-pointer"
            >
              Back to App
            </button>
          </div>
        </div>
      </BrutalistCard>

      {/* Render Selected Artifact */}
      {section === 'corpus' ? (
        <CorpusValidationView onRunTestRepo={onRunTestRepo} />
      ) : (
        <OOPArchitectureModal />
      )}
    </div>
  );
};
