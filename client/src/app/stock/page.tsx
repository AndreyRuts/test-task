"use client";

import { useEffect, useState } from "react";
import { fetchStocks, Stock } from "@/lib/api/stock";
import StockFilters from "@/components/StockFilters";
import StockTable from "@/components/StockTable";
import clsx from "clsx";
import Loader from "@/components/Loader";

export default function StockPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [symbolFilter, setSymbolFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const limit = 5;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const { data, total } = await fetchStocks({
          symbol: symbolFilter,
          country: countryFilter,
          page,
          limit,
        });
        setStocks(data);
        setTotal(total);
      } catch (error) {
        console.error("Failed to fetch stocks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [symbolFilter, countryFilter, page]);

  const totalPages = Math.ceil(total / limit);
  const resetPage = () => setPage(1);

  return (
    <div className="max-w-5xl mx-auto px-6 mt-[262px]">
      <StockFilters
        symbol={symbolFilter}
        onSymbolChange={(val) => {
          setSymbolFilter(val);
          resetPage();
        }}
        country={countryFilter}
        onCountryChange={(val) => {
          setCountryFilter(val);
          resetPage();
        }}
      />
      {isLoading ? <Loader size="lg" /> : <StockTable stocks={stocks} />}
      <div className="mt-[90px] h-[810px] relative">
        <div className="absolute top-0 w-full flex justify-center items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="w-9 h-9 rounded-[11px] hover:bg-white hover:text-black transition disabled:opacity-40 flex justify-center items-center"
            aria-label="Previous page"
          >
            <svg width="7" height="11" fill="none" aria-hidden="true">
              <use xlinkHref="/icons.svg#arrow-right" />
            </svg>
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
            )
            .reduce<number[]>((acc, curr, i, arr) => {
              if (i > 0 && curr - arr[i - 1] > 1) acc.push(-1);
              acc.push(curr);
              return acc;
            }, [])
            .map((p, idx) =>
              p === -1 ? (
                <span key={`ellipsis-${idx}`} className="text-white px-2">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={clsx(
                    "w-[36px] h-[36px] text-sm rounded-[11px] transition",
                    page === p
                      ? "bg-[#0070f3] text-white shadow-[0_2px_25px_0_rgba(0,112,243,0.59)]"
                      : "text-white hover:bg-white hover:text-black"
                  )}
                >
                  {p}
                </button>
              )
            )}

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="w-9 h-9 rounded-[11px] hover:bg-white hover:text-black transition disabled:opacity-40 flex justify-center items-center"
            aria-label="Next page"
          >
            <svg width="7" height="11" fill="none" aria-hidden="true">
              <use xlinkHref="/icons.svg#arrow-left" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
