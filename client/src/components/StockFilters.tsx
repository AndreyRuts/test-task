import { Input } from "@nextui-org/react";
import { ChangeEvent } from "react";

interface Props {
  country: string;
  symbol: string;
  onCountryChange: (value: string) => void;
  onSymbolChange: (value: string) => void;
}

export default function StockFilters({
  country,
  symbol,
  onCountryChange,
  onSymbolChange,
}: Props) {
  return (
    <div className="flex justify-center mb-[60px]">
      <div className="flex flex-col gap-[27px]">
        <div className="w-[282px] h-[32px] border border-white rounded-[10px] bg-transparent">
          <Input
            isClearable
            radius="none"
            variant="bordered"
            classNames={{
              inputWrapper:
                "bg-transparent border-none h-[32px] flex items-center",
              input:
                "text-white placeholder:text-white pl-[18px] pb-[8px] text-sm leading-none",
            }}
            placeholder="Enter your country"
            value={country}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onCountryChange(e.target.value)
            }
          />
        </div>
        <div className="w-[282px] h-[32px] border border-white rounded-[10px] bg-transparent">
          <Input
            isClearable
            radius="none"
            variant="bordered"
            classNames={{
              inputWrapper:
                "bg-transparent border-none h-[32px] flex items-center",
              input:
                "text-white placeholder:text-white pl-[18px] pb-[8px] text-sm leading-none",
            }}
            placeholder="Enter symbol or name"
            value={symbol}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onSymbolChange(e.target.value)
            }
          />
        </div>
      </div>
    </div>
  );
}
