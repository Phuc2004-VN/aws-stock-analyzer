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
    
    // MOCK DATA: Trả về dữ liệu giả định để kiểm thử luồng xử lý
    const basePrice = stockSymbol === "FPT" ? 130000 : 80000;
    const history = [];
    const now = new Date();
    
    for (let i = 10; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const randomFluctuation = (Math.random() - 0.45) * 2000; // Xu hướng tăng nhẹ
        history.push({
            time: date.toISOString().split('T')[0],
            open: basePrice + randomFluctuation - 500,
            high: basePrice + randomFluctuation + 1500,
            low: basePrice + randomFluctuation - 1000,
            close: basePrice + randomFluctuation,
            volume: Math.floor(Math.random() * 500000) + 100000
        });
    }
    
    return history;
}

module.exports = {
    getHistoricalData
};
