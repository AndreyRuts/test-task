import { getStocksService } from "../services/stockService.js";

export const getStocksController = async (req, reply) => {
    const { symbol, country, page = 1, limit = 5 } = req.query;

    const data = await getStocksService({
        symbol,
        country,
        page: Number(page),
        limit: Number(limit),
    });

    reply.send({
        status: 200,
        message: 'Data successfully fetched',
        data,
    });
};
