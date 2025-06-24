/**
 * 环境变量管理器
 * 仅支持从真正的环境变量中获取配置
 */
class EnvManager {
    constructor() {
        this.env = {};
        this.currentEnvironment = 'development'; // 默认环境
        this.isLoaded = false;
    }

    /**
     * 初始化环境变量
     */
    async init() {
        if (this.isLoaded) return this.env;

        try {
            // 1. 确定当前环境
            this.currentEnvironment = this.detectEnvironment();

            // 2. 从环境变量加载配置
            this.loadFromEnvironment();

            this.isLoaded = true;
            
            return this.env;
        } catch (error) {
            // 返回默认配置
            return this.getDefaultConfig();
        }
    }

    /**
     * 检测当前环境
     */
    detectEnvironment() {
        // 1. 从环境变量NODE_ENV获取
        if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
            return process.env.NODE_ENV;
        }

        // 2. 从注入的全局环境变量获取
        if (window.ENVIRONMENT) {
            return window.ENVIRONMENT;
        }

        // 3. 根据域名判断
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('dev')) {
            return 'development';
        } else if (hostname.includes('test') || hostname.includes('staging')) {
            return 'test';
        } else {
            return 'production';
        }
    }

    /**
     * 从环境变量加载配置
     */
    loadFromEnvironment() {
        let count = 0;

        // 1. 尝试从process.env加载（Node.js环境或构建时注入）
        if (typeof process !== 'undefined' && process.env) {
            for (const [key, value] of Object.entries(process.env)) {
                if (key.startsWith('VITE_') || key.startsWith('REACT_APP_') || key.startsWith('VUE_APP_')) {
                    // 移除框架前缀
                    const cleanKey = key.replace(/^(VITE_|REACT_APP_|VUE_APP_)/, '');
                    this.env[cleanKey] = this.parseValue(value);
                    count++;
                } else if (['GEMINI_API_KEY', 'API_ENDPOINT', 'RATE_LIMIT_PER_MINUTE', 'RATE_LIMIT_PER_HOUR', 'DEBUG'].includes(key)) {
                    this.env[key] = this.parseValue(value);
                    count++;
                }
            }
        }

        // 2. 从window.process.env加载（构建时注入的环境变量）
        if (window.process && window.process.env) {
            for (const [key, value] of Object.entries(window.process.env)) {
                if (key.startsWith('VITE_') || key.startsWith('REACT_APP_') || key.startsWith('VUE_APP_')) {
                    const cleanKey = key.replace(/^(VITE_|REACT_APP_|VUE_APP_)/, '');
                    this.env[cleanKey] = this.parseValue(value);
                    count++;
                } else if (['GEMINI_API_KEY', 'API_ENDPOINT', 'RATE_LIMIT_PER_MINUTE', 'RATE_LIMIT_PER_HOUR', 'DEBUG'].includes(key)) {
                    this.env[key] = this.parseValue(value);
                    count++;
                }
            }
        }

        // 3. 从window.ENV直接加载（运行时注入）
        if (window.ENV) {
            for (const [key, value] of Object.entries(window.ENV)) {
                this.env[key] = this.parseValue(value);
                count++;
            }
        }

        if (count > 0) {
        } else {
            this.env = this.getDefaultConfig();
        }
    }

    /**
     * 解析值的类型
     */
    parseValue(value) {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (/^\d+$/.test(value)) return parseInt(value);
        if (/^\d*\.\d+$/.test(value)) return parseFloat(value);
        return value;
    }

    /**
     * 获取默认配置
     */
    getDefaultConfig() {
        return {
            GEMINI_API_KEY: "",
            API_ENDPOINT: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            RATE_LIMIT_PER_MINUTE: 15,
            RATE_LIMIT_PER_HOUR: 150,
            DEBUG: true
        };
    }

    /**
     * 获取环境变量
     */
    get(key, defaultValue = null) {
        return this.env[key] ?? defaultValue;
    }

    /**
     * 设置环境变量（运行时）
     */
    set(key, value) {
        this.env[key] = value;
        // 注意：由于只使用环境变量，运行时设置仅在当前会话有效
    }

    /**
     * 获取所有环境变量
     */
    getAll() {
        return { ...this.env };
    }

    /**
     * 获取当前环境名称
     */
    getEnvironment() {
        return this.currentEnvironment;
    }
}

// 创建全局实例
const envManager = new EnvManager();

// 导出实例和便捷函数
export default envManager;

// 便捷的获取函数
export const getEnv = (key, defaultValue = null) => {
    return envManager.get(key, defaultValue);
};

// 异步初始化函数
export const initEnv = () => {
    return envManager.init();
}; 