import { getEnvVar } from "../utils/getEnvVar.js";

export const getStocksService = async ({ symbol, country, page = 1, limit = 10 }) => {
  const apiKey = getEnvVar('FINNHUB_API_KEY');
  if (!apiKey) throw new Error("Missing FINNHUB_API_KEY in .env");

  // 1. Получаем все символы
  const symbolsRes = await fetch(`https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${apiKey}`);
  const symbols = await symbolsRes.json();

  let filtered = symbols;

  if (symbol) {
    filtered = filtered.filter(item =>
      item.symbol.toLowerCase().includes(symbol.toLowerCase())
    );
  }

  if (country) {
    filtered = filtered.filter(item =>
      item.mic?.toLowerCase().includes(country.toLowerCase())
    );
  }

  // 2. Подсчёт общего количества ДО пагинации
  const total = filtered.length;

  // 3. Пагинация
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  // 4. Фетчим данные по каждому символу
  const results = await Promise.all(
    paginated.map(async (item) => {
      try {
        const [quote, profile] = await Promise.all([
          fetch(`https://finnhub.io/api/v1/quote?symbol=${item.symbol}&token=${apiKey}`).then(r => r.json()),
          fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${item.symbol}&token=${apiKey}`).then(r => r.json()),
        ]);

        const currentPrice = quote?.c ?? null;
        const prevPrice = quote?.pc ?? null;
        const dailyChange = quote?.d ?? null;

        let monthlyChange = null;
        if (currentPrice !== null && prevPrice !== null) {
          monthlyChange = Number((currentPrice - prevPrice).toFixed(2));
        }

        return {
          symbol: item.symbol,
          name: profile.name || item.description,
          marketCap: profile.marketCapitalization ?? null,
          price: currentPrice,
          changes: dailyChange,
          monthlyChange,
        };
      } catch (err) {
        console.error(`Failed to fetch data for ${item.symbol}:`, err.message);
        return {
          symbol: item.symbol,
          name: item.description,
          marketCap: null,
          price: null,
          changes: null,
          monthlyChange: null,
          error: `Data fetch failed: ${err.message}`,
        };
      }
    })
  );

  // 5. Возвращаем данные + total
  return {
    data: results,
    total,
  };
};
