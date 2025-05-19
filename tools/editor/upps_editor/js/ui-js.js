// ui.js (続き)

// 複合条件のタイプ変更時の更新
function updateComplexConditionType(associationIndex, conditionIndex) {
    const association = this.persona.association_system.associations[associationIndex];
    const condition = association.trigger.conditions[conditionIndex];
    
    // タイプに応じて必要なプロパティを設定
    if (condition.type === 'emotion') {
        condition.id = Object.keys(this.persona.emotion_system.emotions)[0] || '';
        condition.threshold = 50;
    } else if (condition.type === 'memory') {
        condition.id = this.persona.memory_system.memories[0]?.id || '';
        delete condition.threshold;
    } else if (condition.type === 'external') {
        condition.category = 'topics';
        condition.items = [];
    }
    
    console.log('Complex condition type updated:', condition.type);
}

// 外部トリガーのアイテム更新（カンマ区切りテキストから配列へ）
function updateExternalItems(index) {
    const association = this.persona.association_system.associations[index];
    
    if (association.trigger.type !== 'external') {
        return;
    }
    
    // カンマ区切りテキストを配列に変換
    const items = this.externalItems[index].split(',').map(item => item.trim()).filter(item => item);
    association.trigger.items = items;
    
    console.log('External trigger items updated:', items);
}

// 複合条件内の外部トリガーアイテム取得
function getExternalConditionItems(associationIndex, conditionIndex) {
    const association = this.persona.association_system.associations[associationIndex];
    const condition = association.trigger.conditions[conditionIndex];
    
    if (condition.type !== 'external' || !condition.items) {
        return '';
    }
    
    return condition.items.join(', ');
}

// 複合条件内の外部トリガーアイテム更新
function updateExternalConditionItems(associationIndex, conditionIndex, event) {
    const association = this.persona.association_system.associations[associationIndex];
    const condition = association.trigger.conditions[conditionIndex];
    
    if (condition.type !== 'external') {
        return;
    }
    
    // カンマ区切りテキストを配列に変換
    const items = event.target.value.split(',').map(item => item.trim()).filter(item => item);
    condition.items = items;
    
    console.log('External condition items updated:', items);
}

// 関連性オプションの更新
function updateAssociationOptions(index) {
    const association = this.persona.association_system.associations[index];
    
    // トリガータイプが変わった場合、デフォルト値を設定
    if (association.trigger.type === 'memory') {
        association.trigger.id = this.persona.memory_system.memories[0]?.id || '';
        delete association.trigger.threshold;
        delete association.trigger.category;
        delete association.trigger.items;
    } else if (association.trigger.type === 'emotion') {
        association.trigger.id = Object.keys(this.persona.emotion_system.emotions)[0] || '';
        association.trigger.threshold = 50;
        delete association.trigger.category;
        delete association.trigger.items;
    } else if (association.trigger.type === 'external') {
        association.trigger.category = 'topics';
        association.trigger.items = [];
        delete association.trigger.id;
        delete association.trigger.threshold;
        this.externalItems[index] = '';
    } else if (association.trigger.type === 'complex') {
        association.trigger.operator = 'AND';
        association.trigger.conditions = [{
            type: 'memory',
            id: this.persona.memory_system.memories[0]?.id || ''
        }];
        delete association.trigger.id;
        delete association.trigger.threshold;
        delete association.trigger.category;
        delete association.trigger.items;
    }
    
    console.log('Association options updated for trigger type:', association.trigger.type);
}

// フォームフィールドのフォーカス処理
function handleFieldFocus(event) {
    const field = event.currentTarget;
    field.classList.add('focused');
}

// フォームフィールドのブラー処理
function handleFieldBlur(event) {
    const field = event.currentTarget;
    field.classList.remove('focused');
    
    // 必須フィールドの検証
    if (field.hasAttribute('required') && !field.value) {
        field.classList.add('error');
    } else {
        field.classList.remove('error');
    }
}

// フォームフィールドの初期化
function initializeFormFields() {
    const formFields = document.querySelectorAll('input, textarea, select');
    
    formFields.forEach(field => {
        field.addEventListener('focus', this.handleFieldFocus);
        field.addEventListener('blur', this.handleFieldBlur);
        
        // 必須フィールドのスタイル設定
        if (field.hasAttribute('required')) {
            const label = field.previousElementSibling;
            if (label && label.tagName === 'LABEL') {
                label.innerHTML += ' <span class="text-red-400">*</span>';
            }
        }
    });
}

