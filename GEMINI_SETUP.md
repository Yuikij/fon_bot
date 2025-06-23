# Gemini API 设置指南

## 🚀 快速开始

### 1. 获取 Gemini API 密钥

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 使用 Google 账号登录
3. 点击 "Create API Key"
4. 复制生成的 API 密钥（格式：`AIzaSy...`）

### 2. 配置环境变量

#### 方法 1：创建 .env 文件（推荐）
```bash
# 在项目根目录创建 .env 文件
VITE_GEMINI_API_KEY=AIzaSy...your-actual-api-key-here
```

#### 方法 2：系统环境变量
```bash
# Windows (PowerShell)
$env:VITE_GEMINI_API_KEY="AIzaSy...your-actual-api-key-here"

# macOS/Linux
export VITE_GEMINI_API_KEY="AIzaSy...your-actual-api-key-here"
```

### 3. 启动项目

```bash
# 如果使用开发服务器
npm run dev
# 或
yarn dev

# 如果使用静态服务器
npx serve .
```

## 🔧 配置选项

### 更改 Gemini 模型
在 `config.js` 中修改端点：
```javascript
endpoints: {
    // 使用不同的模型
    gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
    // 或者使用 gemini-pro-vision
    // gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent',
}
```

### 调整生成参数
在 `api.js` 的 `analyzeImageWithGemini` 函数中：
```javascript
generationConfig: {
    maxOutputTokens: 1000,    // 最大输出长度
    temperature: 0.7,         // 创造性 (0-1)
    topP: 0.8,               // 核采样
    topK: 40                 // Top-K 采样
}
```

## 📊 Gemini API 特点

### 优势
- ✅ 免费额度较高（每分钟 15 次请求）
- ✅ 支持多模态（文本+图像）
- ✅ 响应速度快
- ✅ 中文支持良好

### 限制
- ⚠️ 每分钟请求限制：15 次
- ⚠️ 每天请求限制：1500 次（免费版）
- ⚠️ 图片大小限制：20MB
- ⚠️ 可能对某些内容有安全过滤

## 🛠️ 故障排除

### 常见错误

#### 1. API 密钥无效
```
错误：Gemini API密钥格式错误，应以AIza开头
```
**解决方案：** 检查 API 密钥是否正确复制，确保以 `AIza` 开头

#### 2. 请求被拒绝
```
错误：Gemini API请求失败: 400 Bad Request
```
**解决方案：** 
- 检查图片格式是否支持（JPEG, PNG, WebP, HEIC, HEIF）
- 确保图片大小不超过 20MB
- 检查内容是否触发安全过滤

#### 3. 配额超限
```
错误：请求过于频繁，请稍后再试
```
**解决方案：** 等待一分钟后重试，或考虑升级 API 计划

#### 4. JSON 解析失败
```
警告：无法解析JSON响应，尝试文本解析
```
**说明：** 这是正常情况，系统会自动解析文本响应

### 调试技巧

1. **查看控制台日志**
   ```javascript
   // 在浏览器开发者工具中查看详细错误信息
   console.log('Gemini API 响应:', response);
   ```

2. **测试 API 密钥**
   ```javascript
   // 在控制台中测试
   console.log('API密钥:', import.meta.env.VITE_GEMINI_API_KEY);
   ```

3. **检查网络请求**
   - 打开浏览器开发者工具
   - 查看 Network 标签页
   - 检查 Gemini API 请求的状态码和响应

## 🔒 安全建议

1. **不要在代码中硬编码 API 密钥**
2. **使用环境变量管理密钥**
3. **生产环境建议使用后端代理**
4. **定期检查 API 使用情况**
5. **设置适当的请求限制**

## 📚 相关文档

- [Gemini API 官方文档](https://ai.google.dev/docs)
- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API 定价](https://ai.google.dev/pricing)
- [安全最佳实践](./SECURITY_GUIDE.md) 