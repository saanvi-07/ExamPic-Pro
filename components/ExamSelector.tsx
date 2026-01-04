
import React from 'react';
import { ExamType } from '../types';

interface ExamSelectorProps {
  selected: ExamType;
  onChange: (exam: ExamType) => void;
  label: string;
}

export const ExamSelector: React.FC<ExamSelectorProps> = ({ selected, onChange, label }) => {
  return (
    <div className="flex flex-col space-y-3">
      <label className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</label>
      <div className="relative group">
        <select
          value={selected}
          onChange={(e) => onChange(e.target.value as ExamType)}
          className="w-full appearance-none bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer text-sm font-bold text-slate-100 group-hover:bg-slate-800"
        >
          {Object.values(ExamType).map((exam) => (
            <option key={exam} value={exam} className="bg-slate-900 text-white">
              {exam}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500 group-hover:text-slate-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
