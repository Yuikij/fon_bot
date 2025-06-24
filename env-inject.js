// 环境变量注入脚本 - 默认开发配置
window.process = window.process || {};
window.process.env = {
  "GEMINI_API_KEY": "",
  "API_ENDPOINT": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
  "RATE_LIMIT_PER_MINUTE": "15",
  "RATE_LIMIT_PER_HOUR": "150",
  "DEBUG": "true",
  "NODE_ENV": "development"
};
window.ENV = {
  "GEMINI_API_KEY": "",
  "API_ENDPOINT": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
  "RATE_LIMIT_PER_MINUTE": "15",
  "RATE_LIMIT_PER_HOUR": "150",
  "DEBUG": "true",
  "NODE_ENV": "development"
};
window.ENVIRONMENT = 'development'; 