// validation.js
// ペルソナデータのバリデーション機能

/**
 * ペルソナ全体のバリデーションを行う関数
 * @param {Object} persona ペルソナデータ
 * @returns {Object} エラーメッセージのオブジェクト
 */
function validatePersona(persona) {
    const errors = {};

    // 基本情報の検証
    if (!persona.personal_info.name) {
        errors.name = '名前は必須です';
    }

    if (persona.personal_info.age && (isNaN(persona.personal_info.age) || 
        persona.personal_info.age < 0 || persona.personal_info.age > 120)) {
        errors.age = '年齢は0〜120の範囲で入力してください';
    }

    // 感情システムの検証
    if (!persona.emotion_system || !persona.emotion_system.model) {
        errors.emotion_model = '感情モデルは必須です';
    } else {
        // Ekmanモデルの場合、各感情の検証
        if (persona.emotion_system.model === 'Ekman') {
            const requiredEmotions = ['joy', 'sadness', 'anger', 'fear', 'disgust', 'surprise'];
            
            for (const emotion of requiredEmotions) {
                if (!persona.emotion_system.emotions || !persona.emotion_system.emotions[emotion]) {
                    errors[`emotion_${emotion}`] = `${getEmotionLabel(emotion)}の定義が不足しています`;
                } else {
                    const baseline = persona.emotion_system.emotions[emotion].baseline;
                    if (baseline === undefined || baseline === null || isNaN(baseline) || 
                        baseline < 0 || baseline > 100) {
                        errors[`emotion_${emotion}_baseline`] = `${getEmotionLabel(emotion)}のベースライン値は0〜100の範囲で入力してください`;
                    }
                    
                    if (!persona.emotion_system.emotions[emotion].description) {
                        errors[`emotion_${emotion}_description`] = `${getEmotionLabel(emotion)}の説明を入力してください`;
                    }
                }
            }
        }
    }

    // 性格特性の検証
    if (persona.personality && persona.personality.model === 'Big Five') {
        const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
        
        for (const trait of traits) {
            if (persona.personality.traits[trait] === undefined || 
                isNaN(persona.personality.traits[trait]) || 
                persona.personality.traits[trait] < 0 || 
                persona.personality.traits[trait] > 1) {
                errors[`trait_${trait}`] = `${getTraitLabel(trait)}は0〜1の範囲で入力してください`;
            }
        }
    }

    // 記憶システムの検証
    if (persona.memory_system && persona.memory_system.memories) {
        const memoryIds = new Set();
        
        persona.memory_system.memories.forEach((memory, index) => {
            if (!memory.id) {
                errors[`memory_${index}_id`] = `記憶${index + 1}のIDは必須です`;
            } else if (!/^[a-zA-Z0-9_]+$/.test(memory.id)) {
                errors[`memory_${index}_id`] = `記憶IDは英数字とアンダースコアのみ使用できます`;
            } else if (memoryIds.has(memory.id)) {
                errors[`memory_${index}_id`] = `記憶ID "${memory.id}" が重複しています`;
            } else {
                memoryIds.add(memory.id);
            }
            
            if (!memory.type) {
                errors[`memory_${index}_type`] = `記憶${index + 1}のタイプは必須です`;
            }
            
            if (!memory.content) {
                errors[`memory_${index}_content`] = `記憶${index + 1}の内容は必須です`;
            }
        });
    }

    // 関連性システムの検証
    if (persona.association_system && persona.association_system.associations) {
        // 記憶IDと感情IDのセットを作成
        const memoryIds = new Set();
        const emotionIds = new Set();
        
        if (persona.memory_system && persona.memory_system.memories) {
            persona.memory_system.memories.forEach(memory => memoryIds.add(memory.id));
        }
        
        if (persona.emotion_system && persona.emotion_system.emotions) {
            Object.keys(persona.emotion_system.emotions).forEach(id => emotionIds.add(id));
        }
        
        // 各関連性の検証
        persona.association_system.associations.forEach((assoc, index) => {
            // トリガーの検証
            if (!assoc.trigger || !assoc.trigger.type) {
                errors[`assoc_${index}_trigger_type`] = `関連性${index + 1}のトリガータイプは必須です`;
            } else {
                if (assoc.trigger.type === 'memory') {
                    if (!assoc.trigger.id) {
                        errors[`assoc_${index}_trigger_id`] = `関連性${index + 1}のトリガー記憶IDは必須です`;
                    } else if (!memoryIds.has(assoc.trigger.id)) {
                        errors[`assoc_${index}_trigger_id`] = `関連性${index + 1}のトリガー記憶ID "${assoc.trigger.id}" は存在しません`;
                    }
                } else if (assoc.trigger.type === 'emotion') {
                    if (!assoc.trigger.id) {
                        errors[`assoc_${index}_trigger_id`] = `関連性${index + 1}のトリガー感情IDは必須です`;
                    } else if (!emotionIds.has(assoc.trigger.id)) {
                        errors[`assoc_${index}_trigger_id`] = `関連性${index + 1}のトリガー感情ID "${assoc.trigger.id}" は存在しません`;
                    }
                    
                    if (assoc.trigger.threshold === undefined || assoc.trigger.threshold === null || 
                        isNaN(assoc.trigger.threshold) || assoc.trigger.threshold < 0 || assoc.trigger.threshold > 100) {
                        errors[`assoc_${index}_trigger_threshold`] = `関連性${index + 1}のトリガー閾値は0〜100の範囲で入力してください`;
                    }
                } else if (assoc.trigger.type === 'complex') {
                    if (!assoc.trigger.operator) {
                        errors[`assoc_${index}_trigger_operator`] = `関連性${index + 1}の複合条件演算子は必須です`;
                    }
                    
                    if (!assoc.trigger.conditions || !Array.isArray(assoc.trigger.conditions) || assoc.trigger.conditions.length === 0) {
                        errors[`assoc_${index}_trigger_conditions`] = `関連性${index + 1}の複合条件は少なくとも1つ必要です`;
                    } else {
                        // 各条件の検証
                        assoc.trigger.conditions.forEach((condition, condIndex) => {
                            if (!condition.type) {
                                errors[`assoc_${index}_condition_${condIndex}_type`] = `関連性${index + 1}の条件${condIndex + 1}のタイプは必須です`;
                            } else if (condition.type === 'memory') {
                                if (!condition.id) {
                                    errors[`assoc_${index}_condition_${condIndex}_id`] = `関連性${index + 1}の条件${condIndex + 1}の記憶IDは必須です`;
                                } else if (!memoryIds.has(condition.id)) {
                                    errors[`assoc_${index}_condition_${condIndex}_id`] = `関連性${index + 1}の条件${condIndex + 1}の記憶ID "${condition.id}" は存在しません`;
                                }
                            } else if (condition.type === 'emotion') {
                                if (!condition.id) {
                                    errors[`assoc_${index}_condition_${condIndex}_id`] = `関連性${index + 1}の条件${condIndex + 1}の感情IDは必須です`;
                                } else if (!emotionIds.has(condition.id)) {
                                    errors[`assoc_${index}_condition_${condIndex}_id`] = `関連性${index + 1}の条件${condIndex + 1}の感情ID "${condition.id}" は存在しません`;
                                }
                                
                                if (condition.threshold === undefined || condition.threshold === null || 
                                    isNaN(condition.threshold) || condition.threshold < 0 || condition.threshold > 100) {
                                    errors[`assoc_${index}_condition_${condIndex}_threshold`] = `関連性${index + 1}の条件${condIndex + 1}の閾値は0〜100の範囲で入力してください`;
                                }
                            }
                        });
                    }
                }
            }
            
            // レスポンスの検証
            if (!assoc.response || !assoc.response.type) {
                errors[`assoc_${index}_response_type`] = `関連性${index + 1}のレスポンスタイプは必須です`;
            } else {
                if (assoc.response.type === 'memory') {
                    if (!assoc.response.id) {
                        errors[`assoc_${index}_response_id`] = `関連性${index + 1}のレスポンス記憶IDは必須です`;
                    } else if (!memoryIds.has(assoc.response.id)) {
                        errors[`assoc_${index}_response_id`] = `関連性${index + 1}のレスポンス記憶ID "${assoc.response.id}" は存在しません`;
                    }
                } else if (assoc.response.type === 'emotion') {
                    if (!assoc.response.id) {
                        errors[`assoc_${index}_response_id`] = `関連性${index + 1}のレスポンス感情IDは必須です`;
                    } else if (!emotionIds.has(assoc.response.id)) {
                        errors[`assoc_${index}_response_id`] = `関連性${index + 1}のレスポンス感情ID "${assoc.response.id}" は存在しません`;
                    }
                }
                
                if (assoc.response.association_strength === undefined || assoc.response.association_strength === null || 
                    isNaN(assoc.response.association_strength) || 
                    assoc.response.association_strength < 0 || assoc.response.association_strength > 100) {
                    errors[`assoc_${index}_response_strength`] = `関連性${index + 1}の関連強度は0〜100の範囲で入力してください`;
                }
            }
        });
    }

    // 認知能力の検証
    if (persona.cognitive_system && persona.cognitive_system.model === 'WAIS-IV') {
        const abilities = ['verbal_comprehension', 'perceptual_reasoning', 'working_memory', 'processing_speed'];
        
        for (const ability of abilities) {
            if (!persona.cognitive_system.abilities[ability]) {
                errors[`ability_${ability}`] = `${getAbilityLabel(ability)}の定義が不足しています`;
            } else {
                const level = persona.cognitive_system.abilities[ability].level;
                if (level === undefined || level === null || isNaN(level) || level < 0 || level > 100) {
                    errors[`ability_${ability}_level`] = `${getAbilityLabel(ability)}のレベルは0〜100の範囲で入力してください`;
                }
            }
        }
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

/**
 * 最初のエラーのあるタブに切り替える
 * @param {Object} errorCount タブごとのエラー数
 */
function switchToFirstErrorTab(errorCount) {
    // タブの優先順位
    const tabPriority = ['basic', 'emotion', 'personality', 'memory', 'association', 'cognitive'];
    
    // エラーのあるタブを見つける
    for (const tab of tabPriority) {
        if (errorCount[tab] > 0) {
            // タブの切り替え
            window.uppsEditor.activeTab = tab;
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

/**
 * ペルソナのバリデーションを実行し、保存する関数
 * @returns {Boolean} バリデーション成功の場合はtrue
 */
function validateAndSavePersona() {
    // バリデーションを実行
    const errors = validatePersona(this.persona);
    
    // エラーがあれば表示して保存しない
    if (Object.keys(errors).length > 0) {
        displayValidationErrors(errors);
        this.showNotification('入力内容に問題があります', 'error');
        return false;
    }
    
    // エラーがなければ保存
    this.savePersona();
    this.showNotification('ペルソナを保存しました', 'success');
    return true;
}
