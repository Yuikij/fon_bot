# 🔧 快速修复指南

## 问题说明

遇到错误：
```
POST file:///E:/api/chat net::ERR_FILE_NOT_FOUND
代理调用失败，尝试直接调用Gemini: TypeError: Failed to fetch
```

**原因**：项目尝试调用不存在的代理端点 `/api/chat`

## ✅ 已修复

我已经修改了 `api.js` 的调用逻辑：
- **优先使用 Gemini API** 而不是代理
- **自动检测环境** 避免在文件协议下调用代理
- **保持向后兼容** 支持 websim 环境

## 🚀 使用步骤

### 1. 获取 Gemini API 密钥
访问 [Google AI Studio](https://makersuite.google.com/app/apikey) 获取密钥

### 2. 配置密钥（选择其中一种方式）

#### 方式 1：环境变量（推荐）
创建 `.env` 文件：
```bash
VITE_GEMINI_API_KEY=AIzaSy...your-actual-key-here
```

#### 方式 2：手动输入
项目会在需要时弹出提示框要求输入密钥

#### 方式 3：代码设置
在浏览器控制台中：
```javascript
// 导入设置函数
import('./api.js').then(api => {
    api.setApiKey('AIzaSy...your-actual-key-here');
});
```

### 3. 启动项目

#### 使用静态服务器（推荐）
```bash
# 安装并启动serve
npx serve . --cors --single
```

#### 或者使用其他方式
```bash
# Python
python -m http.server 8000

# Node.js
npx http-server . --cors

# Live Server (VS Code扩展)
# 右键 index.html -> Open with Live Server
```

## 🔍 测试验证

1. 打开 `test_api.html` 测试配置
2. 点击"测试配置"按钮
3. 查看测试结果

## 🚨 常见问题

### 问题1：仍然出现 ERR_FILE_NOT_FOUND
**解决**：确保使用 HTTP 服务器而不是直接打开文件

### 问题2：API密钥格式错误
**解决**：确保密钥以 `AIza` 开头，长度约39个字符

### 问题3：请求被拒绝
**解决**：
- 检查图片格式（支持 JPEG, PNG, WebP）
- 确保图片大小不超过 20MB
- 检查网络连接

### 问题4：环境变量不生效
**解决**：
- 确保 `.env` 文件在项目根目录
- 变量名必须以 `VITE_` 开头
- 重启开发服务器

## 📝 日志查看

打开浏览器开发者工具（F12），查看：
- **Console** 标签页：查看错误日志
- **Network** 标签页：查看API请求状态

## 🎯 预期结果

修复后，项目应该：
1. ✅ 不再出现代理错误
2. ✅ 直接使用 Gemini API
3. ✅ 正常分析图片
4. ✅ 显示分析结果

## 📞 需要帮助？

如果仍有问题，请：
1. 检查浏览器控制台的详细错误信息
2. 确认API密钥有效性
3. 尝试使用 `test_api.html` 进行诊断 