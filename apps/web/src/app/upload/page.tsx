'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePaper } from '@/context/PaperContext';
import { UploadView } from '@/components/UploadView';
import { CompletePaper } from '@/lib/sample-papers';

export default function UploadPage() {
  const router = useRouter();
  const { paper, setPaper } = usePaper();

  const handlePaperLoaded = (newPaper: CompletePaper) => {
    setPaper(newPaper);
    // After upload, navigate directly to Editor & Live Preview!
    router.push('/editor');
  };

  return <UploadView onPaperLoaded={handlePaperLoaded} currentPaper={paper} />;
}
