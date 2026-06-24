const http = require("http");
const { URL } = require("url");

process.env.USER_POOL_ID = process.env.USER_POOL_ID || "fake_pool_id";
process.env.CLIENT_ID = process.env.CLIENT_ID || "fake_client_id";

const ingestionHandler = require("./ingestion-lambda/index").handler;

const mockReports = {
    FPT: {
        stockSymbol: "FPT",
        companyName: "FPT Corporation",
        timeFrame: "1D",
        timestamp: new Date().toISOString(),
        currentPrice: 132000,
        previousClose: 129500,
        change: 2500,
        changePercent: 1.93,
        indicators: { rsi: 62.5, ma20: 128500, ma50: 125000 },
        aiAnalysis: {
            recommendation: "BUY",
            reasoning: "Mock report tu local-server de test FE fetch xuong backend."
        },
        priceHistory: Array.from({ length: 31 }, (_, index) => ({
            date: new Date(Date.now() - (30 - index) * 86400000).toISOString().slice(0, 10),
            close: 126000 + index * 190
        }))
    }
};

function send(res, statusCode, payload) {
    res.writeHead(statusCode, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
        "Content-Type": "application/json"
    });
    res.end(JSON.stringify(payload));
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", () => resolve(body));
        req.on("error", reject);
    });
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost:3000");

    if (req.method === "OPTIONS") {
        send(res, 200, { message: "OK" });
        return;
    }

    try {
        if (req.method === "POST" && url.pathname === "/api/analyze") {
            const result = await ingestionHandler({
                httpMethod: "POST",
                headers: req.headers,
                body: await readBody(req)
            });
            res.writeHead(result.statusCode, result.headers);
            res.end(result.body);
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/reports") {
            const symbol = (url.searchParams.get("symbol") || "FPT").toUpperCase();
            send(res, 200, mockReports[symbol] || { ...mockReports.FPT, stockSymbol: symbol });
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/alerts") {
            send(res, 200, []);
            return;
        }

        send(res, 404, { message: "Route not found" });
    } catch (error) {
        console.error(error);
        send(res, 500, { message: "Local server error", error: error.message });
    }
});

server.listen(3000, () => {
    console.log("Local backend server running at http://localhost:3000");
});
