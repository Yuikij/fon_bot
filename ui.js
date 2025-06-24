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
    };
    
    elements.previewImage.onerror = () => {
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
    };
    
    elements.imagePreview.onerror = () => {
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
    if (!popupOverlay) {
        return;
    }
    
    const popupImg = document.getElementById('popup-img');
    
    // 确保弹窗图片正确加载并保持比例
    popupImg.onload = () => {
        // 移除任何内联样式，让CSS控制显示
        popupImg.removeAttribute('style');
    };
    
    popupImg.onerror = () => {
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
        
        newSaveBtn.onclick = async () => {
            newSaveBtn.textContent = '⏳ 生成中...';
            newSaveBtn.disabled = true;
            try {
                await createResultImageFromPopup(result);
                newSaveBtn.textContent = '✓ 已保存!';
            } catch (error) {
                newSaveBtn.textContent = '❌ 保存失败';
            }
            setTimeout(() => {
                newSaveBtn.textContent = '📷 保存图片';
                newSaveBtn.disabled = false;
            }, 2000);
        };
    }
    
    popupOverlay.classList.remove('hidden');
}

export function hidePopup() {
    if (popupOverlay) popupOverlay.classList.remove('visible');
}

// 创建包含分析结果的图片（弹窗版本）
async function createResultImageFromPopup(result) {
    try {
        const canvas = await generateImage(result);
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas to Blob conversion failed'));
                    return;
                }
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `AI评分结果_${new Date().getTime()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                resolve();
            }, 'image/png');
        });
    } catch (error) {
        throw error;
    }
}