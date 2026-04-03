import { useState, useEffect, useRef } from 'react';
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  ImageIcon,
  Copy,
  Check,
  XCircle,
  Loader2,
  Search,
  ClipboardPaste,
  ChevronUp,
  PackageSearch
} from 'lucide-react';
import type { ProductItem } from '../services/fileParser';
import { generateSearchLinks } from '../services/imageSearch';

interface ProductTableProps {
  items: ProductItem[];
  onUpdateItem: (id: number, imageUrl: string) => void;
}

function StatusBadge({ status }: { status: ProductItem['status'] }) {
  switch (status) {
    case 'found':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Найдено
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
          <XCircle className="w-3.5 h-3.5" />
          Ошибка
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
          <Clock className="w-3.5 h-3.5" />
          Ожидает
        </span>
      );
  }
}

function ImagePreview({ url, name }: { url: string; name: string }) {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setHasError(false);
    setLoaded(false);
  }, [url]);

  if (!url) {
    return (
      <div className="w-20 h-20 rounded-xl bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200">
        <ImageIcon className="w-7 h-7 text-slate-200" />
      </div>
    );
  }

  return (
    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-50 group border border-slate-200 shadow-sm">
      {!loaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
        </div>
      )}
      {hasError ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 p-1" title="Изображение недоступно — попробуйте другую ссылку">
          <XCircle className="w-5 h-5 text-red-300 mb-0.5" />
          <span className="text-[9px] text-red-400 text-center leading-tight">не загрузилось</span>
        </div>
      ) : (
        <img
          src={url}
          alt={name}
          onLoad={() => setLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
          referrerPolicy="no-referrer"
        />
      )}
      {loaded && !hasError && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          title="Открыть в новой вкладке"
        >
          <ExternalLink className="w-4 h-4 text-white" />
        </a>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
    }
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
      title="Копировать ссылку"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-600" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-slate-400" />
      )}
    </button>
  );
}

