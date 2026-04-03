import { useCallback, useRef, useState } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const ACCEPTED_EXTENSIONS = ['xml', 'xlsx', 'xls', 'csv', 'tsv', 'txt'];

function getExtension(name: string): string {
  return (name.split('.').pop() || '').toLowerCase();
}

export function FileUpload({ onFileSelect, isProcessing }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setFileError(null);
    const ext = getExtension(file.name);
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setFileError(`Неподдерживаемый формат ".${ext}". Используйте: ${ACCEPTED_EXTENSIONS.map(e => '.' + e).join(', ')}`);
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const openFilePicker = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const clearFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml,.xlsx,.xls,.csv,.tsv,.txt"
        onChange={handleInputChange}
        style={{ display: 'none' }}
        tabIndex={-1}
      />

      {selectedFile ? (
        <div className="border-2 border-green-300 bg-green-50/50 rounded-2xl p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">{selectedFile.name}</p>
              <p className="text-sm text-slate-500 mt-1">
                {(selectedFile.size / 1024).toFixed(1)} КБ
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={openFilePicker}
                disabled={isProcessing}
                className="px-4 py-2 text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-xl transition-colors font-medium disabled:opacity-50"
              >
                Выбрать другой
              </button>
              <button
                type="button"
                onClick={clearFile}
                disabled={isProcessing}
                className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5 font-medium disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Удалить
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDragEnter={handleDragOver}
          onClick={openFilePicker}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openFilePicker(); }}
          className={`
            border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 select-none
            ${isDragOver
              ? 'border-purple-500 bg-purple-50 scale-[1.02] shadow-lg shadow-purple-100'
              : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50/30'
            }
            ${isProcessing ? 'opacity-60 pointer-events-none' : ''}
          `}
        >
          <div className="flex flex-col items-center gap-4 pointer-events-none">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-colors ${
              isDragOver ? 'bg-purple-200' : 'bg-purple-100'
            }`}>
              <Upload className={`w-10 h-10 transition-colors ${isDragOver ? 'text-purple-700' : 'text-purple-500'}`} />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">
                {isDragOver ? 'Отпустите файл здесь' : 'Перетащите файл сюда'}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                или <span className="text-purple-600 font-medium underline">нажмите для выбора</span>
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {['XML', 'XLSX', 'XLS', 'CSV'].map(ext => (
                <span key={ext} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                  .{ext.toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {fileError && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {fileError}
        </div>
      )}
    </div>
  );
}
