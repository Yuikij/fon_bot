export async function analyzeImage(imageDataUrl, aiType) {
    const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            imageDataUrl,
            aiType,
        }),
    });

    if (!response.ok) {
        let errorText = "API 请求失败";
        try {
            // 尝试将响应解析为JSON
            const errorJson = await response.json();
            errorText = errorJson.error || JSON.stringify(errorJson);
        } catch (e) {
            // 如果响应不是有效的JSON，则回退到纯文本
            try {
                errorText = await response.text();
            } catch (textError) {
                // 如果连读取文本都失败了
                errorText = "无法读取响应文本";
            }
        }
        throw new Error(`API 请求失败 (状态 ${response.status}): ${errorText}`);
    }

    return response.json();
} 