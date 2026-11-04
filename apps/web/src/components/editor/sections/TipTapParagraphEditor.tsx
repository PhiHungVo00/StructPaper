'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import type { Inline } from '@structpaper/doc-model';
import type { PaperReference } from '@/types/paper';
import {
  CiteNode,
  XrefNode,
  MathNode,
  inlinesToTiptapDoc,
  tiptapDocToInlines,
  tiptapDocToPlainText,
} from './tiptap-schema';
import { cleanWordPasteHtml } from './clean-word-paste';
import {
  displayTextToInlines,
  renderInlineNodes,
  inlinesToDisplayText,
} from './TemporaryParagraphInput';
import { ReferencePickerPopover, MathInputPopover } from './tiptap-popovers';
import { Bold, Italic, Bookmark, Sigma } from 'lucide-react';

export interface TipTapParagraphEditorProps {
  value?: Inline[] | string;
  onChange?: (inlines: Inline[], plainText: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  readOnly?: boolean;
  isEditing?: boolean;
  onStartEdit?: () => void;
  ariaLabel?: string;
  references?: PaperReference[];
}

export const TipTapParagraphEditor: React.FC<TipTapParagraphEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Nội dung đoạn văn bản...',
  className = '',
  autoFocus,
  onBlur,
  onKeyDown,
  readOnly = false,
  isEditing: controlledIsEditing,
  onStartEdit,
  ariaLabel = 'Nội dung đoạn văn',
  references = [],
}) => {
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const [isRefPickerOpen, setIsRefPickerOpen] = useState(false);
  const [refSearch, setRefSearch] = useState('');
  const [isMathModalOpen, setIsMathModalOpen] = useState(false);
  const [mathLatex, setMathLatex] = useState('');

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isEditing = controlledIsEditing !== undefined ? controlledIsEditing : internalIsEditing;

  const currentInlines = useMemo(() => {
    if (Array.isArray(value)) return value;
    return displayTextToInlines(value || '');
  }, [value]);

  const currentText = useMemo(() => {
    if (typeof value === 'string') return value;
    return inlinesToDisplayText(value);
  }, [value]);

  const flushDebounce = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        horizontalRule: false,
        dropcursor: false,
        gapcursor: false,
        strike: false,
      }),
      Subscript,
      Superscript,
      CiteNode,
      XrefNode,
      MathNode,
    ],
    content: inlinesToTiptapDoc(currentInlines),
    editorProps: {
      attributes: {
        class:
          'w-full p-3 text-xs sm:text-sm text-zinc-900 bg-white leading-relaxed outline-none min-h-[3rem] rounded-b-2xl',
        role: 'textbox',
        'aria-label': ariaLabel,
        spellcheck: 'false',
        autocorrect: 'off',
        autocapitalize: 'off',
      },
      transformPastedHTML(html) {
        return cleanWordPasteHtml(html);
      },
      handleKeyDown(_view, event) {
        if (event.key === '[') {
          setIsRefPickerOpen(true);
          setRefSearch('');
        }
        return false;
      },
    },
    onUpdate({ editor: curEditor }) {
      flushDebounce();
      debounceTimerRef.current = setTimeout(() => {
        const json = curEditor.getJSON();
        const inlines = tiptapDocToInlines(json);
        const plainText = tiptapDocToPlainText(json);
        onChange?.(inlines, plainText);
      }, 150);
    },
    onBlur() {
      if (editor) {
        flushDebounce();
        const json = editor.getJSON();
        const inlines = tiptapDocToInlines(json);
        const plainText = tiptapDocToPlainText(json);
        onChange?.(inlines, plainText);
      }
      setInternalIsEditing(false);
      onBlur?.();
    },
  });

  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const currentEditorInlines = tiptapDocToInlines(editor.getJSON());
    if (JSON.stringify(currentEditorInlines) !== JSON.stringify(currentInlines)) {
      editor.commands.setContent(inlinesToTiptapDoc(currentInlines), { emitUpdate: false });
    }
  }, [editor, currentInlines]);

  useEffect(() => {
    if (isEditing && editor && !editor.isFocused) {
      editor.commands.focus('end');
    }
  }, [isEditing, editor]);

  useEffect(() => {
    return () => {
      flushDebounce();
    };
  }, [flushDebounce]);

  const handleStartEditing = () => {
    if (readOnly) return;
    if (onStartEdit) {
      onStartEdit();
    } else {
      setInternalIsEditing(true);
    }
  };

  const handleInsertCitation = (refId: number | string) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'cite',
        attrs: {
          id: `ref-${refId}`,
          targetId: String(refId),
          label: `[${refId}]`,
        },
      })
      .run();
    setIsRefPickerOpen(false);
  };

  const handleInsertMath = () => {
    if (!editor || !mathLatex.trim()) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'math',
        attrs: { latex: mathLatex.trim() },
      })
      .run();
    setMathLatex('');
    setIsMathModalOpen(false);
  };

  if (isEditing && !readOnly) {
    return (
      <div
        className={`tiptap-paragraph-editor relative w-full rounded-2xl bg-white border border-blue-300 ring-4 ring-blue-200 shadow-2xs transition-all ${className}`}
        onKeyDown={onKeyDown}
      >
        {/* Compact Mini Toolbar */}
        <div className="flex items-center justify-between px-2.5 py-1 bg-zinc-50 border-b border-zinc-200/80 rounded-t-2xl select-none text-xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-1 rounded hover:bg-zinc-200 transition-colors ${
                editor?.isActive('bold') ? 'bg-zinc-200 text-blue-600 font-bold' : 'text-zinc-600'
              }`}
              title="Đậm (Ctrl+B)"
              aria-label="In đậm"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-1 rounded hover:bg-zinc-200 transition-colors ${
                editor?.isActive('italic') ? 'bg-zinc-200 text-blue-600 font-bold' : 'text-zinc-600'
              }`}
              title="Nghiêng (Ctrl+I)"
              aria-label="In nghiêng"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor?.chain().focus().toggleSuperscript().run()}
              className={`px-1.5 py-0.5 rounded font-mono text-[11px] hover:bg-zinc-200 transition-colors ${
                editor?.isActive('superscript')
                  ? 'bg-zinc-200 text-blue-600 font-bold'
                  : 'text-zinc-600'
              }`}
              title="Chỉ số trên (x²)"
              aria-label="Chỉ số trên"
            >
              x²
            </button>
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor?.chain().focus().toggleSubscript().run()}
              className={`px-1.5 py-0.5 rounded font-mono text-[11px] hover:bg-zinc-200 transition-colors ${
                editor?.isActive('subscript')
                  ? 'bg-zinc-200 text-blue-600 font-bold'
                  : 'text-zinc-600'
              }`}
              title="Chỉ số dưới (x₂)"
              aria-label="Chỉ số dưới"
            >
              x₂
            </button>
            <span className="w-px h-3.5 bg-zinc-300 mx-1" />
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setIsRefPickerOpen((p) => !p)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-blue-50 text-blue-600 font-medium text-[11px] transition-colors"
              title="Chèn trích dẫn (gõ [ hoặc nhấp vào đây)"
              aria-label="Chèn trích dẫn"
            >
              <Bookmark className="w-3 h-3" />
              <span>Trích dẫn</span>
            </button>
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setIsMathModalOpen(true)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-200 text-zinc-700 text-[11px] font-mono transition-colors"
              title="Chèn công thức toán học ($latex$)"
              aria-label="Chèn công thức"
            >
              <Sigma className="w-3.5 h-3.5" />
              <span>Toán</span>
            </button>
          </div>
        </div>

        {/* Reference Suggestions Dropdown */}
        <ReferencePickerPopover
          isOpen={isRefPickerOpen}
          search={refSearch}
          onSearchChange={setRefSearch}
          references={references}
          onSelectReference={handleInsertCitation}
          onClose={() => setIsRefPickerOpen(false)}
        />

        {/* Inline Math Input Popover */}
        <MathInputPopover
          isOpen={isMathModalOpen}
          latex={mathLatex}
          onLatexChange={setMathLatex}
          onSubmit={handleInsertMath}
          onClose={() => setIsMathModalOpen(false)}
        />

        {/* TipTap ProseMirror Editor */}
        <EditorContent editor={editor} autoFocus={autoFocus} />

        {/* Synced form input for accessibility and fallback change handlers */}
        <textarea
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
          value={currentText}
          onChange={(e) => {
            const newText = e.target.value;
            const inlines = displayTextToInlines(newText);
            editor?.commands.setContent(inlinesToTiptapDoc(inlines), { emitUpdate: false });
            onChange?.(inlines, newText);
          }}
        />
      </div>
    );
  }

  // Non-editing Preview View (100% preserves original view appearance & click interactions)
  const isEmpty = !currentText || currentText.trim().length === 0;

  return (
    <div
      onClick={handleStartEditing}
      role="textbox"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartEditing();
        }
      }}
      className={`tiptap-paragraph-preview w-full p-3 rounded-2xl text-xs sm:text-sm text-zinc-900 bg-white leading-relaxed border border-transparent hover:border-zinc-200/80 shadow-2xs cursor-text select-text transition-all min-h-[3rem] whitespace-pre-wrap break-words ${className}`}
    >
      {isEmpty ? (
        <span className="text-zinc-400 italic">{placeholder}</span>
      ) : (
        renderInlineNodes(currentInlines, handleStartEditing)
      )}
    </div>
  );
};
