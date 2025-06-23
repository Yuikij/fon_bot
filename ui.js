import { getRatingLabel } from './config.js';
import * as store from './store.js';

// --- DOM Element Cache ---
const elements = {
    uploadArea: document.getElementById('upload-area'),
    previewContainer: document.getElementById('preview-container'),
    previewImage: document.getElementById('preview-image'),
    resultContainer: document.getElementById('result-container'),
    imagePreview: document.getElementById('image-preview'),
    loading: document.getElementById('loading'),
    result: document.getElementById('result'),
    verdict: document.getElementById('verdict'),
    verdictIcon: document.getElementById('verdict-icon'),
    explanation: document.getElementById('explanation'),
    resultActions: document.querySelector('.result-actions'),
    tryAgainBtn: document.getElementById('try-again'),
    themeToggle: document.getElementById('theme-toggle'),
    disclaimer: document.getElementById('disclaimer'),
    imagePreviewContainerResult: document.getElementById('image-preview-container-result')
};

let popupOverlay = null;

// --- Initialization ---
function createPopup() {
    // 使用HTML中已存在的弹窗元素
    popupOverlay = document.getElementById('popup-overlay');
    if (!popupOverlay) return;
    
    // 更新弹窗内容结构以匹配JavaScript期待的格式
    popupOverlay.innerHTML = `
        <div class="popup-card">
            <button class="close-popup">×</button>
            <img id="popup-img" src="" alt="预览图片">
            <h3 id="popup-verdict"></h3>
            <p id="popup-explanation"></p>
            <div class="popup-actions">
                <button id="popup-save-btn" class="btn">📷 保存图片</button>
            </div>
        </div>
    `;

    popupOverlay.addEventListener('click', (e) => {
        if (e.target === popupOverlay) {
            hidePopup();
        }
    });
    popupOverlay.querySelector('.close-popup').addEventListener('click', hidePopup);
}
createPopup(); // Create on script load

// --- UI State Changers ---
export function showPreview(imageDataUrl) {
    // 确保图片正确加载并保持比例
    elements.previewImage.onload = () => {
        // 移除任何内联样式，让CSS控制显示
        elements.previewImage.removeAttribute('style');
        console.log('预览图片加载完成');
    };
    
    elements.previewImage.onerror = () => {
        console.error('预览图片加载失败');
    };
    
    elements.previewImage.src = imageDataUrl;
    elements.uploadArea.classList.add('hidden');
    elements.previewContainer.classList.remove('hidden');
    elements.resultContainer.classList.add('hidden');
}

export function showLoading(imageDataUrl) {
    // 确保结果页图片正确加载并保持比例
    elements.imagePreview.onload = () => {
        // 移除任何内联样式，让CSS控制显示
        elements.imagePreview.removeAttribute('style');
        console.log('结果页图片加载完成');
    };
    
    elements.imagePreview.onerror = () => {
        console.error('结果页图片加载失败');
    };
    
    elements.imagePreview.src = imageDataUrl;
    elements.uploadArea.classList.add('hidden');
    elements.previewContainer.classList.add('hidden');
    elements.resultContainer.classList.remove('hidden');
    elements.loading.classList.remove('hidden');
    elements.result.classList.add('hidden');

    // Clear previous action buttons
    const existingBtns = elements.resultActions.querySelectorAll('.save-btn, .share-btn');
    existingBtns.forEach(btn => btn.remove());
}

export function displayResult({ rating, verdict: verdictText, explanation: explanationText }) {
    console.log('displayResult被调用，参数:', { rating, verdictText, explanationText });
    
    elements.loading.classList.add('hidden');
    elements.result.classList.remove('hidden');
    
    const isSmash = verdictText === 'SMASH';
    const isPass = verdictText === 'PASS';

    elements.verdict.textContent = `${getRatingLabel(rating)} (${rating}/10)`;
    elements.verdictIcon.textContent = isSmash ? 'SMASH!!' : isPass ? 'PASS' : '...';
    elements.explanation.textContent = explanationText;

    let resultClass = 'result';
    if(isSmash) resultClass += ' smash';
    if(isPass) resultClass += ' pass';
    elements.result.className = resultClass;
    
    console.log('UI更新完成');
}

