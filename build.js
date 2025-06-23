#!/usr/bin/env node

/**
 * 简单的构建脚本
 * 用于生成不同环境的配置和部署文件
 */

const fs = require('fs');
const path = require('path');

// 构建配置
const buildConfig = {
    development: {
        outputDir: 'dist/dev',
        envFile: 'env.json',
        minify: false
    },
    production: {
        outputDir: 'dist/prod',
        envFile: 'env.production.json',
        minify: true
    },
    test: {
        outputDir: 'dist/test',
        envFile: 'env.test.json',
        minify: false
    }
};

// 获取命令行参数
const args = process.argv.slice(2);
const environment = args[0] || 'development';
const config = buildConfig[environment];

if (!config) {
    console.error(`❌ 未知的环境: ${environment}`);
    console.log('可用环境: development, production, test');
    process.exit(1);
}

console.log(`🔨 开始构建环境: ${environment}`);

// 创建输出目录
if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
}

// 复制文件列表
const filesToCopy = [
    'index.html',
    'main.js',
    'api.js',
    'config.js',
    'env-manager.js',
    'ui.js',
    'store.js',
    'styles.css',
    'script.js'
];

// 复制文件
filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
        const destPath = path.join(config.outputDir, file);
        fs.copyFileSync(file, destPath);
        console.log(`✅ 复制: ${file} -> ${destPath}`);
    } else {
        console.warn(`⚠️  文件不存在: ${file}`);
    }
});

// 处理环境变量注入
const envVarsToInject = [
    'GEMINI_API_KEY',
    'API_ENDPOINT', 
    'RATE_LIMIT_PER_MINUTE',
    'RATE_LIMIT_PER_HOUR',
    'DEBUG',
    'NODE_ENV'
];

// 收集环境变量
const injectedEnv = {};
envVarsToInject.forEach(key => {
    if (process.env[key]) {
        injectedEnv[key] = process.env[key];
    }
});

// 生成环境变量注入脚本
const envScript = `
// 环境变量注入脚本 - 构建时生成
window.process = window.process || {};
window.process.env = ${JSON.stringify(injectedEnv, null, 2)};
window.ENV = ${JSON.stringify(injectedEnv, null, 2)};
window.ENVIRONMENT = '${environment}';
console.log('[Build] 注入的环境变量:', window.ENV);
`;

fs.writeFileSync(path.join(config.outputDir, 'env-inject.js'), envScript);
console.log(`✅ 环境变量注入脚本已生成: env-inject.js`);
console.log(`📊 注入了 ${Object.keys(injectedEnv).length} 个环境变量:`, Object.keys(injectedEnv));

// 生成部署信息
const deployInfo = {
    environment,
    buildTime: new Date().toISOString(),
    version: '1.0.0'
};

fs.writeFileSync(
    path.join(config.outputDir, 'deploy-info.json'),
    JSON.stringify(deployInfo, null, 2)
);

console.log(`🎉 构建完成: ${config.outputDir}`);
console.log(`📋 环境: ${environment}`);
console.log(`⏰ 构建时间: ${deployInfo.buildTime}`);

// 生成启动说明
const startupGuide = `
# 启动说明

## 环境: ${environment}

### 直接运行:
1. 使用 HTTP 服务器启动: \`npx http-server ${config.outputDir}\`
2. 或使用 Python: \`cd ${config.outputDir} && python -m http.server 8000\`

### 配置说明:
- 环境配置文件: env.json
- 当前环境: ${environment}
- 构建时间: ${deployInfo.buildTime}

### 环境变量覆盖方法:
1. URL参数: ?ENV_GEMINI_API_KEY=your_key
2. localStorage: localStorage.setItem('ENV_GEMINI_API_KEY', 'your_key')
3. 全局变量: window.ENV_CONFIG = { GEMINI_API_KEY: 'your_key' }
`;

fs.writeFileSync(path.join(config.outputDir, 'README.md'), startupGuide);

console.log('📖 启动说明已生成: README.md'); 