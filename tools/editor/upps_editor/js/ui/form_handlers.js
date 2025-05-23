// js/ui/form_handlers.js
// フォーム処理・バリデーション表示・フィールド状態管理

/**
 * フォームハンドラー管理クラス
 */
class FormHandlerManager {
    constructor() {
        this.fieldStates = new Map();
        this.validationRules = new Map();
        this.debounceTimers = new Map();
        this.debounceDelay = 300;
        this.initialized = false;
    }
    
    /**
     * フォームハンドラーシステムを初期化
     */
    initialize() {
        if (this.initialized) return;
        
        // フォームフィールドの初期化
        this.initializeFormFields();
        
        // バリデーションルールの設定
        this.setupValidationRules();
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        this.initialized = true;
        window.UPPS_LOG.debug('Form handler system initialized');
    }
    
    /**
     * フォームフィールドの初期化
     */
    initializeFormFields() {
        const formFields = document.querySelectorAll('input, textarea, select');
        
        formFields.forEach(field => {
            // フィールド状態を初期化
            this.fieldStates.set(field, {
                pristine: true,
                valid: true,
                value: field.value,
                errors: []
            });
            
            // 必須フィールドのマーク
            if (field.hasAttribute('required')) {
                this.markRequiredField(field);
            }
            
            // データバリデーション属性があれば登録
            const validationKey = field.getAttribute('data-validation');
            if (validationKey) {
                this.registerFieldForValidation(field, validationKey);
            }
        });
    }
    
    /**
     * 必須フィールドをマーク
     * @param {HTMLElement} field フィールド要素
     */
    markRequiredField(field) {
        const label = field.previousElementSibling;
        if (label && label.tagName === 'LABEL') {
            if (!label.querySelector('.required-mark')) {
                const mark = document.createElement('span');
                mark.className = 'required-mark text-red-400';
                mark.textContent = ' *';
                label.appendChild(mark);
            }
        }
    }
    
    /**
     * バリデーション用フィールドを登録
     * @param {HTMLElement} field フィールド要素
     * @param {string} validationKey バリデーションキー
     */
    registerFieldForValidation(field, validationKey) {
        // リアルタイムバリデーションのセットアップ
        field.addEventListener('input', () => {
            this.handleFieldInput(field, validationKey);
        });
        
        field.addEventListener('blur', () => {
            this.handleFieldBlur(field, validationKey);
        });
        
        field.addEventListener('focus', () => {
            this.handleFieldFocus(field);
        });
    }
    
    /**
     * バリデーションルールを設定
     */
    setupValidationRules() {
        // 基本情報のルール
        this.validationRules.set('name', [
            { type: 'required', message: '名前は必須です' },
            { type: 'maxLength', value: window.UPPS_CONFIG.VALIDATION.MAX_NAME_LENGTH, message: '名前が長すぎます' }
        ]);
        
        this.validationRules.set('age', [
            { type: 'number', message: '数値を入力してください' },
            { 
                type: 'range', 
                min: window.UPPS_CONFIG.VALIDATION.MIN_AGE, 
                max: window.UPPS_CONFIG.VALIDATION.MAX_AGE,
                message: `年齢は${window.UPPS_CONFIG.VALIDATION.MIN_AGE}〜${window.UPPS_CONFIG.VALIDATION.MAX_AGE}の範囲で入力してください`
            }
        ]);
        
        this.validationRules.set('background', [
            { 
                type: 'maxLength', 
                value: window.UPPS_CONFIG.VALIDATION.MAX_DESCRIPTION_LENGTH,
                message: '説明が長すぎます'
            }
        ]);
        
        // その他のルールも設定
        this.setupAdditionalValidationRules();
    }
    
    /**
     * 追加のバリデーションルールを設定
     */
    setupAdditionalValidationRules() {
        // 記憶IDのルール
        const memoryIdPattern = /^[a-zA-Z0-9_]+$/;
        this.validationRules.set('memory_id', [
            { type: 'required', message: '記憶IDは必須です' },
            { type: 'pattern', pattern: memoryIdPattern, message: '記憶IDは英数字とアンダースコアのみ使用できます' }
        ]);
        
        // 感情ベースラインのルール
        this.validationRules.set('emotion_baseline', [
            { type: 'number', message: '数値を入力してください' },
            { type: 'range', min: 0, max: 100, message: 'ベースライン値は0〜100の範囲で入力してください' }
        ]);
        
        // 関連強度のルール
        this.validationRules.set('association_strength', [
            { type: 'number', message: '数値を入力してください' },
            { type: 'range', min: 0, max: 100, message: '関連強度は0〜100の範囲で入力してください' }
        ]);
    }
    
    /**
     * フィールド入力時の処理
     * @param {HTMLElement} field フィールド要素
     * @param {string} validationKey バリデーションキー
     */
    handleFieldInput(field, validationKey) {
        // デバウンス処理
        const timerId = this.debounceTimers.get(field);
        if (timerId) {
            clearTimeout(timerId);
        }
        
        const newTimer = setTimeout(() => {
            this.validateFieldRealtime(field, validationKey);
        }, this.debounceDelay);
        
        this.debounceTimers.set(field, newTimer);
        
        // フィールド状態を更新
        const state = this.fieldStates.get(field);
        if (state) {
            state.pristine = false;
            state.value = field.value;
        }
    }
    