export function displayError(errorMessage) {
    elements.loading.classList.add('hidden');
    elements.result.classList.remove('hidden');
    elements.verdict.textContent = '错误!';
    elements.verdictIcon.textContent = 'ERROR';
    elements.explanation.textContent = errorMessage;
    elements.result.className = 'result';
}

export function resetToUpload() {
    elements.previewContainer.classList.add('hidden');
    elements.resultContainer.classList.add('hidden');
    elements.uploadArea.classList.remove('hidden');
    document.getElementById('file-input').value = '';
    const existingBtns = elements.resultActions.querySelectorAll('.save-btn, .share-btn');
    existingBtns.forEach(btn => btn.remove());
}

export function hideDisclaimer() {
    elements.disclaimer.style.display = 'none';
}

// --- Theme Management ---
export function toggleTheme() {
    // This function is no longer needed as there is only one theme.
}

export function initializeTheme() {
    // This function is no longer needed.
}

// --- Dynamic Element Creation ---
export function createSaveButton(onClick) {
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn save-btn';
    saveBtn.textContent = '💾 保存结果';
    saveBtn.addEventListener('click', () => {
        onClick();
        saveBtn.textContent = '✓ 已保存';
        saveBtn.disabled = true;
    });
    elements.resultActions.appendChild(saveBtn);
}

export function createShareButton(onClick) {
    const shareBtn = document.createElement('button');
    shareBtn.className = 'btn share-btn';
    shareBtn.textContent = '📷 保存图片';
    shareBtn.addEventListener('click', async () => {
        shareBtn.textContent = '⏳ 生成中...';
        shareBtn.disabled = true;
        
        try {
            await onClick();
            shareBtn.textContent = '✓ 已保存!';
        } catch (error) {
            shareBtn.textContent = '❌ 保存失败';
        }
        
        setTimeout(() => {
            shareBtn.textContent = '📷 保存图片';
            shareBtn.disabled = false;
        }, 2000);
    });
    elements.resultActions.appendChild(shareBtn);
}

export function createSavedResultsContainer(results, eventHandlers) {
    const container = document.createElement('div');
    container.className = 'saved-results';

    if (results.length === 0) {
        container.innerHTML = `
            <h2>保存的结果</h2>
            <p style="text-align: center; color: var(--subtitle-color);">暂无保存的结果</p>
        `;
    } else {
        const grid = results.map((result, index) => `
            <div class="saved-result-card" data-index="${index}">
                <img src="${result.image}" alt="Saved result ${index + 1}">
                <div class="saved-result-info">
                    <p class="date">${new Date(result.timestamp).toLocaleDateString()}</p>
                    <p class="ai-type">模式: ${
                        result.aiType === 'brief' ? '简短' :
                        result.aiType === 'descriptive' ? '详细' : '小说'
                    }</p>
                     <div class="saved-result-actions">
                        <button class="view-btn" data-index="${index}">👀 查看</button>
                        <button class="delete-btn" data-index="${index}">🗑️ 删除</button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `<h2>保存的结果</h2><div class="saved-results-grid">${grid}</div>`;
        
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click event
                eventHandlers.onDelete(parseInt(e.target.dataset.index));
            });
        });
        
        container.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click event
                console.log('查看按钮被点击，索引:', e.target.dataset.index);
                eventHandlers.onView(parseInt(e.target.dataset.index));
            });
        });
        
        container.querySelectorAll('.saved-result-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-btn') || e.target.classList.contains('view-btn')) return;
                eventHandlers.onView(parseInt(card.dataset.index));
            });
        });
    }
    return container;
}

// --- Popup Management ---
export function showPopup(result) {
    console.log('showPopup被调用，数据:', result);
    if (!popupOverlay) {
        console.error('弹窗元素不存在');
        return;
    }
    
    const popupImg = document.getElementById('popup-img');
    
    // 确保弹窗图片正确加载并保持比例
    popupImg.onload = () => {
        // 移除任何内联样式，让CSS控制显示
        popupImg.removeAttribute('style');
        console.log('弹窗图片加载完成');
    };
    
    popupImg.onerror = () => {
        console.error('弹窗图片加载失败');
    };
    
    popupImg.src = result.image;
    document.getElementById('popup-verdict').textContent = `${getRatingLabel(result.rating)} (${result.rating}/10)`;
    document.getElementById('popup-explanation').textContent = result.explanation;
    document.getElementById('popup-explanation').style.whiteSpace = 'pre-wrap';
    
    // 为保存按钮添加事件监听器
    const saveBtn = document.getElementById('popup-save-btn');
    if (saveBtn) {
        // 移除旧的事件监听器
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        
        newSaveBtn.addEventListener('click', async () => {
            newSaveBtn.textContent = '⏳ 生成中...';
            newSaveBtn.disabled = true;
            
            try {
                // 动态导入main.js中的createResultImage函数
                const canvas = await createResultImageFromPopup(result);
                
                // 创建下载链接
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `AI评分结果_${new Date().getTime()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }, 'image/png');
                
                newSaveBtn.textContent = '✓ 已保存!';
            } catch (error) {
                console.error('生成结果图片失败:', error);
                newSaveBtn.textContent = '❌ 保存失败';
            }
            
            setTimeout(() => {
                newSaveBtn.textContent = '📷 保存图片';
                newSaveBtn.disabled = false;
            }, 2000);
        });
    }
    
    console.log('准备显示弹窗');
    popupOverlay.classList.add('visible');
}

