import * as XLSX from 'xlsx';

export interface ProductItem {
  id: number;
  name: string;
  imageUrl: string;
  status: 'pending' | 'searching' | 'found' | 'error';
  originalData: Record<string, string>;
}

// Парсинг XML файла
function parseXML(content: string): ProductItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/xml');
  
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Ошибка парсинга XML файла');
  }

  const items: ProductItem[] = [];
  
  // Попробуем найти элементы разными способами
  // Вариант 1: Таблица в формате SpreadsheetML (Excel XML)
  const rows = doc.querySelectorAll('Row');
  if (rows.length > 0) {
    let id = 1;
    const headerRow = rows[0];
    const headerCells = headerRow.querySelectorAll('Cell Data');
    const headers = Array.from(headerCells).map(c => c.textContent?.trim() || '');
    
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll('Cell Data');
      const values = Array.from(cells).map(c => c.textContent?.trim() || '');
      
      if (values.length > 0 && values[0]) {
        const originalData: Record<string, string> = {};
        headers.forEach((h, idx) => {
          if (h && values[idx]) originalData[h] = values[idx];
        });
        
        items.push({
          id: id++,
          name: values[0],
          imageUrl: '',
          status: 'pending',
          originalData
        });
      }
    }
    return items;
  }

  // Вариант 2: Произвольный XML - ищем текстовые элементы
  const allElements = doc.querySelectorAll('*');
  let id = 1;
  
  // Ищем элементы с текстовым содержимым, которые могут быть названиями товаров
  const textElements = Array.from(allElements).filter(el => {
    return el.children.length === 0 && el.textContent?.trim();
  });

  // Группируем по родительскому элементу
  const parentGroups = new Map<Element, Element[]>();
  textElements.forEach(el => {
    const parent = el.parentElement;
    if (parent) {
      if (!parentGroups.has(parent)) {
        parentGroups.set(parent, []);
      }
      parentGroups.get(parent)!.push(el);
    }
  });

  // Ищем элементы с именами вроде "name", "title", "product", "товар", "наименование"
  const namePatterns = /name|title|product|товар|наименование|название|item/i;
  
  for (const [, children] of parentGroups) {
    const nameEl = children.find(el => namePatterns.test(el.tagName));
    if (nameEl && nameEl.textContent?.trim()) {
      const originalData: Record<string, string> = {};
      children.forEach(el => {
        originalData[el.tagName] = el.textContent?.trim() || '';
      });
      
      items.push({
        id: id++,
        name: nameEl.textContent.trim(),
        imageUrl: '',
        status: 'pending',
        originalData
      });
    }
  }

  // Если не нашли по паттерну, берём первый текстовый элемент из каждой группы
  if (items.length === 0) {
    for (const [parent, children] of parentGroups) {
      // Пропускаем корневой элемент если он содержит вложенные группы
      if (parent === doc.documentElement) continue;
      
      const firstTextEl = children[0];
      if (firstTextEl && firstTextEl.textContent?.trim()) {
        const originalData: Record<string, string> = {};
        children.forEach(el => {
          originalData[el.tagName] = el.textContent?.trim() || '';
        });
        
        items.push({
          id: id++,
          name: firstTextEl.textContent.trim(),
          imageUrl: '',
          status: 'pending',
          originalData
        });
      }
    }
  }

  // Если всё ещё пусто, берём все уникальные текстовые узлы
  if (items.length === 0) {
    textElements.forEach(el => {
      const text = el.textContent?.trim();
      if (text && text.length > 2) {
        items.push({
          id: id++,
          name: text,
          imageUrl: '',
          status: 'pending',
          originalData: { [el.tagName]: text }
        });
      }
    });
  }

  return items;
}

// Парсинг Excel файла (xlsx, xls)
function parseExcel(data: ArrayBuffer): ProductItem[] {
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { 
    header: 1,
    defval: '' 
  }) as unknown as string[][];

  const items: ProductItem[] = [];
  let id = 1;

  if (jsonData.length === 0) return items;

  // Первая строка может быть заголовками
  const headers = jsonData[0].map(h => String(h).trim());
  const startRow = headers.some(h => /name|title|товар|наименование|название|продукт/i.test(h)) ? 1 : 0;

  for (let i = startRow; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (row && row.length > 0) {
      const name = String(row[0]).trim();
      if (name && name.length > 0) {
        const originalData: Record<string, string> = {};
        headers.forEach((h, idx) => {
          if (row[idx] !== undefined && row[idx] !== '') {
            originalData[h || `Колонка ${idx + 1}`] = String(row[idx]);
          }
        });

        items.push({
          id: id++,
          name,
          imageUrl: '',
          status: 'pending',
          originalData
        });
      }
    }
  }

  return items;
}

// Парсинг CSV/TSV
function parseCSV(content: string): ProductItem[] {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  const items: ProductItem[] = [];
  let id = 1;

  if (lines.length === 0) return items;

  // Определяем разделитель
  const delimiter = lines[0].includes('\t') ? '\t' : 
                    lines[0].includes(';') ? ';' : ',';

  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
  const startRow = headers.some(h => /name|title|товар|наименование|название|продукт/i.test(h)) ? 1 : 0;

  for (let i = startRow; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
    const name = cols[0]?.trim();
    
    if (name) {
      const originalData: Record<string, string> = {};
      headers.forEach((h, idx) => {
        if (cols[idx]) originalData[h || `Колонка ${idx + 1}`] = cols[idx];
      });

      items.push({
        id: id++,
        name,
        imageUrl: '',
        status: 'pending',
        originalData
      });
    }
  }

  return items;
}

export async function parseFile(file: File): Promise<ProductItem[]> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  if (extension === 'xml') {
    const content = await file.text();
    return parseXML(content);
  }

  if (['xlsx', 'xls'].includes(extension)) {
    const buffer = await file.arrayBuffer();
    return parseExcel(buffer);
  }

  if (['csv', 'tsv', 'txt'].includes(extension)) {
    const content = await file.text();
    return parseCSV(content);
  }

  // Пробуем как Excel
  try {
    const buffer = await file.arrayBuffer();
    return parseExcel(buffer);
  } catch {
    // Пробуем как текст
    const content = await file.text();
    try {
      return parseXML(content);
    } catch {
      return parseCSV(content);
    }
  }
}

export function exportToExcel(items: ProductItem[], filename: string = 'products_with_images.xlsx') {
  const data = items.map(item => ({
    '№': item.id,
    'Название товара': item.name,
    'Ссылка на изображение': item.imageUrl,
    'Статус': item.status === 'found' ? 'Найдено' : 
              item.status === 'error' ? 'Не найдено' : 
              item.status === 'searching' ? 'Поиск...' : 'Ожидание'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  
  // Устанавливаем ширину колонок
  ws['!cols'] = [
    { wch: 5 },
    { wch: 40 },
    { wch: 80 },
    { wch: 15 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Товары с изображениями');
  XLSX.writeFile(wb, filename);
}

export function exportToXML(items: ProductItem[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<products>\n';
  
  items.forEach(item => {
    xml += '  <product>\n';
    xml += `    <id>${item.id}</id>\n`;
    xml += `    <name><![CDATA[${item.name}]]></name>\n`;
    xml += `    <imageUrl><![CDATA[${item.imageUrl}]]></imageUrl>\n`;
    xml += `    <status>${item.status === 'found' ? 'found' : 'not_found'}</status>\n`;
    xml += '  </product>\n';
  });
  
  xml += '</products>';
  return xml;
}

export function downloadXML(items: ProductItem[], filename: string = 'products_with_images.xml') {
  const xml = exportToXML(items);
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
