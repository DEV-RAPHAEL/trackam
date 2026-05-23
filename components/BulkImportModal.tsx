import React, { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle } from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => void;
  type: 'clients' | 'leads';
}

export function BulkImportModal({ isOpen, onClose, onImport, type }: BulkImportModalProps) {
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
          setError('CSV must contain a header row and at least one data row.');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const parsed = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        });

        // Basic validation depending on type
        const validData = parsed.filter(row => row.name && row.email);
        if (validData.length === 0) {
          setError('No valid records found. Ensure "name" and "email" columns exist and are populated.');
          return;
        }

        setData(validData);
        setError(null);
      } catch (err) {
        setError('Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    onImport(data);
    onClose();
    setData([]);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-slate-800">
            Import {type === 'clients' ? 'Clients' : 'Leads'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-500 mb-6">
            Upload a CSV file containing your {type}. Ensure the first row contains headers like 
            <strong className="text-slate-700"> name, email, phone, company</strong>.
          </p>

          <div 
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 hover:border-indigo-300 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Click to upload CSV</p>
            <p className="text-xs text-slate-400 mt-1">or drag and drop</p>
            <input 
              type="file" 
              accept=".csv,.txt"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {data.length > 0 && !error && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800">Ready to import</p>
                  <p className="text-xs text-emerald-600">{data.length} records found</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={data.length === 0}
            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import {data.length > 0 ? data.length : ''} Records
          </button>
        </div>
      </div>
    </div>
  );
}