    /**
     * フィールドフォーカス時の処理
     * @param {HTMLElement} field フィールド要素
     */
    handleFieldFocus(field) {
        field.classList.add('focused');
        
        // エラー状態を一時的にクリア
        this.clearFieldError(field);
        
        window.UPPS_LOG.debug('Field focused', { field: field.name || field.id });
    }
    
    /**
     * フィールドブラー時の処理
     * @param {HTMLElement} field フィールド要素
     * @param {string} validationKey バリデーションキー
     */
    handleFieldBlur(field, validationKey) {
        field.classList.remove('focused');
        
        // 即座にバリデーション実行
        this.validateFieldRealtime(field, validationKey);
        
        window.UPPS_LOG.debug('Field blurred', { field: field.name || field.id });
    }
    
    /**
     * リアルタイムバリデーション
     * @param {HTMLElement} field フィールド要素
     * @param {string} validationKey バリデーションキー
     */
    validateFieldRealtime(field, validationKey) {
        const rules = this.validationRules.get(validationKey) || [];
        const errors = window.validateField ? window.validateField(field, rules) : [];
        
        // フィールド状態を更新
        const state = this.fieldStates.get(field);
        if (state) {
            state.valid = errors.length === 0;
            state.errors = errors;
        }
        
        // エラー表示を更新
        if (errors.length > 0) {
            this.showFieldError(field, errors[0]);
        } else {
            this.clearFieldError(field);
        }
    }
    
    /**
     * フィールドエラーを表示
     * @param {HTMLElement} field フィールド要素
     * @param {string} message エラーメッセージ
     */
    showFieldError(field, message) {
        // 既存のエラーメッセージを削除
        this.clearFieldError(field);
        
        // エラーメッセージを作成
        const errorElement = document.createElement('div');
        errorElement.className = 'validation-error text-red-400 text-sm mt-1';
        errorElement.textContent = message;
        errorElement.setAttribute('data-field-error', field.name || field.id);
        
        // フィールドの後に挿入
        field.parentNode.insertBefore(errorElement, field.nextSibling);
        
        // フィールドにエラースタイルを追加
        field.classList.add('error');
    }
    
    /**
     * フィールドエラーをクリア
     * @param {HTMLElement} field フィールド要素
     */
    clearFieldError(field) {
        // エラーメッセージを削除
        const errorElement = field.parentNode.querySelector(`[data-field-error="${field.name || field.id}"]`);
        if (errorElement) {
            errorElement.remove();
        }
        
        // フィールドのエラースタイルを削除
        field.classList.remove('error');
    }
    
    /**
     * 複合条件のタイプ変更時の更新
     * @param {number} associationIndex 関連性のインデックス
     * @param {number} conditionIndex 条件のインデックス
     */
    updateComplexConditionType(associationIndex, conditionIndex) {
        const editor = window.uppsEditor;
        if (!editor?.persona?.association_system?.associations) {
            return;
        }
        
        if (window.AssociationSystem) {
            window.AssociationSystem.updateComplexConditionType(editor.persona, associationIndex, conditionIndex);
        }
        
        window.UPPS_LOG.debug('Complex condition type updated', { associationIndex, conditionIndex });
    }
    
    /**
     * 外部トリガーのアイテム更新
     * @param {number} index 関連性のインデックス
     */
    updateExternalItems(index) {
        const editor = window.uppsEditor;
        if (!editor?.persona?.association_system?.associations || !editor.externalItems) {
            return;
        }
        
        if (window.AssociationSystem) {
            window.AssociationSystem.updateExternalItems(editor.persona, index, editor.externalItems);
        }
        
        window.UPPS_LOG.debug('External trigger items updated', { index });
    }
    
    /**
     * スライダー値の表示を更新
     * @param {HTMLElement} slider スライダー要素
     */
    updateSliderDisplay(slider) {
        const value = parseFloat(slider.value);
        
        // CSS変数を更新
        slider.style.setProperty('--value', value);
        
        // 対応する表示要素を更新
        const displayElement = slider.parentNode.querySelector('.slider-value, [data-slider-display]');
        if (displayElement) {
            // パーセンテージまたは小数点表示
            const max = parseFloat(slider.max) || 1;
            if (max === 1) {
                displayElement.textContent = Math.round(value * 100) + '%';
            } else {
                displayElement.textContent = Math.round(value) + (max === 100 ? '%' : '');
            }
        }
    }
    
