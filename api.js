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
        const errorText = await response.text();
        console.error('Gemini API错误响应:', errorText);
        throw new Error(`Gemini API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Gemini API完整响应数据:', JSON.stringify(data, null, 2));
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('API响应结构异常:', data);
        throw new Error('Gemini API返回格式异常');
    }
    
    const content = data.candidates[0].content.parts[0].text;
    console.log('Gemini API返回的原始内容:', content);
    
    try {
        // 尝试解析JSON响应
        const parsed = JSON.parse(content);
        console.log('JSON解析成功:', parsed);
        return parsed;
    } catch (parseError) {
        console.warn('JSON解析失败:', parseError.message);
        console.log('尝试使用parseTextResponse解析...');
        // 尝试使用parseTextResponse解析
        const textParsed = parseTextResponse(content);
        console.log('文本解析结果:', textParsed);
        return textParsed;
    }
}

// 文本响应解析函数
function parseTextResponse(text) {
    console.log('parseTextResponse输入文本:', text);
    
    // 首先尝试从```json...```代码块中提取JSON
    const jsonBlockMatch = text.match(/```json\s*\n?\s*({[\s\S]*?})\s*\n?\s*```/);
    if (jsonBlockMatch) {
        try {
            const jsonText = jsonBlockMatch[1].trim();
            console.log('提取的JSON文本:', jsonText);
            const parsed = JSON.parse(jsonText);
            console.log('JSON代码块解析成功:', parsed);
            return parsed;
        } catch (e) {
            console.warn('JSON代码块解析失败:', e);
        }
    }
    
    // 尝试更宽松的JSON代码块匹配
    const looserJsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (looserJsonBlockMatch) {
        try {
            const jsonContent = looserJsonBlockMatch[1].trim();
            console.log('宽松匹配的JSON内容:', jsonContent);
            // 尝试找到第一个{和最后一个}之间的内容
            const startBrace = jsonContent.indexOf('{');
            const endBrace = jsonContent.lastIndexOf('}');
            if (startBrace !== -1 && endBrace !== -1 && endBrace > startBrace) {
                const jsonText = jsonContent.substring(startBrace, endBrace + 1);
                console.log('提取的JSON片段:', jsonText);
                const parsed = JSON.parse(jsonText);
                console.log('宽松JSON代码块解析成功:', parsed);
                return parsed;
            }
        } catch (e) {
            console.warn('宽松JSON代码块解析失败:', e);
        }
    }
    
    // 尝试直接从文本中找到JSON对象
    const jsonMatch = text.match(/({[\s\S]*?"verdict"[\s\S]*?"rating"[\s\S]*?"explanation"[\s\S]*?})/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[1]);
            console.log('内联JSON解析成功:', parsed);
            return parsed;
        } catch (e) {
            console.warn('内联JSON解析失败:', e);
        }
    }
    
    // 更宽松的JSON匹配，处理引号问题
    const flexibleJsonMatch = text.match(/\{\s*"verdict"\s*:\s*"(PASS|SMASH|MODERATE|上|不上)"\s*,\s*"rating"\s*:\s*(\d+)\s*,\s*"explanation"\s*:\s*"([^"]*?)"\s*\}/);
    if (flexibleJsonMatch) {
        const verdict = flexibleJsonMatch[1].toUpperCase();
        const rating = parseInt(flexibleJsonMatch[2]);
        const explanation = flexibleJsonMatch[3];
        
        let finalVerdict = 'PASS';
        if (verdict === 'SMASH' || verdict === '上') {
            finalVerdict = 'SMASH';
        } else if (verdict === 'MODERATE') {
            finalVerdict = rating >= 7 ? 'SMASH' : 'PASS';
        }
        
        const result = {
            verdict: finalVerdict,
            rating: Math.min(Math.max(rating, 1), 10),
            explanation: explanation || '分析完成'
        };
        console.log('灵活JSON解析成功:', result);
        return result;
    }
    
    // 如果JSON解析都失败，回退到文本解析
    console.log('回退到文本解析');
    const verdictMatch = text.match(/(SMASH|PASS|MODERATE|上|不上)/i);
    const ratingMatch = text.match(/(\d+)\/10|"rating"\s*:\s*(\d+)|rating[:\s]*(\d+)|评分[:\s]*(\d+)/i);
    
    let verdict = 'PASS';
    if (verdictMatch) {
        const match = verdictMatch[1].toUpperCase();
        if (match === 'SMASH' || match === '上') {
            verdict = 'SMASH';
        } else if (match === 'MODERATE') {
            // MODERATE根据评分决定
            const rating = ratingMatch ? parseInt(ratingMatch[1] || ratingMatch[2] || ratingMatch[3] || ratingMatch[4]) || 5 : 5;
            verdict = rating >= 7 ? 'SMASH' : 'PASS';
        }
    }
    
    let rating = 5;
    if (ratingMatch) {
        rating = parseInt(ratingMatch[1] || ratingMatch[2] || ratingMatch[3] || ratingMatch[4]) || 5;
    }
    
    // 提取解释文本（移除JSON标记）
    let explanation = text
        .replace(/```json[\s\S]*?```/g, '')
        .replace(/\{[\s\S]*?\}/g, '')
        .replace(/(verdict|rating|explanation)[:\s]*[^\n]*/gi, '')
        .trim();
    
    if (!explanation) {
        explanation = '分析完成';
    }
    
    const result = {
        verdict,
        rating: Math.min(Math.max(rating, 1), 10),
        explanation
    };
    
    console.log('文本解析结果:', result);
    return result;
}


// 主要导出函数 - 自动选择可用的API
export async function analyzeImage(imageDataUrl, aiType) {
    // 优先级：websim > 直接调用Gemini > 代理（如果可用）
    try {
        return await analyzeImageWithGemini(imageDataUrl, aiType);
        
    } catch (error) {
        console.error('所有API调用方法都失败:', error);
        throw error;
    }
}