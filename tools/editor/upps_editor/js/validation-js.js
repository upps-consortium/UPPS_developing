// validation.js (続き)

// エラーを表示する関数 (続き)
function displayValidationErrors(errors) {
    // エラーが無ければ何もしない
    if (Object.keys(errors).length === 0) {
        clearValidationErrors();
        return false;
    }
    
    // エラー表示をクリア
    clearValidationErrors();
    
    // エラーメッセージの種類をカウント
    let errorCount = {
        basic: 0,
        emotion: 0,
        personality: 0,
        memory: 0,
        association: 0,
        cognitive: 0,
        unknown: 0
    };
    
    // エラーメッセージを表示と分類
    for (const [key, message] of Object.entries(errors)) {
        // エラーカウント
        if (key.startsWith('name') || key.startsWith('age') || key.startsWith('gender') || key.startsWith('occupation') || key.startsWith('background')) {
            errorCount.basic++;
        } else if (key.startsWith('emotion') || key.includes('emotion')) {
            errorCount.emotion++;
        } else if (key.startsWith('trait') || key.startsWith('personality')) {
            errorCount.personality++;
        } else if (key.startsWith('memory') || key.includes('memory')) {
            errorCount.memory++;
        } else if (key.startsWith('assoc') || key.includes('trigger') || key.includes('response')) {
            errorCount.association++;
        } else if (key.startsWith('ability') || key.startsWith('cognitive')) {
            errorCount.cognitive++;
        } else {
            errorCount.unknown++;
        }
        
        const element = document.querySelector(`[data-validation="${key}"]`);
        
        if (element) {
            // 既存のエラー表示が無ければ追加
            if (!element.nextElementSibling || !element.nextElementSibling.classList.contains('validation-error')) {
                const errorElement = document.createElement('div');
                errorElement.className = 'validation-error';
                errorElement.textContent = message;
                errorElement.setAttribute('data-error-for', key);
                
                element.parentNode.insertBefore(errorElement, element.nextSibling);
            }
            
            // エラー表示のクラスを追加
            element.classList.add('error');
            
            // スクロールして表示（最初のエラーのみ）
            if (Object.keys(errors)[0] === key) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        } else {
            // 対応する要素が見つからない場合は、グローバルエラーメッセージを表示
            const errorContainer = document.getElementById('global-errors');
            if (errorContainer) {
                const errorElement = document.createElement('div');
                errorElement.className = 'validation-error';
                errorElement.textContent = message;
                errorElement.setAttribute('data-error-for', key);
                
                errorContainer.appendChild(errorElement);
            }
        }
    }
    
    // エラーサマリーの表示
    displayErrorSummary(errorCount, errors);
    
    return true;
}

// エラーサマリーの表示
function displayErrorSummary(errorCount, errors) {
    // 既存のエラーサマリーを削除
    const existingSummary = document.getElementById('error-summary');
    if (existingSummary) {
        existingSummary.remove();
    }
    
    // エラーの総数
    const totalErrors = Object.values(errorCount).reduce((sum, count) => sum + count, 0);
    
    // エラーサマリーの作成
    const summary = document.createElement('div');
    summary.id = 'error-summary';
    summary.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50';
    
    // サマリー内容
    let summaryContent = `
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
                <i data-lucide="alert-triangle" class="w-5 h-5"></i>
                <span class="font-medium">検証エラー: ${totalErrors}件</span>
            </div>
            <button id="close-error-summary" class="text-white/80 hover:text-white">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>
    `;
    
    // タブごとのエラー数
    if (totalErrors > 0) {
        summaryContent += `<div class="mt-2 text-sm space-y-1">`;
        
        // 各タブのエラー数を表示
        if (errorCount.basic > 0) {
            summaryContent += `<div class="flex justify-between"><span>基本情報：</span><span>${errorCount.basic}件</span></div>`;
        }
        if (errorCount.emotion > 0) {
            summaryContent += `<div class="flex justify-between"><span>感情システム：</span><span>${errorCount.emotion}件</span></div>`;
        }
        if (errorCount.personality > 0) {
            summaryContent += `<div class="flex justify-between"><span>性格特性：</span><span>${errorCount.personality}件</span></div>`;
        }
        if (errorCount.memory > 0) {
            summaryContent += `<div class="flex justify-between"><span>記憶システム：</span><span>${errorCount.memory}件</span></div>`;
        }
        if (errorCount.association > 0) {
            summaryContent += `<div class="flex justify-between"><span>関連性：</span><span>${errorCount.association}件</span></div>`;
        }
        if (errorCount.cognitive > 0) {
            summaryContent += `<div class="flex justify-between"><span>認知能力：</span><span>${errorCount.cognitive}件</span></div>`;
        }
        if (errorCount.unknown > 0) {
            summaryContent += `<div class="flex justify-between"><span>その他：</span><span>${errorCount.unknown}件</span></div>`;
        }
        
        summaryContent += `</div>`;
    }
    
    // 修正ボタン
    summaryContent += `
        <div class="mt-3 flex justify-end">
            <button id="fix-errors-button" class="bg-white text-red-500 px-3 py-1 rounded text-sm font-medium hover:bg-white/90">
                エラーを修正
            </button>
        </div>
    `;
    
    summary.innerHTML = summaryContent;
    document.body.appendChild(summary);
    
    // Lucideアイコンの初期化
    if (window.lucide) window.lucide.createIcons();
    
    // イベントリスナー
    document.getElementById('close-error-summary').addEventListener('click', () => {
        summary.remove();
    });
    
    document.getElementById('fix-errors-button').addEventListener('click', () => {
        // 最初のエラーがあるタブに切り替え
        switchToFirstErrorTab(errorCount);
        
        // サマリーを閉じる
        summary.remove();
    });
    
    // アニメーション
    summary.style.opacity = '0';
    summary.style.transform = 'translateY(20px)';
    summary.style.transition = 'opacity 0.3s, transform 0.3s';
    
    setTimeout(() => {
        summary.style.opacity = '1';
        summary.style.transform = 'translateY(0)';
    }, 10);
}