// ツールチップの表示
function showTooltip(element, message) {
    // 既存のツールチップを削除
    const existingTooltip = document.querySelector('.tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    // ツールチップを作成
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip fixed bg-slate-800 text-white text-sm px-3 py-2 rounded z-50';
    tooltip.textContent = message;
    
    // ツールチップをドキュメントに追加
    document.body.appendChild(tooltip);
    
    // 要素の位置に合わせてツールチップを配置
    const rect = element.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + 5}px`;
    tooltip.style.left = `${rect.left + (rect.width / 2)}px`;
    tooltip.style.transform = 'translateX(-50%)';
    
    // アニメーション
    tooltip.style.opacity = '0';
    tooltip.style.transform = 'translateX(-50%) translateY(-5px)';
    tooltip.style.transition = 'opacity 0.2s, transform 0.2s';
    
    setTimeout(() => {
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // 数秒後に自動的に消す
    setTimeout(() => {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateX(-50%) translateY(-5px)';
        
        setTimeout(() => {
            tooltip.remove();
        }, 200);
    }, 3000);
}

// 感情カードのホバー効果
function initializeEmotionCards() {
    const emotionCards = document.querySelectorAll('.emotion-card');
    
    emotionCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('hover');
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('hover');
        });
    });
}

// 記憶カードのホバー効果
function initializeMemoryCards() {
    const memoryCards = document.querySelectorAll('.memory-card');
    
    memoryCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('hover');
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('hover');
        });
    });
}

// 関連性カードのホバー効果
function initializeAssociationCards() {
    const associationCards = document.querySelectorAll('.association-card');
    
    associationCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('hover');
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('hover');
        });
    });
}

// タブの初期化
function initializeTabs() {
    // タブが読み込まれたときの処理
    document.addEventListener('tabLoaded', (event) => {
        const tabId = event.detail.tabId;
        
        // タブに応じた初期化
        switch (tabId) {
            case 'emotion':
                this.initializeEmotionCards();
                break;
            case 'memory':
                this.initializeMemoryCards();
                break;
            case 'association':
                this.initializeAssociationCards();
                break;
            case 'cognitive':
                // 認知能力レーダーチャートを初期化
                if (typeof this.initializeCognitiveRadarChart === 'function') {
                    setTimeout(() => {
                        this.initializeCognitiveRadarChart();
                    }, 200);
                }
                break;
        }
        
        // 共通初期化
        this.initializeFormFields();
        this.initializeContextHelp();
    });
}

// ダイアログの作成・表示
function showDialog(title, content, buttons = []) {
    // ダイアログの作成
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 bg-black/70 z-50 flex items-center justify-center';
    dialog.style.opacity = '0';
    dialog.style.transition = 'opacity 0.3s';
    
    // ダイアログの内容
    let buttonsHTML = '';
    if (buttons.length > 0) {
        buttonsHTML = `
            <div class="flex justify-end space-x-3">
                ${buttons.map(button => `
                    <button id="${button.id}" class="${button.class}">
                        ${button.text}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    dialog.innerHTML = `
        <div class="bg-slate-800 rounded-xl max-w-md w-full mx-4 p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-white">${title}</h2>
                <button id="close-dialog" class="text-white/60 hover:text-white">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            <div class="text-white/80 mb-6">
                ${content}
            </div>
            ${buttonsHTML}
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // アニメーション
    setTimeout(() => {
        dialog.style.opacity = '1';
    }, 10);
    
    // Lucideアイコンの初期化
    if (window.lucide) window.lucide.createIcons();
    
    // 閉じるボタンのイベントリスナー
    document.getElementById('close-dialog').addEventListener('click', () => {
        closeDialog();
    });
    
    // ボタンのイベントリスナー
    buttons.forEach(button => {
        const buttonElement = document.getElementById(button.id);
        if (buttonElement && button.callback) {
            buttonElement.addEventListener('click', () => {
                button.callback();
                closeDialog();
            });
        }
    });
    
    // ダイアログを閉じる関数
    function closeDialog() {
        dialog.style.opacity = '0';
        setTimeout(() => {
            dialog.remove();
        }, 300);
    }
    
    // 閉じる関数を返す
    return closeDialog;
}

// フォーム入力値のバリデーション
function validateInput(field, type) {
    const value = field.value;
    
    switch (type) {
        case 'required':
            return value.trim() !== '';
            
        case 'number':
            return !isNaN(value) && isFinite(value);
            
        case 'range':
            const min = parseFloat(field.getAttribute('min') || '0');
            const max = parseFloat(field.getAttribute('max') || '100');
            const numValue = parseFloat(value);
            return !isNaN(numValue) && numValue >= min && numValue <= max;
            
        case 'email':
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            
        case 'id':
            return /^[a-zA-Z0-9_]+$/.test(value);
            
        default:
            return true;
    }
}

// バリデーションエラーの表示
function showValidationError(field, message) {
    // 既存のエラーメッセージを削除
    const existingError = field.nextElementSibling;
    if (existingError && existingError.classList.contains('validation-error')) {
        existingError.remove();
    }
    
    // エラーメッセージを作成
    const error = document.createElement('div');
    error.className = 'validation-error';
    error.textContent = message;
    
    // フィールドの後に挿入
    field.parentNode.insertBefore(error, field.nextSibling);
    
    // フィールドにエラースタイルを追加
    field.classList.add('error');
}

// バリデーションエラーのクリア
function clearValidationError(field) {
    // エラーメッセージを削除
    const existingError = field.nextElementSibling;
    if (existingError && existingError.classList.contains('validation-error')) {
        existingError.remove();
    }
    
    // フィールドのエラースタイルを削除
    field.classList.remove('error');
}
