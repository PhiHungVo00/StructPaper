'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePaper } from '@/context/PaperContext';
import { UnifiedEditorView } from '@/components/editor';
import { CompletePaper } from '@/lib/sample-papers';
import { usePaperStorage } from '@/hooks';

function EditorContent() {
  const { paper, updatePaper, setPaper, setCurrentJournal } = usePaper();
  const { loadPaper } = usePaperStorage();
  const searchParams = useSearchParams();
  const paperId = searchParams.get('id');
  const [isLoading, setIsLoading] = useState(Boolean(paperId));

  useEffect(() => {
    if (!paperId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    loadPaper(paperId).then((loaded) => {
      if (isMounted) {
        if (loaded) {
          setPaper(loaded);
          if (loaded.metadata?.journalId) {
            setCurrentJournal(loaded.metadata.journalId);
          }
        }
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [paperId, loadPaper, setPaper, setCurrentJournal]);

  const handleUpdatePaper = (updated: CompletePaper) => {
    updatePaper(updated);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white text-sm font-medium">
        Đang tải bản thảo từ cơ sở dữ liệu...
      </div>
    );
  }

  return (
    <UnifiedEditorView
      paper={paper}
      onUpdatePaper={handleUpdatePaper}
    />
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white text-sm font-medium">
          Đang khởi tạo trình soạn thảo...
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}