    /**
     * セレクトボックスの変更を処理
     * @param {HTMLElement} select セレクト要素
     */
    handleSelectChange(select) {
        const validationKey = select.getAttribute('data-validation');
        
        if (validationKey) {
            // バリデーションキーに基づく特別な処理
            if (validationKey.includes('emotion_model')) {
                this.handleEmotionModelChange();
            } else if (validationKey.includes('cognitive_model')) {
                this.handleCognitiveModelChange();
            } else if (validationKey.includes('trigger_type')) {
                this.handleTriggerTypeChange(select);
            }
        }
        
        // 通常のバリデーション
        if (validationKey) {
            this.validateFieldRealtime(select, validationKey);
        }
    }
    
    /**
     * 感情モデル変更を処理
     */
    handleEmotionModelChange() {
        const editor = window.uppsEditor;
        if (editor && window.EmotionSystem) {
            window.EmotionSystem.initializeEmotionModel(editor.persona);
        }
    }
    
    /**
     * 認知モデル変更を処理
     */
    handleCognitiveModelChange() {
        const editor = window.uppsEditor;
        if (editor && window.CognitiveSystem) {
            window.CognitiveSystem.initializeCognitiveSystem(editor.persona);
        }
    }
    
    /**
     * トリガータイプ変更を処理
     * @param {HTMLElement} select セレクト要素
     */
    handleTriggerTypeChange(select) {
        // data-validation属性からインデックスを取得
        const validationKey = select.getAttribute('data-validation');
        const match = validationKey.match(/assoc_(\d+)_trigger_type/);
        
        if (match) {
            const index = parseInt(match[1], 10);
            const editor = window.uppsEditor;
            
            if (editor && window.AssociationSystem) {
                window.AssociationSystem.updateAssociationOptions(editor.persona, index, editor.externalItems);
            }
        }
    }
    
    /**
     * フォーム全体のバリデーション
     * @returns {boolean} バリデーション成功かどうか
     */
    validateAllFields() {
        let hasErrors = false;
        
        this.fieldStates.forEach((state, field) => {
            const validationKey = field.getAttribute('data-validation');
            if (validationKey) {
                this.validateFieldRealtime(field, validationKey);
                if (!state.valid) {
                    hasErrors = true;
                }
            }
        });
        
        return !hasErrors;
    }
    
    /**
     * 全フィールドのエラーをクリア
     */
    clearAllErrors() {
        this.fieldStates.forEach((state, field) => {
            this.clearFieldError(field);
            state.valid = true;
            state.errors = [];
        });
    }
    
    /**
     * フィールド状態をリセット
     */
    resetFieldStates() {
        this.fieldStates.forEach((state, field) => {
            state.pristine = true;
            state.valid = true;
            state.value = field.value;
            state.errors = [];
        });
    }
    
    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // グローバルイベントリスナー
        document.addEventListener('change', (event) => {
            const element = event.target;
            
            if (element.tagName === 'SELECT') {
                this.handleSelectChange(element);
            } else if (element.type === 'range') {
                this.updateSliderDisplay(element);
            }
        });
        
        // 新しいフィールドが追加された時の処理
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const fields = node.querySelectorAll ? node.querySelectorAll('input, textarea, select') : [];
                        fields.forEach((field) => {
                            if (!this.fieldStates.has(field)) {
                                this.registerFieldForValidation(field, field.getAttribute('data-validation'));
                            }
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    /**
     * システムをクリーンアップ
     */
    cleanup() {
        // タイマーをクリア
        this.debounceTimers.forEach((timer) => {
            clearTimeout(timer);
        });
        this.debounceTimers.clear();
        
        // 状態をクリア
        this.fieldStates.clear();
        this.validationRules.clear();
        
        this.initialized = false;
        window.UPPS_LOG.debug('Form handler system cleaned up');
    }
}

// グローバルインスタンスを作成
window.FormHandlers = new FormHandlerManager();

// UPPSEditorプロトタイプに関数を追加
if (typeof UPPSEditor !== 'undefined') {
    UPPSEditor.prototype.updateComplexConditionType = function(associationIndex, conditionIndex) {
        window.FormHandlers.updateComplexConditionType(associationIndex, conditionIndex);
    };
    
    UPPSEditor.prototype.updateExternalItems = function(index) {
        window.FormHandlers.updateExternalItems(index);
    };
    
    UPPSEditor.prototype.handleFieldFocus = function(event) {
        window.FormHandlers.handleFieldFocus(event.target);
    };
    
    UPPSEditor.prototype.handleFieldBlur = function(event) {
        const field = event.target;
        const validationKey = field.getAttribute('data-validation');
        window.FormHandlers.handleFieldBlur(field, validationKey);
    };
    
    UPPSEditor.prototype.validateAllFields = function() {
        return window.FormHandlers.validateAllFields();
    };
    
    UPPSEditor.prototype.clearAllFieldErrors = function() {
        window.FormHandlers.clearAllErrors();
    };
}

// ページロード時の初期化
document.addEventListener('DOMContentLoaded', () => {
    window.FormHandlers.initialize();
});

// タブロード時の初期化
document.addEventListener('tabLoaded', () => {
    window.FormHandlers.initialize();
});

// ページアンロード時のクリーンアップ
window.addEventListener('beforeunload', () => {
    window.FormHandlers.cleanup();
});

window.UPPS_LOG.info('Form handlers module initialized');
