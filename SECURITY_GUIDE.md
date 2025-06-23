# 前端项目API密钥安全指南

## ⚠️ 重要安全提醒

**在纯前端项目中，API密钥无法做到完全安全！** 前端代码对用户完全可见，任何存储在前端的密钥都可能被提取。

## 安全级别对比

### 🔴 高风险：硬编码密钥
```javascript
// ❌ 绝对不要这样做
const API_KEY = "sk-your-secret-key-here";
```

### 🟡 中等风险：环境变量
```javascript
// ⚠️ 稍好但仍有风险
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
```

### 🟢 低风险：用户输入
```javascript
// ✅ 相对安全，但用户体验差
const apiKey = prompt("请输入您的Gemini API密钥");
sessionStorage.setItem('temp_api_key', apiKey);
```

### 🟢 最安全：后端代理
```javascript
// ✅ 推荐方案
const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, image })
});
```

## 安全策略实施

### 1. 环境变量配置
创建 `.env` 文件：
```bash
VITE_GEMINI_API_KEY=AIzaSy...your-gemini-key-here
```

在代码中使用：
```javascript
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
```

### 2. 用户输入方案
让用户自己提供密钥：
```javascript
function getApiKey() {
    let key = sessionStorage.getItem('api_key');
    if (!key) {
        key = prompt('请输入您的Gemini API密钥：');
        if (key) sessionStorage.setItem('api_key', key);
    }
    return key;
}
```

### 3. 请求限制
实施请求频率限制：
```javascript
class RateLimiter {
    constructor(maxPerMinute = 10, maxPerHour = 100) {
        this.requests = [];
        this.maxPerMinute = maxPerMinute;
        this.maxPerHour = maxPerHour;
    }
    
    canMakeRequest() {
        const now = Date.now();
        this.requests = this.requests.filter(time => 
            time > now - 60 * 60 * 1000 // 保留1小时内的记录
        );
        
        const recentRequests = this.requests.filter(time => 
            time > now - 60 * 1000 // 1分钟内的请求
        );
        
        if (recentRequests.length >= this.maxPerMinute) {
            throw new Error('请求过于频繁，请稍后再试');
        }
        
        if (this.requests.length >= this.maxPerHour) {
            throw new Error('已达到每小时请求限制');
        }
        
        this.requests.push(now);
        return true;
    }
}
```

### 4. 密钥验证
添加基本的密钥格式验证：
```javascript
function validateApiKey(key) {
    if (!key || key.length < 20) {
        throw new Error('API密钥无效');
    }
    if (!key.startsWith('AIza')) {
        throw new Error('Gemini API密钥格式错误，应以AIza开头');
    }
    return true;
}
```

## 推荐架构

### 最佳方案：后端代理
```
前端 → 自己的后端API → LLM服务商
```

后端示例（Node.js/Express）：
```javascript
app.post('/api/chat', async (req, res) => {
    try {
        const { message, image } = req.body;
        
        // 处理base64图片数据
        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1];
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: message },
                        { 
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }]
            })
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

## 部署注意事项

### 1. 环境变量管理
- 开发环境：使用 `.env` 文件
- 生产环境：在部署平台设置环境变量
- 永远不要将 `.env` 文件提交到Git

### 2. 域名限制
如果必须在前端使用密钥，考虑：
- 使用有域名限制的API密钥
- 设置API使用限额
- 监控API使用情况

### 3. 错误处理
```javascript
async function safeApiCall(apiFunction, ...args) {
    try {
        return await apiFunction(...args);
    } catch (error) {
        console.error('API调用失败:', error);
        // 不要在错误信息中暴露密钥
        throw new Error('服务暂时不可用，请稍后重试');
    }
}
```

## 安全检查清单

- [ ] 密钥不在源码中硬编码
- [ ] 使用环境变量或用户输入
- [ ] 实施请求频率限制
- [ ] 添加密钥格式验证
- [ ] 错误处理不泄露敏感信息
- [ ] 考虑使用后端代理
- [ ] 设置API使用限额
- [ ] 监控异常活动

## 总结

纯前端项目中使用API密钥存在固有的安全风险。最安全的方案是使用后端代理服务。如果必须在前端使用，应采用多层防护措施并接受一定的安全风险。 