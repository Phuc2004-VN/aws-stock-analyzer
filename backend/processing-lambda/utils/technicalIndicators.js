/**
 * Này là file mẫu thuật toán tính toán chỉ báo RSI, MA20, MA50 dựa trên lịch sử giá
 * chưa biết đúng sai nha
 */

/**
 * Tính toán Đường trung bình động đơn giản (Simple Moving Average - SMA)
 * @param {Array} history - Dữ liệu lịch sử giá
 * @param {number} period - Số phiên tính toán (ví dụ: 20, 50)
 * @returns {number} Giá trị SMA cuối cùng
 */
function calculateSMA(history, period) {
    if (!history || history.length < period) {
        // Nếu không đủ dữ liệu, trả về giá đóng cửa gần nhất
        return history.length > 0 ? history[history.length - 1].close : 0;
    }
    
    const slice = history.slice(-period);
    const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
    return Math.round(sum / period);
}

/**
 * Tính toán Chỉ số sức mạnh tương đối (Relative Strength Index - RSI)
 * @param {Array} history - Dữ liệu lịch sử giá (mỗi phần tử có thuộc tính close)
 * @param {number} period - Chu kỳ tính RSI (mặc định 14 phiên)
 * @returns {number} Giá trị RSI (từ 0 đến 100)
 */
function calculateRSI(history, period = 14) {
    if (!history || history.length <= period) {
        return 50; // Giá trị mặc định nếu không đủ dữ liệu
    }
    
    let gains = 0;
    let losses = 0;
    
    // Tính thay đổi giá cho các phiên ban đầu
    for (let i = 1; i <= period; i++) {
        const difference = history[i].close - history[i - 1].close;
        if (difference > 0) {
            gains += difference;
        } else {
            losses -= difference;
        }
    }
    
    let averageGain = gains / period;
    let averageLoss = losses / period;
    
    // Tính RSI bằng phương pháp làm mượt Wilder (Wilder's Smoothing) cho các phiên tiếp theo
    for (let i = period + 1; i < history.length; i++) {
        const difference = history[i].close - history[i - 1].close;
        let currentGain = 0;
        let currentLoss = 0;
        
        if (difference > 0) {
            currentGain = difference;
        } else {
            currentLoss = -difference;
        }
        
        averageGain = (averageGain * (period - 1) + currentGain) / period;
        averageLoss = (averageLoss * (period - 1) + currentLoss) / period;
    }
    
    if (averageLoss === 0) {
        return 100;
    }
    
    const rs = averageGain / averageLoss;
    const rsi = 100 - (100 / (1 + rs));
    return parseFloat(rsi.toFixed(2));
}

/**
 * Tính toán tất cả các chỉ số kỹ thuật cần thiết cho hệ thống.
 * @param {Array} history - Danh sách lịch sử giá của cổ phiếu
 * @returns {Object} Đối tượng chứa các chỉ số rsi, ma20, ma50
 */
function calculateAllIndicators(history) {
    return {
        rsi: calculateRSI(history, 14),
        ma20: calculateSMA(history, 20),
        ma50: calculateSMA(history, 50)
    };
}

module.exports = {
    calculateSMA,
    calculateRSI,
    calculateAllIndicators
};
