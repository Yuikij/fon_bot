# 环境变量使用指南

## 概述

这个项目使用纯环境变量驱动的配置系统，确保敏感信息的安全管理和环境隔离。

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 开发模式启动
```bash
npm run dev
```

### 3. 构建生产版本
```bash
npm run build:prod
```

## 📁 文件结构

```
project/
├── env-inject.js           # 环境变量注入脚本（开发用）
├── env-manager.js          # 环境变量管理器
├── config.js               # 应用配置（纯环境变量驱动）
├── build.js                # 构建脚本（支持环境变量注入）
├── package.json            # NPM配置
└── ENV_GUIDE.md           # 本文档
```

## ⚙️ 环境配置

### 环境变量设置方法

#### 方法1: 构建时注入（推荐）
```bash
# 设置环境变量后构建
export GEMINI_API_KEY="your_api_key"
export RATE_LIMIT_PER_MINUTE="60"
export DEBUG="false"
npm run build:prod

# 或者一行命令
GEMINI_API_KEY=your_key RATE_LIMIT_PER_MINUTE=60 npm run build:prod
```

#### 方法2: 系统环境变量
```bash
# Linux/Mac
export GEMINI_API_KEY="your_api_key"
export NODE_ENV="production"

# Windows
set GEMINI_API_KEY=your_api_key
set NODE_ENV=production
```

#### 方法3: .env 文件（通过构建工具）
```env
GEMINI_API_KEY=your_api_key
API_ENDPOINT=https://api.custom.com/v1
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000
DEBUG=false
```

### 环境检测优先级

1. **NODE_ENV环境变量**: `NODE_ENV=production`
2. **window.ENVIRONMENT**: 构建时注入的环境标识
3. **域名自动检测**:
   - `localhost` / `127.0.0.1` / `*dev*` → `development`
   - `*test*` / `*staging*` → `test`
   - 其他 → `production`

## 🛠️ 开发工具

### NPM脚本
```bash
# 开发
npm run dev                 # 开发模式启动 (localhost:8000)

# 构建
npm run build:dev          # 构建开发版本
npm run build:prod         # 构建生产版本
npm run build:test         # 构建测试版本

# 预览构建结果
npm run serve:dev          # 预览开发版本 (localhost:8001)
npm run serve:prod         # 预览生产版本 (localhost:8002)
npm run serve:test         # 预览测试版本 (localhost:8003)

# 工具
npm run clean              # 清理构建文件
npm run help               # 显示帮助
```

### 环境切换示例
```bash
# 以生产环境构建
npm run build:prod

# 以测试环境启动
npm run serve:test

# 临时切换环境 (URL参数)
http://localhost:8000?env=production
```

## 📊 环境变量列表

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `GEMINI_API_KEY` | string | - | Gemini API密钥 |
| `API_ENDPOINT` | string | Gemini官方端点 | API服务端点 |
| `RATE_LIMIT_PER_MINUTE` | number | 15 | 每分钟请求限制 |
| `RATE_LIMIT_PER_HOUR` | number | 150 | 每小时请求限制 |
| `DEBUG` | boolean | false | 调试模式开关 |

## 🔐 安全最佳实践

### 开发环境
- ✅ 在`env.json`中配置开发密钥
- ✅ 使用localStorage临时覆盖
- ✅ 通过URL参数快速测试

### 生产环境
- ❌ 不要在代码中硬编码密钥
- ✅ 使用构建时注入或服务器端配置
- ✅ 在CI/CD中设置环境变量
- ✅ 将敏感配置文件加入.gitignore

### 部署建议
```bash
# 构建时注入环境变量
ENV_GEMINI_API_KEY=prod_key npm run build:prod

# 或使用全局变量注入
echo "window.ENV_CONFIG={GEMINI_API_KEY:'$PROD_KEY'};" > dist/prod/runtime-config.js
```

## 🐛 故障排除

### 1. 环境变量未生效
- 检查控制台中的`[EnvManager]`日志
- 确认环境检测是否正确
- 验证配置文件格式

### 2. API密钥问题
- 确认`env.json`中配置了正确的密钥
- 检查密钥格式是否以`AIza`开头
- 验证网络连接

### 3. 构建失败
- 确保安装了Node.js (≥14.0.0)
- 运行`npm install`安装依赖
- 检查构建日志中的错误信息

## 📚 高级用法

### 自定义环境管理器
```javascript
import envManager from './env-manager.js';

// 运行时设置
envManager.set('CUSTOM_KEY', 'value');

// 获取所有配置
const allConfig = envManager.getAll();

// 获取当前环境
const currentEnv = envManager.getEnvironment();
```

### 条件配置
```javascript
import { getEnv } from './env-manager.js';

if (getEnv('DEBUG')) {
    console.log('调试模式已启用');
}

const apiEndpoint = getEnv('USE_PROXY') 
    ? '/api/proxy' 
    : getEnv('API_ENDPOINT');
```

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交Pull Request

## 📄 许可证

MIT License - 详见LICENSE文件。 