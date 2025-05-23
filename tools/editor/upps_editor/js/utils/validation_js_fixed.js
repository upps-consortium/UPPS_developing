// js/utils/validation.js
// ペルソナデータのバリデーション機能（修正版）

/**
 * ペルソナ全体のバリデーションを行う関数
 * @param {Object} persona ペルソナデータ
 * @returns {Object} エラーメッセージのオブジェクト
 */
function validatePersona(persona) {
    const errors = {};

    if (!persona) {
        errors.general = 'ペルソナデータが存在しません';
        return errors;
    }

    // 基本情報の検証
    if (!persona.personal_info) {
        errors.personal_info = '基本情報が設定されていません';
    } else {
        if (!persona.personal_info.name || persona.personal_info.name.trim() === '') {
            errors.name = '名前は必須です';
        } else if (persona.personal_info.name.length > window.UPPS_CONFIG.VALIDATION.MAX_NAME_LENGTH) {
            errors.name = `名前は${window.UPPS_CONFIG.VALIDATION.MAX_NAME_LENGTH}文字以内で入力してください`;
        }

        if (persona.personal_info.age !== null && persona.personal_info.age !== undefined) {
            if (isNaN(persona.personal_info.age) || 
                persona.personal_info.age < window.UPPS_CONFIG.VALIDATION.MIN_AGE || 
                persona.personal_info.age > window.UPPS_CONFIG.VALIDATION.MAX_AGE) {
                errors.age = `年齢は${window.UPPS_CONFIG.VALIDATION.MIN_AGE}〜${window.UPPS_CONFIG.VALIDATION.MAX_AGE}の範囲で入力してください`;
            }
        }

        if (persona.background && persona.background.length > window.UPPS_CONFIG.VALIDATION.MAX_DESCRIPTION_LENGTH) {
            errors.background = `背景は${window.UPPS_CONFIG.VALIDATION.MAX_DESCRIPTION_LENGTH}文字以内で入力してください`;
        }
    }

    // 感情システムの検証
    if (window.EmotionSystem) {
        const emotionErrors = window.EmotionSystem.validateEmotionSystem(persona);
        emotionErrors.forEach((error, index) => {
            errors[`emotion_error_${index}`] = error;
        });
    }

    // 性格特性の検証
    if (persona.personality && persona.personality.model === 'Big Five') {
        const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
        
        for (const trait of traits) {
            if (persona.personality.traits && persona.personality.traits[trait] !== undefined) {
                const value = persona.personality.traits[trait];
                if (isNaN(value) || value < 0 || value > 1) {
                    errors[`trait_${trait}`] = `${window.UPPS_HELPERS.getTraitLabel(trait)}は0〜1の範囲で入力してください`;
                }
            }
        }
    }

    // 記憶システムの検証
    if (window.MemorySystem) {
        const memoryErrors = window.MemorySystem.validateMemorySystem(persona);
        memoryErrors.forEach((error, index) => {
            errors[`memory_error_${index}`] = error;
        });
    }

    // 関連性システムの検証
    if (window.AssociationSystem) {
        const associationErrors = window.AssociationSystem.validateAssociationSystem(persona);
        associationErrors.forEach((error, index) => {
            errors[`association_error_${index}`] = error;
        });
    }

    // 認知能力の検証
    if (window.CognitiveSystem) {
        const cognitiveErrors = window.CognitiveSystem.validateCognitiveSystem(persona);
        cognitiveErrors.forEach((error, index) => {
            errors[`cognitive_error_${index}`] = error;
        });
    }

    return errors;
}

/**
 * エラーを表示する関数
 * @param {Object} errors エラーメッセージのオブジェクト
 * @returns {Boolean} エラーが表示された場合はtrue
 */
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
        if (key.startsWith('name') || key.startsWith('age') || key.startsWith('gender') || 
            key.startsWith('occupation') || key.startsWith('background') || key.startsWith('personal_info')) {
            errorCount.basic++;
        } else if (key.startsWith('emotion') || key.includes('emotion')) {
            errorCount.emotion++;
        } else if (key.startsWith('trait') || key.startsWith('personality')) {
            errorCount.personality++;
        } else if (key.startsWith('memory') || key.includes('memory')) {
            errorCount.memory++;
        } else if (key.startsWith('assoc') || key.includes('trigger') || key.includes('response') || key.includes('association')) {
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
        }
    }
    
    // エラーサマリーの表示
    displayErrorSummary(errorCount, errors);
    
    // 通知システムがあれば使用
    if (window.NotificationManager) {
        window.NotificationManager.showValidationErrors(errors);
    }
    
    return true;
}

/**
 * エラーサマリーの表示
 * @param {Object} errorCount タブごとのエラー数
 * @param {Object} errors エラーメッセージ
 */
