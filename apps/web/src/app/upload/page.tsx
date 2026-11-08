'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePaper } from '@/context/PaperContext';
import { UploadView } from '@/components/UploadView';
import { CompletePaper } from '@/lib/sample-papers';
import { usePaperStorage } from '@/hooks';

export default function UploadPage() {
  const router = useRouter();
  const { paper, setPaper } = usePaper();
  const { savePaper } = usePaperStorage();

  const handlePaperLoaded = (newPaper: CompletePaper) => {
    setPaper(newPaper);
    savePaper(newPaper).catch((err) => {
      console.warn('Failed to background persist uploaded paper:', err);
    });
    // After upload, navigate directly to Editor & Live Preview!
    router.push('/editor');
  };

  return <UploadView onPaperLoaded={handlePaperLoaded} currentPaper={paper} />;
}