// Карточка одного товара — раскрывающаяся
function ProductCard({ item, onUpdateItem }: { item: ProductItem; onUpdateItem: (id: number, url: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState(item.imageUrl || '');
  const [searchQuery, setSearchQuery] = useState(item.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(item.imageUrl || '');
  }, [item.imageUrl]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputValue(text);
        onUpdateItem(item.id, text);
      }
    } catch {
      // Fallback: focus input so user can Ctrl+V
      inputRef.current?.focus();
    }
  };

  const handleSave = () => {
    onUpdateItem(item.id, inputValue.trim());
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  const handleClear = () => {
    setInputValue('');
    onUpdateItem(item.id, '');
  };

  const searchLinks = generateSearchLinks(searchQuery);

  return (
    <div className={`border rounded-2xl transition-all ${
      item.status === 'found'
        ? 'border-green-200 bg-green-50/30'
        : isExpanded
          ? 'border-blue-300 bg-blue-50/20 shadow-md'
          : 'border-slate-200 bg-white hover:border-slate-300'
    }`}>
      {/* Collapsed row */}
      <div className="flex items-center gap-4 p-4">
        <span className="text-xs font-mono text-slate-400 w-8 text-center shrink-0">{item.id}</span>

        <ImagePreview url={item.imageUrl} name={item.name} />

        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 truncate">{item.name}</p>
          {item.imageUrl ? (
            <div className="flex items-center gap-1 mt-1">
              <a
                href={item.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 truncate max-w-[300px] underline"
                title={item.imageUrl}
              >
                {item.imageUrl}
              </a>
              <CopyButton text={item.imageUrl} />
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-1 italic">Изображение не добавлено</p>
          )}
        </div>

        <StatusBadge status={item.status} />

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-2.5 rounded-xl transition-all shrink-0 ${
            isExpanded
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : item.status === 'found'
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
          }`}
          title={isExpanded ? 'Свернуть' : 'Найти изображение'}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : item.status === 'found' ? (
            <Search className="w-5 h-5" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="border-t border-slate-100 p-4 pt-4 space-y-4 bg-white/50 rounded-b-2xl">
          {/* Search query editor */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Поисковый запрос
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Название товара для поиска..."
              />
            </div>
          </div>

          {/* Search buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
              Искать изображение на:
            </label>
            <div className="flex flex-wrap gap-2">
              {searchLinks.map(link => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all"
                  title={link.description}
                >
                  <span className="text-lg">{link.icon}</span>
                  {link.name}
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-800">
              <strong>Как скопировать ссылку на изображение:</strong><br />
              1. Нажмите на одну из кнопок выше — откроется сайт с результатами поиска<br />
              2. Найдите подходящее фото товара<br />
              3. Нажмите на фото <strong>правой кнопкой мыши</strong><br />
              4. Выберите <strong>«Копировать адрес изображения»</strong> (или «Copy image address»)<br />
              5. Вставьте ссылку в поле ниже
            </p>
          </div>

          {/* URL input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Ссылка на изображение
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onBlur={handleSave}
                className="flex-1 px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                placeholder="Вставьте URL изображения сюда..."
              />
              <button
                onClick={handlePaste}
                className="px-3 py-2.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl transition-colors flex items-center gap-1.5 text-sm font-medium shrink-0"
                title="Вставить из буфера обмена"
              >
                <ClipboardPaste className="w-4 h-4" />
                Вставить
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-xl transition-colors flex items-center gap-1.5 text-sm font-medium shrink-0"
              >
                <Check className="w-4 h-4" />
                OK
              </button>
              {inputValue && (
                <button
                  onClick={handleClear}
                  className="px-3 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                  title="Очистить"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Live preview */}
          {inputValue && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Предпросмотр
              </label>
              <PreviewImage url={inputValue} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PreviewImage({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setHasError(false);
  }, [url]);

  if (hasError) {
    return (
      <div className="w-full max-w-xs h-48 rounded-xl bg-red-50 border border-red-200 flex flex-col items-center justify-center p-4">
        <XCircle className="w-8 h-8 text-red-300 mb-2" />
        <p className="text-xs text-red-500 text-center">
          Не удалось загрузить изображение.<br />
          Убедитесь, что ссылка ведёт прямо на картинку (формат .jpg, .png, .webp)
        </p>
      </div>
    );
  }

  return (
    <div className="relative inline-block max-w-xs">
      {!loaded && (
        <div className="w-48 h-48 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
        </div>
      )}
      <img
        src={url}
        alt="Предпросмотр"
        onLoad={() => setLoaded(true)}
        onError={() => setHasError(true)}
        className={`max-w-xs max-h-64 rounded-xl border border-slate-200 shadow-sm object-contain bg-white ${loaded ? 'block' : 'hidden'}`}
        referrerPolicy="no-referrer"
      />
      {loaded && (
        <div className="mt-1 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          <span className="text-xs text-green-600">Изображение загружено</span>
        </div>
      )}
    </div>
  );
}

export function ProductTable({ items, onUpdateItem }: ProductTableProps) {
  const [filter, setFilter] = useState<'all' | 'found' | 'pending'>('all');

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'found') return item.status === 'found';
    if (filter === 'pending') return item.status === 'pending' || item.status === 'error';
    return true;
  });

  const stats = {
    total: items.length,
    found: items.filter(i => i.status === 'found').length,
    pending: items.filter(i => i.status !== 'found').length,
  };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Все ({stats.total})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'pending' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          ⏳ Без фото ({stats.pending})
        </button>
        <button
          onClick={() => setFilter('found')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'found' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
          }`}
        >
          ✓ С фото ({stats.found})
        </button>
      </div>

      {/* Product cards */}
      <div className="space-y-2">
        {filteredItems.map(item => (
          <ProductCard
            key={item.id}
            item={item}
            onUpdateItem={onUpdateItem}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <PackageSearch className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-medium">Нет товаров для отображения</p>
          <p className="text-xs mt-1">Попробуйте изменить фильтр</p>
        </div>
      )}
    </div>
  );
}