function displayErrorSummary(errorCount, errors) {
    // 既存のエラーサマリーを削除
    const existingSummary = document.getElementById('error-summary');
    if (existingSummary) {
        existingSummary.remove();
    }
    
    // エラーの総数
    const totalErrors = Object.values(errorCount).reduce((sum, count) => sum + count, 0);
    
    if (totalErrors === 0) return;
    
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
        const tabLabels = {
            basic: '基本情報',
            emotion: '感情システム',
            personality: '性格特性',
            memory: '記憶システム',
            association: '関連性',
            cognitive: '認知能力',
            unknown: 'その他'
        };
        
        for (const [tab, count] of Object.entries(errorCount)) {
            if (count > 0) {
                summaryContent += `<div class="flex justify-between"><span>${tabLabels[tab]}：</span><span>${count}件</span></div>`;
            }
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

/**
 * 最初のエラーのあるタブに切り替える
 * @param {Object} errorCount タブごとのエラー数
 */
function switchToFirstErrorTab(errorCount) {
    // タブの優先順位
    const tabPriority = ['basic', 'emotion', 'personality', 'memory',  'association', 'cognitive'];
    
    // エラーのあるタブを見つける
    for (const tab of tabPriority) {
        if (errorCount[tab] > 0) {
            // 【修正】グローバル変数名を統一
            if (window.uppsEditor) {
                window.uppsEditor.activeTab = tab;
            }
            break;
        }
    }
}

/**
 * エラー表示をクリアする関数
 */
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
    const globalErrorContainers = document.querySelectorAll('#global-errors, .global-errors');
    globalErrorContainers.forEach(container => {
        container.innerHTML = '';
    });
    
    // エラーサマリーを削除
    const existingSummary = document.getElementById('error-summary');
    if (existingSummary) {
        existingSummary.remove();
    }
}

/**
 * 参照整合性検証
 * @param {Object} persona ペルソナデータ
 * @returns {Array} 整合性エラーのリスト
 */
function validateReferentialIntegrity(persona) {
    const errors = [];
    
    // 存在する記憶IDと感情IDを収集
    const memoryIds = new Set();
    const emotionIds = new Set();
    
    if (persona.memory_system?.memories) {
        persona.memory_system.memories.forEach(memory => {
            if (memory.id) memoryIds.add(memory.id);
        });
    }
    
    if (persona.emotion_system?.emotions) {
        Object.keys(persona.emotion_system.emotions).forEach(id => emotionIds.add(id));
    }
    
    // 関連性システムの参照をチェック
    if (persona.association_system?.associations) {
        persona.association_system.associations.forEach((assoc, index) => {
            // トリガーのチェック
            if (assoc.trigger) {
                if (assoc.trigger.type === 'memory' && !memoryIds.has(assoc.trigger.id)) {
                    errors.push(`関連性${index + 1}: トリガー記憶ID "${assoc.trigger.id}" が存在しません`);
                }
                
                if (assoc.trigger.type === 'emotion' && !emotionIds.has(assoc.trigger.id)) {
                    errors.push(`関連性${index + 1}: トリガー感情ID "${assoc.trigger.id}" が存在しません`);
                }
                
                // 複合条件のチェック
                if (assoc.trigger.type === 'complex' && assoc.trigger.conditions) {
                    assoc.trigger.conditions.forEach((condition, condIndex) => {
                        if (condition.type === 'memory' && !memoryIds.has(condition.id)) {
                            errors.push(`関連性${index + 1}条件${condIndex + 1}: 記憶ID "${condition.id}" が存在しません`);
                        }
                        if (condition.type === 'emotion' && !emotionIds.has(condition.id)) {
                            errors.push(`関連性${index + 1}条件${condIndex + 1}: 感情ID "${condition.id}" が存在しません`);
                        }
                    });
                }
            }
            
            // レスポンスのチェック
            if (assoc.response) {
                if (assoc.response.type === 'memory' && !memoryIds.has(assoc.response.id)) {
                    errors.push(`関連性${index + 1}: レスポンス記憶ID "${assoc.response.id}" が存在しません`);
                }
                
                if (assoc.response.type === 'emotion' && !emotionIds.has(assoc.response.id)) {
                    errors.push(`関連性${index + 1}: レスポンス感情ID "${assoc.response.id}" が存在しません`);
                }
            }
        });
    }
    
    return errors;
}

/**
 * フィールド値のバリデーション
 * @param {HTMLElement} field フィールド要素
 * @param {Array} rules バリデーションルール
 * @returns {Array} エラーリスト
 */
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

// グローバル関数として公開
window.validatePersona = validatePersona;
window.displayValidationErrors = displayValidationErrors;
window.clearValidationErrors = clearValidationErrors;
window.validateReferentialIntegrity = validateReferentialIntegrity;
window.validateField = validateField;

// UPPSEditorの統合バリデーター
if (typeof window.PersonaValidator === 'undefined') {
    window.PersonaValidator = {
        validatePersona,
        displayValidationErrors,
        clearValidationErrors,
        validateReferentialIntegrity,
        validateField
    };
}

window.UPPS_LOG.info('Validation utilities initialized');