export function hidePopup() {
    if (popupOverlay) popupOverlay.classList.remove('visible');
}

// 创建包含分析结果的图片（弹窗版本）
async function createResultImageFromPopup(result) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置画布尺寸
    const canvasWidth = 800;
    canvas.width = canvasWidth;
    
    // 加载用户图片以计算实际需要的高度
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
        img.onload = () => {
            try {
                const { rating, verdict, explanation } = result;
                const ratingLabel = getRatingLabel(rating);
                
                // 计算文本行数和所需高度
                ctx.font = '18px Arial, sans-serif';
                const maxTextWidth = canvasWidth - 80;
                const lineHeight = 28;
                
                // 预计算文本行数
                const text = explanation;
                let line = '';
                let words = [];
                
                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    if (char === '，' || char === '。' || char === '！' || char === '？' || char === '；' || char === ' ' || char === '\n') {
                        if (line.length > 0) {
                            words.push(line + char);
                            line = '';
                        }
                    } else {
                        line += char;
                    }
                }
                if (line.length > 0) words.push(line);
                
                // 计算实际行数
                let lineCount = 0;
                line = '';
                for (let i = 0; i < words.length; i++) {
                    const testLine = line + words[i];
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > maxTextWidth && line !== '') {
                        lineCount++;
                        line = words[i];
                    } else {
                        line = testLine;
                    }
                }
                if (line) lineCount++;
                
                // 计算画布高度（减少留白）
                const headerHeight = 80; // 顶部边距
                const imageHeight = 350; // 图片区域高度
                const titleAreaHeight = 140; // 标题和评分区域
                const textAreaHeight = Math.max(lineCount * lineHeight + 40, 200); // 文本区域，最小200px
                const footerHeight = 80; // 底部区域
                const cardPadding = 40; // 卡片内边距
                
                const canvasHeight = headerHeight + imageHeight + titleAreaHeight + textAreaHeight + footerHeight + cardPadding * 2;
                canvas.height = canvasHeight;
                
                // 绘制背景渐变
                const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
                gradient.addColorStop(0, '#1a1a2e');
                gradient.addColorStop(1, '#16213e');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                
                // 绘制主卡片背景
                const cardX = 30;
                const cardY = 30;
                const cardWidth = canvasWidth - 60;
                const cardHeight = canvasHeight - 60;
                
                // 卡片阴影
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(cardX + 5, cardY + 5, cardWidth, cardHeight);
                
                // 卡片背景
                const cardGradient = ctx.createLinearGradient(0, cardY, 0, cardY + cardHeight);
                cardGradient.addColorStop(0, '#2c2c54');
                cardGradient.addColorStop(1, '#1a1a2e');
                ctx.fillStyle = cardGradient;
                ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
                
                // 卡片边框
                ctx.strokeStyle = '#4a4a7a';
                ctx.lineWidth = 2;
                ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
                
                // 计算图片位置
                const imgMaxWidth = cardWidth - 60;
                const imgMaxHeight = 320;
                let imgWidth = img.width;
                let imgHeight = img.height;
                
                const scaleX = imgMaxWidth / imgWidth;
                const scaleY = imgMaxHeight / imgHeight;
                const scale = Math.min(scaleX, scaleY);
                
                imgWidth *= scale;
                imgHeight *= scale;
                
                const imgX = cardX + (cardWidth - imgWidth) / 2;
                const imgY = cardY + 50;
                
                // 绘制图片容器背景
                ctx.fillStyle = '#1e1e1e';
                ctx.fillRect(imgX - 10, imgY - 10, imgWidth + 20, imgHeight + 20);
                
                // 绘制图片
                ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
                
                // 图片边框
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.strokeRect(imgX - 1, imgY - 1, imgWidth + 2, imgHeight + 2);
                
                // 标题和评分的统一面板
                const resultPanelX = cardX + 20;
                const resultPanelY = imgY + imgHeight + 30;
                const resultPanelWidth = cardWidth - 40;
                const resultPanelHeight = 150;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.fillRect(resultPanelX, resultPanelY, resultPanelWidth, resultPanelHeight);

                // 标题
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 28px Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('🤖 AI图片评分结果', canvasWidth / 2, resultPanelY + 45);

                // 评分背景色块（在统一面板内）
                const ratingBgY = resultPanelY + 75;
                const ratingBgHeight = 60;
                const ratingBgWidth = resultPanelWidth - 60; // 留出更多边距
                const ratingBgX = resultPanelX + (resultPanelWidth - ratingBgWidth) / 2;
                const ratingBgColor = verdict === 'SMASH' ? '#4CAF50' : verdict === 'PASS' ? '#f44336' : '#ff9800';
                ctx.fillStyle = ratingBgColor;
                ctx.fillRect(ratingBgX, ratingBgY, ratingBgWidth, ratingBgHeight);

                // 评分文字
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 22px Arial, sans-serif';
                ctx.fillText(`${ratingLabel} (${rating}/10)`, canvasWidth / 2, ratingBgY + 28);

                // 判决
                ctx.font = 'bold 18px Arial, sans-serif';
                ctx.fillText(verdict === 'SMASH' ? '🔥 SMASH!!' : verdict === 'PASS' ? '❌ PASS' : '🤔 ...', canvasWidth / 2, ratingBgY + 50);

                // 描述文字区域背景
                const textStartY = resultPanelY + resultPanelHeight + 15;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.fillRect(cardX + 20, textStartY, cardWidth - 40, textAreaHeight);
                
                // 描述文字
                ctx.fillStyle = '#e0e0e0';
                ctx.font = '18px Arial, sans-serif';
                ctx.textAlign = 'left';
                
                let currentY = textStartY + 30;
                
                // 逐词添加，自动换行
                line = '';
                for (let i = 0; i < words.length; i++) {
                    const testLine = line + words[i];
                    const metrics = ctx.measureText(testLine);
                    const testWidth = metrics.width;
                    
                    if (testWidth > maxTextWidth && line !== '') {
                        ctx.fillText(line, cardX + 40, currentY);
                        line = words[i];
                        currentY += lineHeight;
                    } else {
                        line = testLine;
                    }
                }
                
                // 绘制最后一行
                if (line) {
                    ctx.fillText(line, cardX + 40, currentY);
                }
                
                // 底部装饰线
                const footerY = canvasHeight - 60;
                ctx.strokeStyle = '#4a4a7a';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(cardX + 50, footerY);
                ctx.lineTo(cardX + cardWidth - 50, footerY);
                ctx.stroke();
                
                // 底部水印
                ctx.fillStyle = '#888888';
                ctx.font = '16px Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('✨ 智能图像评分系统 ✨', canvasWidth / 2, footerY + 25);
                
                resolve(canvas);
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = result.image;
    });
}