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
    
    // Bổ sung logic map timeFrame của Frontend với interval của Yahoo Finance
    let interval = "1d";
    let range = "6mo"; // Tăng lên 6 tháng để đảm bảo đủ >50 ngày giao dịch cho việc tính MA50 và RSI chính xác

    if (timeFrame === "1W") {
        interval = "1wk";
        range = "1y"; // Khung Tuần: Lấy 1 năm mới đủ 50 tuần để tính MA50
    } else if (timeFrame === "1M") {
        interval = "1mo";
        range = "5y"; // Khung Tháng: Lấy 5 năm mới đủ 50 tháng để tính MA50
    }

    const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${stockSymbol}.VN?interval=${interval}&range=${range}`;

    try {
        console.time("Tốc độ cào API Yahoo");
        const response = await fetch(apiUrl);
        const data = await response.json();
        console.timeEnd("Tốc độ cào API Yahoo");

        // Bóc tách dữ liệu từ Yahoo trả về
        const timestamps = data.chart.result[0].timestamp;
        const indicators = data.chart.result[0].indicators.quote[0];
        
        const history = [];
        
        // ĐÃ SỬA: Lấy toàn bộ ngày có dữ liệu để ném cho hàm tính MA50 xử lý, không cắt bớt 14 ngày nữa
        for (let i = 0; i < timestamps.length; i++) {
            // Chỉ lấy những ngày có dữ liệu hợp lệ (không bị null)
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
