'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AuthorsTabProps } from './types';
import { UserCheck, Building, Plus, Trash2, AlertCircle, Globe } from 'lucide-react';
import { Select, SelectOption } from '../ui/Select';
import { normalizeAffiliations } from '@/types/paper';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const AuthorsTab: React.FC<AuthorsTabProps> = ({ metadata, onChange }) => {
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const [deletingAuthorIds, setDeletingAuthorIds] = useState<Set<string>>(new Set());
  const [deletingAffiliationIds, setDeletingAffiliationIds] = useState<Set<string>>(new Set());

  // Auto-normalize affiliations so that duplicate IDs (e.g. Vietnamese & English entries)
  // are permanently merged into single bilingual cards
  useEffect(() => {
    const rawAffs = metadata.affiliations || [];
    const norm = normalizeAffiliations(rawAffs);
    if (norm.length !== rawAffs.length) {
      onChange({
        ...metadata,
        affiliations: norm,
      });
    }
  }, [metadata.affiliations]);

  // Options for the custom Select component
  const affOptions: SelectOption[] = useMemo(() => {
    return (metadata.affiliations || []).map((aff) => ({
      value: String(aff.id),
      label: `[${aff.id}] ${aff.name || `Cơ quan ${aff.id}`}`,
      description: aff.nameEn ? aff.nameEn : undefined,
    }));
  }, [metadata.affiliations]);

  // Smooth scroll and auto-focus newly added author or affiliation
  useEffect(() => {
    if (!newlyAddedId) return;

    const timer = setTimeout(() => {
      const el =
        document.getElementById(`author-item-${newlyAddedId}`) ||
        document.getElementById(`aff-item-${newlyAddedId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const inputEl = el.querySelector<HTMLInputElement>(
          'input[type="text"], input[type="email"]'
        );
        if (inputEl) {
          inputEl.focus();
        }
      }
    }, 100);

    const clearTimer = setTimeout(() => {
      setNewlyAddedId(null);
    }, 1800);

    return () => {
      clearTimeout(timer);
      clearTimeout(clearTimer);
    };
  }, [newlyAddedId]);

  const handleAddAuthor = () => {
    const newId = `a_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const defaultAffId = metadata.affiliations.length > 0 ? metadata.affiliations[0].id : 1;
    const newAuthor = {
      id: newId,
      name: '',
      affiliationIds: metadata.affiliations.length > 0 ? [defaultAffId] : [1],
      isCorresponding: false,
      email: '',
    };
    onChange({
      ...metadata,
      authors: [...metadata.authors, newAuthor],
    });
    setNewlyAddedId(newId);
  };

  const handleRemoveAuthor = (index: number) => {
    const author = metadata.authors[index];
    const authorId = author.id || `a_${index}`;
    if (deletingAuthorIds.has(authorId)) return;

    setDeletingAuthorIds((prev) => new Set(prev).add(authorId));

    setTimeout(() => {
      const updated = [...metadata.authors];
      const actualIndex = updated.findIndex((a, i) => (a.id || `a_${i}`) === authorId);
      if (actualIndex !== -1) {
        const removed = updated.splice(actualIndex, 1)[0];
        let newCorr = { ...metadata.corresponding };
        if (removed.isCorresponding && updated.length > 0) {
          // If deleted author was corresponding, assign first remaining author
          updated[0].isCorresponding = true;
          newCorr = {
            name: updated[0].name,
            email: updated[0].email || 'tacgia@vnuhcm.edu.vn',
            affiliation: metadata.affiliations[0]?.name || '',
          };
        }
        onChange({
          ...metadata,
          authors: updated,
          corresponding: newCorr,
        });
      }
      setDeletingAuthorIds((prev) => {
        const next = new Set(prev);
        next.delete(authorId);
        return next;
      });
    }, 320);
  };

  const handleAddAffiliation = () => {
    const nextId = (metadata.affiliations.length || 0) + 1;
    const newAff = { id: nextId, name: '', nameEn: '' };
    onChange({
      ...metadata,
      affiliations: [...metadata.affiliations, newAff],
    });
    setNewlyAddedId(`aff_${nextId}`);
  };

  const handleRemoveAffiliation = (index: number) => {
    const aff = metadata.affiliations[index];
    const affKey = `aff_${aff.id}`;
    if (deletingAffiliationIds.has(affKey)) return;

    setDeletingAffiliationIds((prev) => new Set(prev).add(affKey));

    setTimeout(() => {
      const deletedId = aff.id;
      const updatedAffs = metadata.affiliations.filter((_, i) => i !== index);

      // Renumber affiliations 1..N and build map from old ID to new ID
      const oldIdToNewId = new Map<number, number>();
      const renumberedAffs = updatedAffs.map((item, i) => {
        const newId = i + 1;
        oldIdToNewId.set(item.id, newId);
        return { ...item, id: newId };
      });

      // Update authors: safely remove deletedId and remap other IDs
      const updatedAuthors = metadata.authors.map((author) => {
        const currentIds = author.affiliationIds || [];
        const mappedIds = currentIds
          .filter((id) => id !== deletedId)
          .map((id) => oldIdToNewId.get(id))
          .filter((id): id is number => typeof id === 'number');

        return {
          ...author,
          affiliationIds: mappedIds.length > 0 ? mappedIds : renumberedAffs.length > 0 ? [1] : [],
        };
      });

      // Update corresponding author affiliation text if needed
      let newCorr = { ...metadata.corresponding };
      if (renumberedAffs.length > 0) {
        if (!renumberedAffs.some((a) => a.name === newCorr.affiliation)) {
          newCorr.affiliation = renumberedAffs[0].name;
        }
      } else {
        newCorr.affiliation = '';
      }

      onChange({
        ...metadata,
        affiliations: renumberedAffs,
        authors: updatedAuthors,
        corresponding: newCorr,
      });

      setDeletingAffiliationIds((prev) => {
        const next = new Set(prev);
        next.delete(affKey);
        return next;
      });
    }, 320);
  };

  return (
    <div className="h-full flex flex-col min-h-0 space-y-6 overflow-y-auto p-4 sm:p-5 sm:pb-6">
      {/* Authors Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200/80">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-zinc-700" />
            <h3 className="font-extrabold text-sm sm:text-base text-zinc-900">
              Danh sách Tác giả ({metadata.authors.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={handleAddAuthor}
            className="btn-pill-lime text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm tác giả</span>
          </button>
        </div>

        <p className="text-xs text-zinc-500">
          Nhập họ tên, chọn cơ quan công tác tương ứng và đánh dấu tác giả liên hệ để hiển thị đúng dấu sao (*) trong bài báo.
        </p>

        <div className="space-y-1.5 scroll-smooth">
          {metadata.authors.map((author, idx) => {
            const authorId = author.id || `a_${idx}`;
            const isDeleting = deletingAuthorIds.has(authorId);
            const isNewlyAdded = authorId === newlyAddedId;

            const isEmailEntered = Boolean(author.email && author.email.trim());
            const isEmailInvalid = isEmailEntered && !isValidEmail(author.email!);
            const isCorrMissingValidEmail = Boolean(
              author.isCorresponding && (!author.email || !isValidEmail(author.email))
            );

            const selectedAffVal = String(
              author.affiliationIds?.[0] ||
              (metadata.affiliations.length > 0 ? metadata.affiliations[0].id : '1')
            );

            return (
              <div
                key={authorId}
                id={`author-item-${authorId}`}
                style={{ zIndex: metadata.authors.length - idx }}
                className={`grid transition-all duration-300 ease-in-out relative focus-within:z-40 ${isDeleting
                  ? 'grid-rows-[0fr] opacity-0 scale-95 -translate-y-2 pointer-events-none'
                  : 'grid-rows-[1fr] opacity-100 scale-100 translate-y-0'
                  } ${isNewlyAdded ? 'animate-section-enter' : ''}`}
              >
                <div>
                  <div
                    className={`p-4 rounded-3xl bg-gray-200/50 flex flex-col gap-3 transition-all duration-300 ${isNewlyAdded ? 'section-highlight-glow ring-2 ring-blue-300' : ''
                      }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                      {/* 1. Author Name (col-span-4) */}
                      <div className="md:col-span-4">
                        <label className="text-[10px] font-bold text-zinc-600 block mb-1">
                          Họ và tên tác giả:
                        </label>
                        <input
                          type="text"
                          value={author.name}
                          placeholder="Nguyễn Văn A"
                          spellCheck={false}
                          autoCorrect="off"
                          autoCapitalize="off"
                          onChange={(e) => {
                            const updated = [...metadata.authors];
                            updated[idx].name = e.target.value;
                            if (author.isCorresponding) {
                              metadata.corresponding.name = e.target.value;
                            }
                            onChange({ ...metadata, authors: updated });
                          }}
                          className="w-full p-2.5 rounded-xl text-xs font-bold text-zinc-900 bg-white focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-300 shadow-2xs"
                        />
                      </div>

                      {/* 2. Affiliation Custom Select (col-span-4) */}
                      <div className="md:col-span-4">
                        <label className="text-[10px] font-bold text-zinc-600 block mb-1">
                          Cơ quan công tác:
                        </label>
                        {affOptions.length === 0 ? (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-700 italic">
                            Chưa có cơ quan nào bên dưới. Vui lòng thêm cơ quan trước.
                          </div>
                        ) : (
                          <Select
                            value={selectedAffVal}
                            onChange={(val) => {
                              const pickedId = parseInt(val, 10);
                              if (isNaN(pickedId)) return;
                              const updated = [...metadata.authors];
                              updated[idx] = {
                                ...author,
                                affiliationIds: [pickedId],
                              };
                              onChange({ ...metadata, authors: updated });
                            }}
                            options={affOptions}
                            size="sm"
                            placeholder="Chọn cơ quan công tác..."
                            fullWidth
                          />
                        )}
                      </div>

                      {/* 3. Email (col-span-4) */}
                      <div className="md:col-span-4">
                        <label className="text-[10px] font-bold text-zinc-600 block mb-1">
                          Email liên hệ:
                        </label>
                        <input
                          type="email"
                          value={author.email || ''}
                          placeholder="author@vnuhcm.edu.vn"
                          spellCheck={false}
                          autoCorrect="off"
                          autoCapitalize="off"
                          onChange={(e) => {
                            const updated = [...metadata.authors];
                            updated[idx].email = e.target.value;
                            if (author.isCorresponding) {
                              metadata.corresponding.email = e.target.value;
                            }
                            onChange({ ...metadata, authors: updated });
                          }}
                          className={`w-full p-2.5 rounded-xl text-xs text-zinc-900 bg-white focus:outline-none focus:ring-4 shadow-2xs transition-all ${isEmailInvalid || isCorrMissingValidEmail
                            ? 'border border-red-400 bg-red-50/20 focus:ring-red-200 focus:border-red-400'
                            : 'focus:ring-blue-200 focus:border-blue-300'
                            }`}
                        />
                        {isEmailInvalid && (
                          <p className="text-[10px] text-red-600 font-semibold flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" /> Email không đúng định dạng (vd: user@domain.com)
                          </p>
                        )}
                        {!isEmailInvalid && isCorrMissingValidEmail && (
                          <p className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" /> Tác giả liên hệ cần có email hợp lệ
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Corresponding Checkbox & Delete Author */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-300/40">
                      <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!author.isCorresponding}
                          onChange={(e) => {
                            const updated = [...metadata.authors];
                            const isNowCorr = e.target.checked;
                            updated[idx].isCorresponding = isNowCorr;

                            // If this author is checked, uncheck all others or keep as main corresponding
                            if (isNowCorr) {
                              updated.forEach((a, aIdx) => {
                                if (aIdx !== idx) a.isCorresponding = false;
                              });
                              const primaryAff = metadata.affiliations.find((a) =>
                                (author.affiliationIds || []).includes(a.id)
                              ) || metadata.affiliations[0];

                              metadata.corresponding = {
                                name: author.name,
                                email: author.email || 'tacgia@vnuhcm.edu.vn',
                                affiliation: primaryAff?.name || '',
                              };
                            }
                            onChange({ ...metadata, authors: updated });
                          }}
                          className="rounded text-zinc-900 focus:ring-zinc-900 cursor-pointer w-4 h-4"
                        />
                        <span className="font-bold text-zinc-800">Tác giả liên hệ* (Corresponding Author)</span>
                      </label>

                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleRemoveAuthor(idx)}
                        className="px-2 py-1 rounded-xl text-zinc-500 hover:text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Xóa tác giả này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Affiliations Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200/80">
          <div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-zinc-700" />
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-900">
                Cơ quan & Viện nghiên cứu ({metadata.affiliations.length})
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Mỗi cơ quan có cùng mã số ID, gồm tên Tiếng Việt & Tiếng Anh.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddAffiliation}
            className="btn-pill-subtle text-xs py-1.5 px-3 flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm cơ quan</span>
          </button>
        </div>

        <div className="space-y-2.5 scroll-smooth">
          {metadata.affiliations.map((aff, idx) => {
            const affKey = `aff_${aff.id}`;
            const isDeleting = deletingAffiliationIds.has(affKey);
            const isNewlyAdded = affKey === newlyAddedId;

            // Count how many authors currently reference this affiliation
            const authorUsageCount = metadata.authors.filter((a) =>
              (a.affiliationIds || []).includes(aff.id)
            ).length;

            return (
              <div
                key={aff.id || idx}
                id={`aff-item-${affKey}`}
                className={`grid transition-all duration-300 ease-in-out ${isDeleting
                  ? 'grid-rows-[0fr] opacity-0 scale-95 -translate-y-2 pointer-events-none'
                  : 'grid-rows-[1fr] opacity-100 scale-100 translate-y-0'
                  } ${isNewlyAdded ? 'animate-section-enter' : ''}`}
              >
                <div>
                  <div
                    className={`p-3.5 rounded-3xl bg-gray-200/50 flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-all duration-300 ${isNewlyAdded ? 'section-highlight-glow ring-2 ring-blue-300' : ''
                      }`}
                  >
                    {/* ID Indicator */}
                    <div className="flex sm:flex-col items-center gap-1 flex-shrink-0">
                      <span className="w-8 h-8 rounded-2xl bg-[#1A1A1A] text-white flex items-center justify-center text-xs font-black shadow-2xs">
                        {aff.id}
                      </span>
                    </div>

                    {/* Dual-language Inputs */}
                    <div className="flex-1 w-full space-y-1">
                      {/* Vietnamese Version */}
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-gray-50 text-gray-700 flex-shrink-0 select-none">
                          Tiếng Việt
                        </span>
                        <input
                          type="text"
                          value={aff.name}
                          spellCheck={false}
                          autoCorrect="off"
                          autoCapitalize="off"
                          onChange={(e) => {
                            const updated = [...metadata.affiliations];
                            updated[idx].name = e.target.value;
                            if (metadata.corresponding.affiliation === aff.name) {
                              metadata.corresponding.affiliation = e.target.value;
                            }
                            onChange({ ...metadata, affiliations: updated });
                          }}
                          className="flex-1 p-2 rounded-xl text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-300 shadow-2xs"
                          placeholder="Tên viện / Trường đại học bằng Tiếng Việt..."
                        />
                      </div>

                      {/* English Version */}
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-gray-50 text-gray-800 flex-shrink-0 select-none flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" /> English
                        </span>
                        <input
                          type="text"
                          value={aff.nameEn || ''}
                          spellCheck={false}
                          autoCorrect="off"
                          autoCapitalize="off"
                          onChange={(e) => {
                            const updated = [...metadata.affiliations];
                            updated[idx].nameEn = e.target.value;
                            onChange({ ...metadata, affiliations: updated });
                          }}
                          className="flex-1 p-2 rounded-xl text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-300"
                          placeholder="Tên cơ quan bằng Tiếng Anh (tùy chọn)..."
                        />
                      </div>
                    </div>

                    {/* Actions and Usage info */}
                    <div className="flex sm:flex-col items-center justify-between sm:justify-center w-full sm:w-auto gap-2 self-stretch pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-100 flex-shrink-0">
                      <span className="text-[10px] font-semibold text-zinc-500">
                        {authorUsageCount > 0 ? `${authorUsageCount} tác giả chọn` : 'Chưa gán tác giả'}
                      </span>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleRemoveAffiliation(idx)}
                        className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        title={
                          authorUsageCount > 0
                            ? `Xóa cơ quan này sẽ tự động gỡ khỏi ${authorUsageCount} tác giả và đánh số lại 1..N`
                            : 'Xóa cơ quan này'
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