// 最初のエラーのあるタブに切り替える
function switchToFirstErrorTab(errorCount) {
    // タブの優先順位
    const tabPriority = ['basic', 'emotion', 'personality', 'memory', 'association', 'cognitive'];
    
    // エラーのあるタブを見つける
    for (const tab of tabPriority) {
        if (errorCount[tab] > 0) {
            // タブの切り替え
            window.uppersEditor.activeTab = tab;
            break;
        }
    }
}

// エラー表示をクリアする関数
function clearValidationErrors() {
    // エラークラスを削除
    const errorElements = document.querySelectorAll('.error');
    errorElements.forEach(element => {
        element.classList.remove('error');
    });
    
    // エラーメッセージを削除
    const errorMessages = document.querySelectorAll('.validation-error');
    errorMessages.forEach(element => {
        element.remove();
    });
    
    // グローバルエラーコンテナをクリア
    const errorContainer = document.getElementById('global-errors');
    if (errorContainer) {
        errorContainer.innerHTML = '';
    }
    
    // エラーサマリーを削除
    const existingSummary = document.getElementById('error-summary');
    if (existingSummary) {
        existingSummary.remove();
    }
}

// 関連性の整合性検証
function validateAssociations(persona) {
    const errors = [];
    
    // メモリIDのセット
    const memoryIds = new Set();
    if (persona.memory_system) {
        for (const memory of persona.memory_system.memories || []) {
            memoryIds.add(memory.id);
        }
    }
    
    // 感情IDのセット
    const emotionIds = new Set();
    if (persona.emotion_system && persona.emotion_system.emotions) {
        Object.keys(persona.emotion_system.emotions).forEach(id => emotionIds.add(id));
    }
    if (persona.emotion_system && persona.emotion_system.additional_emotions) {
        Object.keys(persona.emotion_system.additional_emotions).forEach(id => emotionIds.add(id));
    }
    
    // 関連性の検証
    if (persona.association_system) {
        for (const assoc of persona.association_system.associations || []) {
            // トリガー検証
            const trigger = assoc.trigger || {};
            
            if (trigger.type === 'memory') {
                if (!memoryIds.has(trigger.id)) {
                    errors.push(`トリガー記憶ID「${trigger.id}」が存在しません`);
                }
            } else if (trigger.type === 'emotion') {
                if (!emotionIds.has(trigger.id)) {
                    errors.push(`トリガー感情ID「${trigger.id}」が存在しません`);
                }
            } else if (trigger.type === 'complex' && trigger.conditions) {
                // 複合条件の検証
                for (const condition of trigger.conditions) {
                    if (condition.type === 'memory' && !memoryIds.has(condition.id)) {
                        errors.push(`複合条件内の記憶ID「${condition.id}」が存在しません`);
                    } else if (condition.type === 'emotion' && !emotionIds.has(condition.id)) {
                        errors.push(`複合条件内の感情ID「${condition.id}」が存在しません`);
                    }
                }
            }
            
            // レスポンス検証
            const response = assoc.response || {};
            
            if (response.type === 'memory') {
                if (!memoryIds.has(response.id)) {
                    errors.push(`レスポンス記憶ID「${response.id}」が存在しません`);
                }
            } else if (response.type === 'emotion') {
                if (!emotionIds.has(response.id)) {
                    errors.push(`レスポンス感情ID「${response.id}」が存在しません`);
                }
            }
        }
    }
    
    return errors;
}

// メモリIDの重複チェック
function checkDuplicateMemoryIds(persona) {
    const errors = [];
    const ids = new Set();
    
    if (persona.memory_system && persona.memory_system.memories) {
        for (const memory of persona.memory_system.memories) {
            if (ids.has(memory.id)) {
                errors.push(`記憶ID「${memory.id}」が重複しています`);
            } else {
                ids.add(memory.id);
            }
        }
    }
    
    return errors;
}

// フィールド値のバリデーション
function validateField(field, rules) {
    const errors = [];
    const value = field.value;
    
    // 各ルールをチェック
    for (const rule of rules) {
        switch (rule.type) {
            case 'required':
                if (!value.trim()) {
                    errors.push(rule.message || '必須項目です');
                }
                break;
                
            case 'maxLength':
                if (value.length > rule.value) {
                    errors.push(rule.message || `${rule.value}文字以内で入力してください`);
                }
                break;
                
            case 'number':
                if (value && (isNaN(value) || !isFinite(value))) {
                    errors.push(rule.message || '数値を入力してください');
                }
                break;
                
            case 'range':
                const num = parseFloat(value);
                if (!isNaN(num)) {
                    if (num < rule.min || num > rule.max) {
                        errors.push(rule.message || `${rule.min}〜${rule.max}の範囲で入力してください`);
                    }
                }
                break;
                
            case 'pattern':
                if (value && !new RegExp(rule.pattern).test(value)) {
                    errors.push(rule.message || '入力形式が正しくありません');
                }
                break;
        }
    }
    
    return errors;
}

// CSS追加用 (スタイルシートに追加する)
/*
.error {
    border-color: rgba(239, 68, 68, 0.5) !important;
    background-color: rgba(239, 68, 68, 0.05) !important;
}

.validation-error {
    color: #EF4444;
    font-size: 0.875rem;
    margin-top: 0.25rem;
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}

#error-summary {
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    max-width: 400px;
}
*/
