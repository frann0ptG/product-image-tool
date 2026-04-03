import { useState, useCallback } from 'react';
import {
  Download,
  FileSpreadsheet,
  Zap,
  RotateCcw,
  FileDown,
  ImageIcon
} from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { ProductTable } from './components/ProductTable';
import { parseFile, exportToExcel, downloadXML } from './services/fileParser';
import type { ProductItem } from './services/fileParser';

export function App() {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setFileName(file.name);

    try {
      const parsed = await parseFile(file);
      if (parsed.length === 0) {
        setError('Файл пуст или не удалось распознать названия товаров. Убедитесь, что в первой колонке находятся названия.');
        setItems([]);
      } else {
        setItems(parsed);
        setError(null);
      }
    } catch (e) {
      setError(`Ошибка при чтении файла: ${e instanceof Error ? e.message : 'Неизвестная ошибка'}`);
      setItems([]);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const resetAll = useCallback(() => {
    setItems([]);
    setError(null);
    setFileName('');
  }, []);

  const handleUpdateItem = useCallback((id: number, imageUrl: string) => {
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, imageUrl, status: imageUrl ? 'found' as const : 'pending' as const } : i
    ));
  }, []);

  const handleExportExcel = useCallback(() => {
    const baseName = fileName.replace(/\.[^.]+$/, '');
    exportToExcel(items, `${baseName}_с_изображениями.xlsx`);
  }, [items, fileName]);

  const handleExportXML = useCallback(() => {
    const baseName = fileName.replace(/\.[^.]+$/, '');
    downloadXML(items, `${baseName}_с_изображениями.xml`);
  }, [items, fileName]);

  const handleDownloadSample = useCallback(async () => {
    const sampleData = [
      ['Название товара'],
      ['iPhone 15 Pro Max'],
      ['Samsung Galaxy S24 Ultra'],
      ['Кроссовки Nike Air Max 90'],
      ['Наушники Sony WH-1000XM5'],
      ['Ноутбук ASUS VivoBook 15'],
      ['Чайник электрический Xiaomi'],
      ['Рюкзак городской Samsonite'],
      ['Фитнес браслет Xiaomi Mi Band 8'],
      ['Пылесос Dyson V15'],
      ['Платье летнее женское'],
    ];
    const XLSXMod = await import('xlsx');
    const ws = XLSXMod.utils.aoa_to_sheet(sampleData);
    ws['!cols'] = [{ wch: 35 }];
    const wb = XLSXMod.utils.book_new();
    XLSXMod.utils.book_append_sheet(wb, ws, 'Товары');
    XLSXMod.writeFile(wb, 'пример_товары.xlsx');
  }, []);

  const hasItems = items.length > 0;
  const foundCount = items.filter(i => i.status === 'found').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Подбор изображений товаров</h1>
              <p className="text-xs text-slate-500">Загрузите файл → Найдите фото на маркетплейсах → Скачайте результат</p>
            </div>
          </div>

          {hasItems && (
            <button
              onClick={resetAll}
              className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Начать заново</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Upload section */}
        {!hasItems && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
                <FileSpreadsheet className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Загрузите файл с товарами</h2>
              <p className="text-slate-500 max-w-md mx-auto">
                Поддерживаются форматы XML, XLSX, XLS, CSV.
                Названия товаров должны быть в первой колонке.
              </p>
            </div>

            <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />

            {isProcessing && (
              <div className="text-center text-slate-500 flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 animate-pulse text-amber-500" />
                Обработка файла...
              </div>
            )}

            {/* How it works */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Как это работает</h3>
              <div className="space-y-3">
                {[
                  { step: '1', text: 'Загрузите файл со списком товаров (XML, XLSX, CSV)', color: 'bg-blue-100 text-blue-700' },
                  { step: '2', text: 'Для каждого товара нажмите кнопку поиска — откроется Яндекс, Wildberries, Ozon или другой сайт', color: 'bg-purple-100 text-purple-700' },
                  { step: '3', text: 'Найдите нужное фото, нажмите правой кнопкой → «Копировать адрес изображения»', color: 'bg-green-100 text-green-700' },
                  { step: '4', text: 'Вставьте ссылку в поле — превью появится автоматически', color: 'bg-amber-100 text-amber-700' },
                  { step: '5', text: 'Когда все товары заполнены — скачайте результат в XLSX или XML', color: 'bg-indigo-100 text-indigo-700' },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-full ${item.color} flex items-center justify-center text-sm font-bold shrink-0`}>
                      {item.step}
                    </span>
                    <p className="text-sm text-slate-600 pt-0.5">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample file */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-2">Нет файла под рукой?</h3>
              <p className="text-sm text-slate-500 mb-4">
                Скачайте тестовый файл с примерами товаров
              </p>
              <button
                onClick={handleDownloadSample}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Скачать тестовый файл (.xlsx)
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
            <span className="text-red-500 mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Action bar */}
        {hasItems && (
          <>
            <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <span className="font-medium">{fileName}</span>
                  <span className="text-slate-400 ml-2">• {items.length} товаров</span>
                </div>
              </div>

              <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block" />

              <div className="flex items-center gap-2 text-sm">
                <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                  ✓ {foundCount}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">
                  ⏳ {items.length - foundCount}
                </span>
              </div>

              {foundCount > 0 && (
                <>
                  <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block" />
                  <button
                    onClick={handleExportExcel}
                    className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 text-sm shadow-sm"
                  >
                    <FileDown className="w-4 h-4" />
                    Скачать XLSX
                  </button>
                  <button
                    onClick={handleExportXML}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 text-sm shadow-sm"
                  >
                    <FileDown className="w-4 h-4" />
                    Скачать XML
                  </button>
                </>
              )}

              {/* Progress bar */}
              {foundCount > 0 && foundCount < items.length && (
                <div className="w-full mt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Прогресс заполнения</span>
                    <span>{Math.round((foundCount / items.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${(foundCount / items.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            <ProductTable items={items} onUpdateItem={handleUpdateItem} />
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 mt-12 py-6 text-center text-sm text-slate-400">
        <p>Подбор изображений товаров • Яндекс • Wildberries • Ozon • XML / XLSX / CSV</p>
      </footer>
    </div>
  );
}
