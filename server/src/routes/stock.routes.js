import { getStocksController } from "../controllers/stockController.js";
import { ctrlWrapper } from "../utils/ctrlWrapper.js";

export default async function stockRoutes(app, opts) {
  app.get(
    "/stock",
    ctrlWrapper(getStocksController)
  );
}
