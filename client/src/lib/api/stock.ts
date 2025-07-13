import axios from 'axios';

const BASE_URL = 'http://localhost:5000/stock';

export interface Stock {
  name: string;
  symbol: string;
  marketCap: number | null;
  price: number | null;
  changes: number | null;
  monthlyChange?: number | null;
  country?: string;
}

export interface StockFilters {
  symbol?: string;
  country?: string;
  page?: number;
  limit?: number;
}

interface StockApiResponse {
  status: number;
  message: string;
  data: Stock[];         // Массив акций
  total: number;         // Общее количество
}

export const fetchStocks = async (
  filters: StockFilters = {}
): Promise<{ data: Stock[]; total: number }> => {
  const params = new URLSearchParams(
    Object.entries(filters).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {})
  ).toString();

  const response = await axios.get<StockApiResponse>(`${BASE_URL}?${params}`);

  return {
    data: response.data.data,
    total: response.data.total,
  };
};
