import { systemPrompts, apiConfig, validateApiKey } from './config.js';
import { getEnv } from './env-manager.js';

// 请求限制管理
class RateLimiter {
    constructor() {
        this.requests = [];
    }
    
    canMakeRequest() {
        const now = Date.now();
        const oneMinuteAgo = now - 60 * 1000;
        const oneHourAgo = now - 60 * 60 * 1000;
        
        // 清理过期记录
        this.requests = this.requests.filter(time => time > oneHourAgo);
        
        const recentRequests = this.requests.filter(time => time > oneMinuteAgo);
        
        if (recentRequests.length >= apiConfig.rateLimit.maxRequestsPerMinute) {
            throw new Error('请求过于频繁，请稍后再试');
        }
        
        if (this.requests.length >= apiConfig.rateLimit.maxRequestsPerHour) {
            throw new Error('已达到每小时请求限制');
        }
        
        this.requests.push(now);
        return true;
    }
}

const rateLimiter = new RateLimiter();

// Gemini API调用（需要API密钥）
async function analyzeImageWithGemini(imageDataUrl, aiType) {
    rateLimiter.canMakeRequest();
    
    const systemPrompt = systemPrompts[aiType];

    // 将base64图片数据转换为Gemini API需要的格式
    const base64Data = imageDataUrl.split(',')[1];
    const mimeType = imageDataUrl.split(';')[0].split(':')[1];
    
    const response = await fetch(`${apiConfig.endpoints.proxy}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: `${systemPrompt}\n\n请分析这张图片并决定的：上还是不上？`
                        },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7,
                topP: 0.8,
                topK: 40
            }
        }),
    });

    if (!response.ok) {
        let errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            errorText = errorJson.error ? errorJson.error.message : errorText;
        } catch (e) {
            // 保持为纯文本
        }
        throw new Error(`API返回错误 (状态 ${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts[0]) {
        throw new Error('API响应格式不正确，缺少必要数据');
    }
    
    const content = data.candidates[0].content.parts[0].text;

    try {
        const parsed = JSON.parse(content);
        return parsed;
    } catch (parseError) {
        try {
            const textParsed = parseTextResponse(content);
            return textParsed;
        } catch (finalError) {
            throw new Error(`JSON解析和文本解析均失败: ${finalError.message}`);
        }
    }
}

// 文本响应解析函数
function parseTextResponse(text) {
    try {
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            const jsonText = jsonMatch[1];
            const parsed = JSON.parse(jsonText);
            return parsed;
        }
    } catch (e) {
        // 忽略错误，尝试更宽松的解析
    }

    try {
        // 尝试在没有```json标记的情况下查找JSON对象
        const jsonContentMatch = text.match(/{\s*["']verdict["']\s*:/);
        if (jsonContentMatch) {
            const startIndex = jsonContentMatch.index;
            // 找到匹配的大括号
            let balance = 0;
            let endIndex = -1;
            for (let i = startIndex; i < text.length; i++) {
                if (text[i] === '{') {
                    balance++;
                } else if (text[i] === '}') {
                    balance--;
                    if (balance === 0) {
                        endIndex = i + 1;
                        break;
                    }
                }
            }
            
            if (endIndex !== -1) {
                const jsonText = text.substring(startIndex, endIndex);
                const parsed = JSON.parse(jsonText);
                return parsed;
            }
        }
    } catch (e) {
        // 忽略错误，继续
    }

    // 尝试不严格的JSON解析
    try {
        const result = flexibleJsonParse(text);
        return result;
    } catch (e) {
        // 最终回退到纯文本解析
    }
    
    return fallbackToTextParsing(text);
}

/**
 * 当所有JSON解析都失败时，回退到基于文本的解析。
 * @param {string} text - AI模型的原始文本输出。
 * @returns {object} - 一个包含从文本中提取的数据的对象。
 */
function fallbackToTextParsing(text) {
    const result = {
        verdict: "UNKNOWN",
        rating: 0,
        explanation: text, // 原始文本作为解释
    };

    const verdictMatch = text.match(/["']?verdict["']?\s*:\s*["']?(\w+)["']?/i);
    if (verdictMatch && verdictMatch[1]) {
        result.verdict = verdictMatch[1].toUpperCase();
    }

    const ratingMatch = text.match(/["']?rating["']?\s*:\s*(\d+)/i);
    if (ratingMatch && ratingMatch[1]) {
        result.rating = parseInt(ratingMatch[1], 10);
    }

    const explanationMatch = text.match(/["']?explanation["']?\s*:\s*["']([\s\S]*?)["']?/i);
    if (explanationMatch && explanationMatch[1]) {
        result.explanation = explanationMatch[1].trim();
    }
    
    return result;
}

/**
 * @returns {object|null} 解析后的JSON对象，如果无法解析则返回null
 */
function flexibleJsonParse(str) {
    try {
        // 尝试直接解析
        return JSON.parse(str);
    } catch (e1) {
        try {
            // 尝试移除代码块标记
            const cleaned = str.replace(/```json\s*|\s*```/g, '');
            return JSON.parse(cleaned);
        } catch (e2) {
            try {
                // 尝试使用eval，但要注意安全风险（这里假设输入是可信的）
                // 在更复杂的场景中，可能需要一个更安全的解析器
                let evalResult;
                // eslint-disable-next-line no-eval
                eval(`evalResult = ${str}`);
                return evalResult;
            } catch (e3) {
                // 尝试提取大括号内的内容
                const match = str.match(/{[\s\S]*}/);
                if (match) {
                    try {
                        return JSON.parse(match[0]);
                    } catch (e4) {
                        // 所有尝试都失败
                    }
                }
            }
        }
    }
    throw new Error("所有灵活的JSON解析方法都失败了");
}

// 主要导出函数 - 自动选择可用的API
export async function analyzeImage(imageDataUrl, aiType) {
    // 优先级：websim > 直接调用Gemini > 代理（如果可用）
    try {
        return await analyzeImageWithGemini(imageDataUrl, aiType);
    } catch (error) {
        throw new Error(`API请求失败: ${error.message}`);
    }
}