'use client';

import React from 'react';
import { UploadView } from '@/components/UploadView';
import { usePaperUpload } from '@/hooks';

export default function UploadPage() {
  const { currentPaper, handlePaperLoaded } = usePaperUpload();

  return <UploadView onPaperLoaded={handlePaperLoaded} currentPaper={currentPaper} />;
}
