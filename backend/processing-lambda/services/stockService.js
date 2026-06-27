/**
 * Service lấy dữ liệu lịch sử giá của cổ phiếu từ nhà cung cấp dữ liệu.
 */

/**
 * Lấy lịch sử giá cổ phiếu.
 * @param {string} stockSymbol - Mã cổ phiếu (ví dụ: 'FPT')
 * @param {string} timeFrame - Khung thời gian ('1D', '1W', '1M')
 * @returns {Promise<Array>} Danh sách các mốc giá lịch sử [{ time, open, high, low, close, volume }]
 */
async function getHistoricalData(stockSymbol, timeFrame) {
    console.log(`[stockService] Đang lấy dữ liệu lịch sử cho mã ${stockSymbol} (khung: ${timeFrame})...`);
    
    // Link API của Yahoo Finance cho chứng khoán VN (thêm đuôi .VN)
    const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${stockSymbol}.VN?interval=1d&range=1mo`;

    try {
        console.time("1. Tốc độ cào API Yahoo");
        const response = await fetch(apiUrl);
        const data = await response.json();
        console.timeEnd("2. Tốc độ cào API Yahoo");

        // Bóc tách dữ liệu từ Yahoo trả về
        const timestamps = data.chart.result[0].timestamp;
        const indicators = data.chart.result[0].indicators.quote[0];
        
        const history = [];
        // Lọc lấy khoảng 14 ngày gần nhất để AI và hàm tính RSI xử lý cho lẹ
        const startIndex = Math.max(0, timestamps.length - 14);

        for (let i = startIndex; i < timestamps.length; i++) {
            // Chỉ lấy những ngày có dữ liệu hợp lệ
            if (indicators.close[i] !== null) {
                history.push({
                    time: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
                    open: indicators.open[i],
                    high: indicators.high[i],
                    low: indicators.low[i],
                    close: indicators.close[i],
                    volume: indicators.volume[i]
                });
            }
        }
        return history;
    } catch (error) {
        console.error("[stockService] Lỗi khi cào dữ liệu thật:", error);
        return []; // Trả về mảng rỗng nếu lỗi
    }
}

module.exports = {
    getHistoricalData
};
