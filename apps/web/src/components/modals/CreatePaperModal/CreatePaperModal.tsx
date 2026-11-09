'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, BookOpen, FileText } from 'lucide-react';
import { ModalPortal } from '@/components/modals/ModalPortal';
import { StepUploadFile } from './StepUploadFile';
import { StepSelectTemplate } from './StepSelectTemplate';
import { ManagedJournalProfile } from '@/lib/templates/journal-storage';
import { createEmptyPaper, CompletePaper } from '@/types/paper';
import { usePaper } from '@/context/PaperContext';
import { usePaperStorage } from '@/hooks/usePaperStorage';
import { toast } from '@/components/DynamicIslandToast';

interface CreatePaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedManaged?: ManagedJournalProfile | null;
  onPaperCreated?: (paper: CompletePaper) => void;
}

const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

export const CreatePaperModal: React.FC<CreatePaperModalProps> = ({
  isOpen,
  onClose,
  preselectedManaged = null,
  onPaperCreated,
}) => {
  const router = useRouter();
  const { setPaper, setCurrentJournal } = usePaper();
  const { savePaper } = usePaperStorage();

  const [step, setStep] = useState<1 | 2>(1);
  const [parsedPaper, setParsedPaper] = useState<CompletePaper | null>(null);
  const [isBlank, setIsBlank] = useState<boolean>(false);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setParsedPaper(null);
      setIsBlank(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const targetJournalCode = preselectedManaged
    ? `VNUHCM-${preselectedManaged.id.toUpperCase()}`
    : undefined;
  const targetJournalName = preselectedManaged
    ? preselectedManaged.profile.names?.vi || preselectedManaged.profile.names?.short
    : undefined;

  // Finalize paper creation with chosen template
  const finalizeCreation = async (managed: ManagedJournalProfile, docxPaper?: CompletePaper | null) => {
    try {
      const journalCode = `VNUHCM-${managed.id.toUpperCase()}`;
      let finalPaper: CompletePaper;

      if (docxPaper) {
        finalPaper = {
          ...docxPaper,
          metadata: {
            ...docxPaper.metadata,
            journalId: journalCode,
            journalName: managed.profile.names?.vi || managed.profile.names?.en || managed.id,
            journalAbbv: managed.profile.names?.short || managed.id.toUpperCase(),
          },
        };
      } else {
        finalPaper = createEmptyPaper(journalCode);
        finalPaper.metadata.journalName =
          managed.profile.names?.vi || managed.profile.names?.en || managed.id;
        finalPaper.metadata.journalAbbv =
          managed.profile.names?.short || managed.id.toUpperCase();
      }

      setPaper(finalPaper);
      setCurrentJournal(journalCode);

      try {
        await savePaper(finalPaper);
      } catch (saveErr) {
        console.warn('Background save error:', saveErr);
      }

      toast.success(
        'Khởi tạo bài báo thành công',
        `Đã tạo bài báo mới theo chuẩn "${managed.profile.names?.short || managed.id.toUpperCase()}"`
      );

      if (onPaperCreated) {
        onPaperCreated(finalPaper);
      }

      onClose();
      router.push('/editor');
    } catch (err: any) {
      console.error('Lỗi khởi tạo bài báo:', err);
      toast.error('Lỗi khởi tạo bài báo', err?.message || 'Có lỗi xảy ra');
    }
  };

  // Step 1 completed
  const handleStep1Complete = async (result: {
    parsedPaper?: CompletePaper;
    isBlank: boolean;
  }) => {
    setParsedPaper(result.parsedPaper || null);
    setIsBlank(result.isBlank);

    // If preselected journal is already known (e.g. from /templates), finalize immediately!
    if (preselectedManaged) {
      await finalizeCreation(preselectedManaged, result.parsedPaper);
      return;
    }

    // Otherwise proceed to Step 2 (Choose Template)
    setStep(2);
  };

  // Step 2 completed
  const handleStep2Complete = async (managed: ManagedJournalProfile) => {
    await finalizeCreation(managed, isBlank ? null : parsedPaper);
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <motion.div
        data-testid="create-paper-modal"
        initial={isTest ? undefined : { opacity: 0, scale: 0.94, y: 24 }}
        animate={isTest ? undefined : { opacity: 1, scale: 1, y: 0 }}
        exit={isTest ? undefined : { opacity: 0, scale: 0.94, y: 24 }}
        transition={isTest ? { duration: 0 } : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#F8F9FA] w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col border border-white/20 select-text"
      >
        {/* Header - Eatzy OrderDetailsModal Identity */}
        <div className="bg-white px-7 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-2xl bg-[#78C841]/15 text-[#14532D] flex items-center justify-center font-bold">
                {step === 1 ? (
                  <FileText className="w-4 h-4 text-[#14532D]" strokeWidth={2.5} />
                ) : (
                  <BookOpen className="w-4 h-4 text-[#14532D]" strokeWidth={2.5} />
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {step === 1 ? 'TẠO BÀI BÁO MỚI' : 'CHỌN MẪU TẠP CHÍ'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 pl-0.5">
              {step === 1
                ? targetJournalName
                  ? `Tải lên bản thảo DOCX cho ${targetJournalName}`
                  : 'Tải lên bản thảo DOCX hoặc bắt đầu với trang trắng'
                : 'Chọn 1 trong 7 mẫu định dạng chuẩn ĐHQG-HCM'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-all cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content with Horizontal Step Slider */}
        <div className="p-6 sm:p-7">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="create-paper-step-1"
                initial={isTest ? undefined : { opacity: 0, x: -20 }}
                animate={isTest ? undefined : { opacity: 1, x: 0 }}
                exit={isTest ? undefined : { opacity: 0, x: -20 }}
                transition={isTest ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' }}
              >
                <StepUploadFile
                  onSuccess={handleStep1Complete}
                  targetJournalName={targetJournalName}
                  targetJournalCode={targetJournalCode}
                />
              </motion.div>
            ) : (
              <motion.div
                key="create-paper-step-2"
                initial={isTest ? undefined : { opacity: 0, x: 20 }}
                animate={isTest ? undefined : { opacity: 1, x: 0 }}
                exit={isTest ? undefined : { opacity: 0, x: 20 }}
                transition={isTest ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' }}
              >
                <StepSelectTemplate
                  onConfirm={handleStep2Complete}
                  onBack={() => setStep(1)}
                  selectedJournalId={parsedPaper?.metadata?.journalId?.replace('VNUHCM-', '').toLowerCase()}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom 2 Dots Indicator (as requested: "dưới cùng có 2 cái chấm nhỏ xíu là được rồi") */}
          {!preselectedManaged && (
            <div className="flex items-center justify-center gap-1.5 pt-5 pb-1">
              <span
                className={`transition-all duration-300 rounded-full ${
                  step === 1 ? 'w-5 h-1.5 bg-[#78C841]' : 'w-1.5 h-1.5 bg-slate-300'
                }`}
              />
              <span
                className={`transition-all duration-300 rounded-full ${
                  step === 2 ? 'w-5 h-1.5 bg-[#78C841]' : 'w-1.5 h-1.5 bg-slate-300'
                }`}
              />
            </div>
          )}
        </div>
      </motion.div>
    </ModalPortal>
  );
};
