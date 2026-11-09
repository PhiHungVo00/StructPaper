'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalPortalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  backdropClassName?: string;
  zIndex?: number;
}

const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

export const ModalPortal: React.FC<ModalPortalProps> = ({
  isOpen,
  onClose,
  children,
  backdropClassName = 'bg-black/45 backdrop-blur-md',
  zIndex = 100,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="modal-portal-root"
          data-testid="modal-portal-root"
          initial={isTest ? undefined : { opacity: 0 }}
          animate={isTest ? undefined : { opacity: 1 }}
          exit={isTest ? undefined : { opacity: 0 }}
          transition={isTest ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 select-none"
          style={{ zIndex }}
        >
          {/* Backdrop overlay */}
          <motion.div
            key="modal-portal-backdrop"
            data-testid="modal-portal-backdrop"
            initial={isTest ? undefined : { opacity: 0 }}
            animate={isTest ? undefined : { opacity: 1 }}
            exit={isTest ? undefined : { opacity: 0 }}
            transition={isTest ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            className={`fixed inset-0 ${backdropClassName}`}
          />

          {/* Modal Content Wrapper (pointer-events-auto) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full flex justify-center pointer-events-auto"
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
