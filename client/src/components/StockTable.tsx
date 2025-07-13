import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/react";
import { Stock } from "@/lib/api/stock";

interface Props {
  stocks: Stock[];
}

export default function StockTable({ stocks }: Props) {
  if (!Array.isArray(stocks)) {
    return (
      <div className="text-red-500 p-4 bg-red-100 rounded">
        Ошибка: данные акций не являются массивом
      </div>
    );
  }

  return (
    <Table
      isStriped={false}
      removeWrapper
      aria-label="Clean Stock Table"
      classNames={{
        table: "text-center text-sm",
        td: "py-2 px-3 text-center",
        th: "py-2 px-3 text-center bg-transparent font-normal text-white",
      }}
    >
      <TableHeader>
        <TableColumn>#</TableColumn>
        <TableColumn>Symbol</TableColumn>
        <TableColumn>Name</TableColumn>
        <TableColumn>Capitalization</TableColumn>
        <TableColumn>Price</TableColumn>
        <TableColumn>Price change per day</TableColumn>
        <TableColumn>Price change per month</TableColumn>
      </TableHeader>
      <TableBody>
        {stocks.map((stock, index) => (
          <TableRow key={stock.symbol}>
            <TableCell>{index + 1}</TableCell>
            <TableCell>{stock.symbol ?? "—"}</TableCell>
            <TableCell>{stock.name ?? "—"}</TableCell>
            <TableCell>
              {stock.marketCap != null
                ? `${(stock.marketCap * 1e6).toLocaleString()}`
                : "—"}
            </TableCell>
            <TableCell>
              {stock.price != null
                ? `${stock.price.toLocaleString()} USD`
                : "—"}
            </TableCell>
            <TableCell
              className={
                stock.changes != null
                  ? stock.changes >= 0
                    ? "text-green-600"
                    : "text-red-600"
                  : ""
              }
            >
              {stock.changes != null
                ? `${stock.changes > 0 ? "+" : ""}${stock.changes.toFixed(2)}%`
                : "—"}
            </TableCell>
            <TableCell
              className={
                stock.monthlyChange != null
                  ? stock.monthlyChange >= 0
                    ? "text-green-600"
                    : "text-red-600"
                  : ""
              }
            >
              {stock.monthlyChange != null
                ? `${
                    stock.monthlyChange > 0 ? "+" : ""
                  }${stock.monthlyChange.toFixed(2)}%`
                : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
