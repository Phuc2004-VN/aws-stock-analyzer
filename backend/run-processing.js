/**
 * File dùng để giả lập AWS SQS kích hoạt con Processing Lambda
 */
const processingLambda = require('./processing-lambda/index.js');

const mockSQSEvent = {
    Records: [
        {
            body: JSON.stringify({
                stockSymbol: "FPT",
                timeFrame: "1D"
            })
        }
    ]
};

console.log("=> Kích hoạt test luồng Processing ngầm...");
processingLambda.handler(mockSQSEvent);