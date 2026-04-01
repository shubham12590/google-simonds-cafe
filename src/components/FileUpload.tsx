import React from 'react';
import { FileUploadButton } from './FileUploadButton';

export const FileUpload: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8 bg-slate-50 relative">
      <div className="w-full max-w-2xl p-6 sm:p-12 border-2 border-dashed border-slate-300 bg-white rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
        <div className="p-4 rounded-full mb-6 bg-slate-100">
          <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">
          Upload Petpooja Excel Data
        </h2>
        
        <p className="text-sm sm:text-base text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
          Click the button below to browse and select your Excel files. 
          <br />
          <span className="text-slate-400 text-sm mt-2 block">
            Supports .xlsx, .xls, .csv (Max 50 files)
          </span>
        </p>

        <FileUploadButton variant="full" />
        
        <div className="mt-8 pt-6 border-t border-slate-100 w-full">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">Required Columns</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Bill Date', 'Bill Time', 'Product Name', 'Category', 'Quantity', 'Rate', 'Total Amount'].map((col) => (
              <span key={col} className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded-md border border-slate-200">
                {col}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
