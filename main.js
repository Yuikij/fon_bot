import * as store from './store.js';
import * as ui from './ui.js';
import { analyzeImage } from './api.js';
import { getRatingLabel } from './config.js';
import { initEnv } from './env-manager.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 初始化环境变量
    try {
        await initEnv();
    } catch (error) {
    }
    // --- DOM Elements ---
    const elements = {
        uploadArea: document.getElementById('upload-area'),
        fileInput: document.getElementById('file-input'),
        previewContainer: document.getElementById('preview-container'),
        startAnalysisBtn: document.getElementById('start-analysis-btn'),
        changeImageBtn: document.getElementById('change-image-btn'),
        disclaimer: document.getElementById('disclaimer'),
        closeDisclaimerBtn: document.getElementById('close-disclaimer'),
        tryAgainBtn: document.getElementById('try-again'),
        viewSavedBtn: document.getElementById('view-saved'),
        container: document.querySelector('.container'),
        resultContainer: document.getElementById('result-container'),
        imagePreviewContainerResult: document.getElementById('image-preview-container-result'),
        imagePreviewContainer: document.querySelector('.image-preview-container')
    };

    let currentAnalysisResult = null;
    let isSavedResultsVisible = false;
    let selectedImageDataUrl = null;

    // --- Initialization ---
    function initialize() {
        setupEventListeners();
    }

    // --- Event Handlers ---
    function handleFileSelect() {
        if (!elements.fileInput.files.length) return;

        const file = elements.fileInput.files[0];
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            selectedImageDataUrl = e.target.result;
            ui.showPreview(selectedImageDataUrl);
        };
        reader.readAsDataURL(file);
    }

    async function handleStartAnalysis() {
        if (!selectedImageDataUrl) return;

        ui.showLoading(selectedImageDataUrl);

        try {
            const aiType = document.querySelector('input[name="ai-type"]:checked').value;
            
            const response = await analyzeImage(selectedImageDataUrl, aiType);
            
            currentAnalysisResult = { ...response, image: selectedImageDataUrl, aiType };
            
            // A short delay to make the loading feel more deliberate
            setTimeout(() => {
                ui.displayResult(currentAnalysisResult);
                ui.createSaveButton(handleSaveResult);
                ui.createShareButton(handleShareResult);
            }, 500);

        } catch (error) {
            ui.displayError('出错了，请重新上传图片或刷新页面。检查控制台获取详细信息。');
        }
    }
    
    function handleSaveResult() {
        if (currentAnalysisResult) {
            store.addSavedResult({ ...currentAnalysisResult, timestamp: new Date().toISOString() });
            if (isSavedResultsVisible) {
                renderSaved();
            }
        }
    }

    async function handleShareResult() {
        if (!currentAnalysisResult) return;
        
        try {
            const canvas = await createResultImage(currentAnalysisResult);
            
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
            
        } catch (error) {
            alert('保存图片失败，请重试');
        }
    }

    // 创建包含分析结果的图片
    async function createResultImage(result) {
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
    
    function handleDeleteResult(index) {
        store.deleteSavedResult(index);
        renderSaved();
    }

    function handleViewSavedResult(index) {
        const result = store.getSavedResults()[index];
        if (result) {
            ui.showPopup(result);
        }
    }
    
    async function handleTryAgain() {
        if (selectedImageDataUrl) {
            await handleStartAnalysis();
        } else {
            ui.resetToUpload();
            currentAnalysisResult = null;
        }
    }

    function handleChangeImage() {
        elements.fileInput.click();
    }
    
    function toggleSavedResults() {
        const existingContainer = document.querySelector('.saved-results');
        if (existingContainer) {
            existingContainer.remove();
            elements.viewSavedBtn.textContent = '📁 查看保存的结果';
            isSavedResultsVisible = false;
        } else {
            renderSaved();
            elements.viewSavedBtn.textContent = '📁 隐藏保存的结果';
            isSavedResultsVisible = true;
        }
    }
    
    function renderSaved() {
        const results = store.getSavedResults();
        const savedContainer = ui.createSavedResultsContainer(results, {
            onDelete: handleDeleteResult,
            onView: handleViewSavedResult,
        });
        
        const existingContainer = document.querySelector('.saved-results');
        if (existingContainer) existingContainer.remove();
        
        elements.container.appendChild(savedContainer);
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        const imageDropZones = [elements.uploadArea, elements.imagePreviewContainer, elements.imagePreviewContainerResult];
        
        imageDropZones.forEach(zone => {
            if (zone) { // Add a check to ensure the element exists
                zone.addEventListener('click', () => elements.fileInput.click());
                zone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    zone.classList.add('drag-over');
                });
                zone.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    zone.classList.remove('drag-over');
                });
                zone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    zone.classList.remove('drag-over');
                    if (e.dataTransfer.files.length) {
                        elements.fileInput.files = e.dataTransfer.files;
                        handleFileSelect();
                    }
                });
            }
        });

        elements.fileInput.addEventListener('change', handleFileSelect);
        
        elements.startAnalysisBtn.addEventListener('click', handleStartAnalysis);
        elements.changeImageBtn.addEventListener('click', handleChangeImage);
        elements.closeDisclaimerBtn.addEventListener('click', () => ui.hideDisclaimer());
        elements.tryAgainBtn.addEventListener('click', handleTryAgain);
        elements.viewSavedBtn.addEventListener('click', toggleSavedResults);
    }

    // --- Start Application ---
    initialize();
});