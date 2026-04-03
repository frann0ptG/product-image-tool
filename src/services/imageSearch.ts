// Генерация ссылок для ручного поиска изображений товаров
// Пользователь сам переходит по ссылке, находит фото, копирует URL и вставляет

export interface SearchLink {
  name: string;
  url: string;
  icon: string;
  description: string;
}

export function generateSearchLinks(query: string): SearchLink[] {
  const encoded = encodeURIComponent(query);

  return [
    {
      name: 'Яндекс Картинки',
      url: `https://yandex.ru/images/search?text=${encoded}+фото+товар`,
      icon: '🔍',
      description: 'Поиск изображений в Яндексе'
    },
    {
      name: 'Wildberries',
      url: `https://www.wildberries.ru/catalog/0/search.aspx?search=${encoded}`,
      icon: '🟣',
      description: 'Каталог товаров на Wildberries'
    },
    {
      name: 'Ozon',
      url: `https://www.ozon.ru/search/?text=${encoded}&from_global=true`,
      icon: '🔵',
      description: 'Каталог товаров на Ozon'
    },
    {
      name: 'Яндекс Маркет',
      url: `https://market.yandex.ru/search?text=${encoded}`,
      icon: '🟡',
      description: 'Каталог товаров на Яндекс Маркете'
    },
    {
      name: 'Google Картинки',
      url: `https://www.google.com/search?tbm=isch&q=${encoded}+product+photo`,
      icon: '🌐',
      description: 'Поиск изображений в Google'
    },
  ];
}
