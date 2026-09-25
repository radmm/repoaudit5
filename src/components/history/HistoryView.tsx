import React, { useState } from 'react';
import { AuditHistoryItem, AuditReport } from '../../types/audit';
import { auditService } from '../../services/auditService';
import { BrutalistCard } from '../common/GlassCard';
import { GradeBadge } from '../common/GradeBadge';
import {
  HistoryMark,
  SearchMark,
  TrashMark,
  ArrowRightMark,
} from '../common/BrutalistIcon';

interface HistoryViewProps {
  onSelectAudit: (report: AuditReport) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onSelectAudit }) => {
  const [historyItems, setHistoryItems] = useState<AuditHistoryItem[]>(() =>
    auditService.getHistory()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  const refreshHistory = () => {
    setHistoryItems(auditService.getHistory());
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    auditService.deleteAudit(id);
    refreshHistory();
  };

  const handleReset = () => {
    auditService.resetToDefault();
    refreshHistory();
  };

  const filtered = historyItems.filter((item) => {
    const matchesSearch = item.repoUrl.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeFilter === 'all' || item.securityGrade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <BrutalistCard bg="white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-mono text-[10px] uppercase text-[#0D0D0D]/60 tracking-wider">
              PERSISTENT AUDIT LOG ({historyItems.length} RECORDS)
            </span>
            <h1 className="font-display font-extrabold text-xl sm:text-2xl text-[#0D0D0D]">
              AUDIT ARCHIVES
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 border-2 border-[#0D0D0D] bg-[#F2EFE9] hover:bg-white text-xs font-mono font-bold uppercase transition-all cursor-pointer"
              style={{ borderRadius: '0px' }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 mt-3 border-t-2 border-[#0D0D0D]">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repository..."
              className="w-full px-3 py-1.5 bg-[#F2EFE9] border-2 border-[#0D0D0D] text-xs font-mono text-[#0D0D0D] placeholder-[#0D0D0D]/40 focus:outline-none focus:bg-white"
              style={{ borderRadius: '0px' }}
            />
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto font-mono text-xs">
            <span className="text-[#0D0D0D]/60 text-[10px] uppercase mr-1">Grade:</span>
            {['all', 'A', 'B', 'C', 'D', 'F'].map((grade) => (
              <button
                key={grade}
                onClick={() => setGradeFilter(grade)}
                className={`px-2 py-0.5 uppercase border border-[#0D0D0D] text-[10px] transition-all cursor-pointer ${
                  gradeFilter === grade
                    ? 'bg-[#0D0D0D] font-bold text-white'
                    : 'bg-white text-[#0D0D0D] hover:bg-[#F2EFE9]'
                }`}
                style={{ borderRadius: '0px' }}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>
      </BrutalistCard>

      {/* Professional Data Table (Dense, Monospace Numbers, Sticky Header, Zebra Alternating #F2EFE9 and #E8E4DA) */}
      <div
        className="border-[3px] border-[#0D0D0D] shadow-[3px_3px_0px_#0D0D0D] bg-white overflow-hidden"
        style={{ borderRadius: '0px' }}
      >
        {filtered.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-[#0D0D0D]/70">
            No audit records match the query.
          </div>
        ) : (
          <div className="divide-y divide-[#0D0D0D]/20 overflow-x-auto">
            {/* Sticky Table Header */}
            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-[#E8E4DA] border-b-[3px] border-[#0D0D0D] font-mono text-xs font-bold uppercase text-[#0D0D0D] min-w-[640px]">
              <div className="col-span-1">Grade</div>
              <div className="col-span-5">Repository</div>
              <div className="col-span-2 text-right">Security</div>
              <div className="col-span-2 text-right">Similarity</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Table Rows */}
            {filtered.map((item, idx) => {
              const isZebra = idx % 2 === 1;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    const full = auditService.getAuditById(item.id);
                    if (full) onSelectAudit(full);
                  }}
                  className={`grid grid-cols-12 gap-2 px-3 py-2.5 items-center font-mono text-xs cursor-pointer transition-colors min-w-[640px] hover:bg-[#D7FF3E]/20 ${
                    isZebra ? 'bg-[#E8E4DA]' : 'bg-[#F2EFE9]'
                  }`}
                >
                  {/* Grade */}
                  <div className="col-span-1">
                    <GradeBadge grade={item.securityGrade} size="sm" />
                  </div>

                  {/* Repo */}
                  <div className="col-span-5 truncate text-[#0D0D0D] font-bold">
                    <span>{item.repoUrl.replace('https://github.com/', '')}</span>
                    <span className="block text-[10px] text-[#0D0D0D]/60 font-normal">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Security Score */}
                  <div className="col-span-2 text-right">
                    <span className="font-bold">{item.securityScore}</span>
                    <span className="text-[10px] text-[#0D0D0D]/60">/100</span>
                  </div>

                  {/* Plagiarism Similarity */}
                  <div className="col-span-2 text-right">
                    <span
                      className={`font-bold ${
                        item.plagiarismScore > 50 ? 'text-[#FF5A36]' : 'text-[#0D0D0D]'
                      }`}
                    >
                      {item.plagiarismScore}%
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Delete"
                      className="p-1 hover:bg-[#FF5A36] hover:text-white transition-colors cursor-pointer"
                    >
                      <TrashMark size={14} />
                    </button>
                    <ArrowRightMark size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
