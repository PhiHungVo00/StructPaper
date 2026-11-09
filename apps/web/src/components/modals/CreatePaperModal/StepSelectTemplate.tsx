'use client';

import React, { useState } from 'react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { ManagedJournalProfile, getDefaultVnuhcmJournals } from '@/lib/templates/journal-storage';
import { CompactTemplateCard } from './CompactTemplateCard';

interface StepSelectTemplateProps {
  onSelectTemplate: (managed: ManagedJournalProfile) => void;
  onBack: () => void;
  selectedJournalId?: string;
}

export const StepSelectTemplate: React.FC<StepSelectTemplateProps> = ({
  onSelectTemplate,
  onBack,
  selectedJournalId,
}) => {
  const journals = getDefaultVnuhcmJournals();
  const [selected, setSelected] = useState<string>(selectedJournalId || journals[0]?.id || 'std');

  const handleChoose = (managed: ManagedJournalProfile) => {
    setSelected(managed.id);
    onSelectTemplate(managed);
  };

  return (
    <div className="space-y-4">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại tải file</span>
        </button>

        <span className="text-[11px] font-bold text-slate-400">
          7 Mẫu tạp chí ĐHQG-HCM
        </span>
      </div>

      {/* Grid of Compact Template Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
        {journals.map((journal) => (
          <CompactTemplateCard
            key={journal.id}
            managed={journal}
            isSelected={selected === journal.id}
            onSelect={handleChoose}
          />
        ))}
      </div>
    </div>
  );
};
