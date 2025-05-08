// validation.js
// プロファイルデータのバリデーション

// バリデーションエラーをチェック
function validateProfile(profile) {
    const errors = {};
    
    // 基本情報のバリデーション
    if (!profile.personal_info) {
        errors.personal_info = 'personal_info オブジェクトが見つかりません';
    } else {
        // 名前のバリデーション
        if (!profile.personal_info.name) {
            errors.name = '名前は必須です';
        } else if (profile.personal_info.name.length > 100) {
            errors.name = '名前は100文字以内で入力してください';
        }
        
        // 年齢のバリデーション
        if (profile.personal_info.age !== null && profile.personal_info.age !== undefined) {
            if (isNaN(profile.personal_info.age) || profile.personal_info.age < 0 || profile.personal_info.age > 150) {
                errors.age = '年齢は0〜150の範囲で入力してください';
            }
        }
    }
    
    // 感情システムのバリデーション
    if (!profile.emotion_system) {
        errors.emotion_system = 'emotion_system オブジェクトが見つかりません';
    } else {
        // モデル種類のバリデーション
        if (!profile.emotion_system.model) {
            errors.emotion_model = '感情モデルは必須です';
        } else if (!['Ekman', 'Plutchik', 'PAD', 'Custom'].includes(profile.emotion_system.model)) {
            errors.emotion_model = '無効な感情モデルです';
        }
        
        // 感情データのバリデーション
        if (!profile.emotion_system.emotions) {
            errors.emotions = 'emotions オブジェクトが見つかりません';
        } else {
            // Ekmanモデルの場合は6つの基本感情をチェック
            if (profile.emotion_system.model === 'Ekman') {
                const requiredEmotions = ['joy', 'sadness', 'anger', 'fear', 'disgust', 'surprise'];
                
                for (const emotion of requiredEmotions) {
                    if (!profile.emotion_system.emotions[emotion]) {
                        errors[`emotion_${emotion}`] = `${emotion} 感情が定義されていません`;
                    } else if (profile.emotion_system.emotions[emotion].baseline === undefined) {
                        errors[`emotion_${emotion}_baseline`] = `${emotion} 感情のベースライン値が設定されていません`;
                    } else if (isNaN(profile.emotion_system.emotions[emotion].baseline) || 
                               profile.emotion_system.emotions[emotion].baseline < 0 || 
                               profile.emotion_system.emotions[emotion].baseline > 100) {
                        errors[`emotion_${emotion}_baseline`] = `${emotion} 感情のベースライン値は0〜100の範囲である必要があります`;
                    }
                }
            }
        }
    }
    
    // 性格特性のバリデーション
    if (!profile.personality) {
        errors.personality = 'personality オブジェクトが見つかりません';
    } else {
        // モデル種類のバリデーション
        if (!profile.personality.model) {
            errors.personality_model = '性格モデルは必須です';
        } else if (profile.personality.model !== 'Big Five') {
            errors.personality_model = '現在サポートされているのはBig Fiveモデルのみです';
        }
        
        // 特性データのバリデーション
        if (!profile.personality.traits) {
            errors.traits = 'traits オブジェクトが見つかりません';
        } else {
            const requiredTraits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
            
            for (const trait of requiredTraits) {
                if (profile.personality.traits[trait] === undefined) {
                    errors[`trait_${trait}`] = `${trait} 特性が定義されていません`;
                } else if (isNaN(profile.personality.traits[trait]) || 
                           profile.personality.traits[trait] < 0 || 
                           profile.personality.traits[trait] > 1) {
                    errors[`trait_${trait}`] = `${trait} 特性の値は0〜1の範囲である必要があります`;
                }
            }
        }
    }
    
    // 記憶システムのバリデーション
    if (profile.memory_system) {
        if (profile.memory_system.memories) {
            // 各記憶のバリデーション
            for (let i = 0; i < profile.memory_system.memories.length; i++) {
                const memory = profile.memory_system.memories[i];
                
                // ID検証
                if (!memory.id) {
                    errors[`memory_${i}_id`] = `記憶 #${i+1} のIDは必須です`;
                } else if (!/^[a-zA-Z0-9_]+$/.test(memory.id)) {
                    errors[`memory_${i}_id`] = `記憶 #${i+1} のIDは英数字とアンダースコアのみ使用可能です`;
                }
                
                // タイプ検証
                if (!memory.type) {
                    errors[`memory_${i}_type`] = `記憶 #${i+1} のタイプは必須です`;
                } else if (!['episodic', 'semantic', 'procedural', 'autobiographical'].includes(memory.type)) {
                    errors[`memory_${i}_type`] = `記憶 #${i+1} のタイプが無効です`;
                }
                
                // 内容検証
                if (!memory.content) {
                    errors[`memory_${i}_content`] = `記憶 #${i+1} の内容は必須です`;
                }
                
                // IDの重複チェック
                for (let j = i + 1; j < profile.memory_system.memories.length; j++) {
                    if (memory.id === profile.memory_system.memories[j].id) {
                        errors[`memory_${i}_duplicate`] = `記憶ID「${memory.id}」が重複しています`;
                        break;
                    }
                }
            }
        }
    }
    
    // 関連性ネットワークのバリデーション
    if (profile.association_system && profile.association_system.associations) {
        for (let i = 0; i < profile.association_system.associations.length; i++) {
            const assoc = profile.association_system.associations[i];
            
            // トリガーの検証
            if (!assoc.trigger || !assoc.trigger.type) {
                errors[`assoc_${i}_trigger`] = `関連性 #${i+1} のトリガータイプは必須です`;
            } else {
                // トリガータイプに応じた検証
                if (assoc.trigger.type === 'memory') {
                    if (!assoc.trigger.id) {
                        errors[`assoc_${i}_trigger_id`] = `関連性 #${i+1} のトリガー記憶IDは必須です`;
                    } else {
                        // 記憶IDの存在チェック
                        const memoryExists = profile.memory_system && 
                                            profile.memory_system.memories && 
                                            profile.memory_system.memories.some(m => m.id === assoc.trigger.id);
                        
                        if (!memoryExists) {
                            errors[`assoc_${i}_trigger_id_invalid`] = `関連性 #${i+1} のトリガー記憶ID「${assoc.trigger.id}」が存在しません`;
                        }
                    }
                } else if (assoc.trigger.type === 'emotion') {
                    if (!assoc.trigger.id) {
                        errors[`assoc_${i}_trigger_id`] = `関連性 #${i+1} のトリガー感情IDは必須です`;
                    } else {
                        // 感情IDの存在チェック
                        const emotionExists = profile.emotion_system && 
                                            profile.emotion_system.emotions && 
                                            profile.emotion_system.emotions[assoc.trigger.id];
                        
                        if (!emotionExists) {
                            errors[`assoc_${i}_trigger_id_invalid`] = `関連性 #${i+1} のトリガー感情ID「${assoc.trigger.id}」が存在しません`;
                        }
                    }
                    
                    // 閾値の検証
                    if (assoc.trigger.threshold === undefined) {
                        errors[`assoc_${i}_trigger_threshold`] = `関連性 #${i+1} のトリガー閾値は必須です`;
                    } else if (isNaN(assoc.trigger.threshold) || 
                               assoc.trigger.threshold < 0 || 
                               assoc.trigger.threshold > 100) {
                        errors[`assoc_${i}_trigger_threshold`] = `関連性 #${i+1} のトリガー閾値は0〜100の範囲である必要があります`;
                    }
                } else if (assoc.trigger.type === 'external') {
                    if (!assoc.trigger.category) {
                        errors[`assoc_${i}_trigger_category`] = `関連性 #${i+1} のトリガーカテゴリは必須です`;
                    } else if (!['topics', 'environment', 'keywords'].includes(assoc.trigger.category)) {
                        errors[`assoc_${i}_trigger_category`] = `関連性 #${i+1} のトリガーカテゴリが無効です`;
                    }
                    
                    if (!assoc.trigger.items || !Array.isArray(assoc.trigger.items) || assoc.trigger.items.length === 0) {
                        errors[`assoc_${i}_trigger_items`] = `関連性 #${i+1} のトリガーアイテムは1つ以上必要です`;
                    }
                } else if (assoc.trigger.type === 'complex') {
                    if (!assoc.trigger.operator) {
                        errors[`assoc_${i}_trigger_operator`] = `関連性 #${i+1} の複合条件演算子は必須です`;
                    } else if (!['AND', 'OR'].includes(assoc.trigger.operator)) {
                        errors[`assoc_${i}_trigger_operator`] = `関連性 #${i+1} の複合条件演算子が無効です`;
                    }
                    
                    if (!assoc.trigger.conditions || !Array.isArray(assoc.trigger.conditions) || assoc.trigger.conditions.length === 0) {
                        errors[`assoc_${i}_trigger_conditions`] = `関連性 #${i+1} の複合条件は1つ以上必要です`;
                    }
                } else {
                    errors[`assoc_${i}_trigger_type`] = `関連性 #${i+1} のトリガータイプ「${assoc.trigger.type}」が無効です`;
                }
            }
            
            // レスポンスの検証
            if (!assoc.response || !assoc.response.type) {
                errors[`assoc_${i}_response`] = `関連性 #${i+1} のレスポンスタイプは必須です`;
            } else {
                // レスポンスタイプに応じた検証
                if (assoc.response.type === 'memory') {
                    if (!assoc.response.id) {
                        errors[`assoc_${i}_response_id`] = `関連性 #${i+1} のレスポンス記憶IDは必須です`;
                    } else {
                        // 記憶IDの存在チェック
                        const memoryExists = profile.memory_system && 
                                            profile.memory_system.memories && 
                                            profile.memory_system.memories.some(m => m.id === assoc.response.id);
                        
                        if (!memoryExists) {
                            errors[`assoc_${i}_response_id_invalid`] = `関連性 #${i+1} のレスポンス記憶ID「${assoc.response.id}」が存在しません`;
                        }
                    }
                } else if (assoc.response.type === 'emotion') {
                    if (!assoc.response.id) {
                        errors[`assoc_${i}_response_id`] = `関連性 #${i+1} のレスポンス感情IDは必須です`;
                    } else {
                        // 感情IDの存在チェック
                        const emotionExists = profile.emotion_system && 
                                            profile.emotion_system.emotions && 
                                            profile.emotion_system.emotions[assoc.response.id];
                        
                        if (!emotionExists) {
                            errors[`assoc_${i}_response_id_invalid`] = `関連性 #${i+1} のレスポンス感情ID「${assoc.response.id}」が存在しません`;
                        }
                    }
                } else {
                    errors[`assoc_${i}_response_type`] = `関連性 #${i+1} のレスポンスタイプ「${assoc.response.type}」が無効です`;
                }
                
                // 関連強度の検証
                if (assoc.response.association_strength === undefined) {
                    errors[`assoc_${i}_response_strength`] = `関連性 #${i+1} の関連強度は必須です`;
                } else if (isNaN(assoc.response.association_strength) || 
                        assoc.response.association_strength < 0 || 
                        assoc.response.association_strength > 100) {
                    errors[`assoc_${i}_response_strength`] = `関連性 #${i+1} の関連強度は0〜100の範囲である必要があります`;
                }
            }
        }
    }
    
    // 認知能力のバリデーション
    if (!profile.cognitive_system) {
        errors.cognitive_system = 'cognitive_system オブジェクトが見つかりません';
    } else {
        // モデル種類のバリデーション
        if (!profile.cognitive_system.model) {
            errors.cognitive_model = '認知モデルは必須です';
        } else if (!['WAIS-IV', 'CHC', 'Custom'].includes(profile.cognitive_system.model)) {
            errors.cognitive_model = '無効な認知モデルです';
        }
        
        // WAIS-IVモデルの場合の能力検証
        if (profile.cognitive_system.model === 'WAIS-IV') {
            if (!profile.cognitive_system.abilities) {
                errors.abilities = 'abilities オブジェクトが見つかりません';
            } else {
                const requiredAbilities = [
                    'verbal_comprehension',
                    'perceptual_reasoning',
                    'working_memory',
                    'processing_speed'
                ];
                
                for (const ability of requiredAbilities) {
                    if (!profile.cognitive_system.abilities[ability]) {
                        errors[`ability_${ability}`] = `${ability} 能力が定義されていません`;
                    } else if (profile.cognitive_system.abilities[ability].level === undefined) {
                        errors[`ability_${ability}_level`] = `${ability} 能力のレベルが設定されていません`;
                    } else if (isNaN(profile.cognitive_system.abilities[ability].level) || 
                               profile.cognitive_system.abilities[ability].level < 0 || 
                               profile.cognitive_system.abilities[ability].level > 100) {
                        errors[`ability_${ability}_level`] = `${ability} 能力のレベルは0〜100の範囲である必要があります`;
                    }
                }
            }
        }
    }
    
    return errors;
}

// エラーを表示する関数
function displayValidationErrors(errors) {
    // エラーが無ければ何もしない
    if (Object.keys(errors).length === 0) {
        clearValidationErrors();
        return false;
    }
    
    // エラー表示をクリア
    clearValidationErrors();
    
    // エラーメッセージを表示
    for (const [key, message] of Object.entries(errors)) {
        const element = document.querySelector(`[data-validation="${key}"]`);
        
        if (element) {
            const errorElement = document.createElement('div');
            errorElement.className = 'validation-error';
            errorElement.textContent = message;
            errorElement.setAttribute('data-error-for', key);
            
            element.parentNode.insertBefore(errorElement, element.nextSibling);
            element.classList.add('error');
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
    
    // エラーがあることを通知
    return true;
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
}