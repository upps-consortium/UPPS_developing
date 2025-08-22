import UIController from './uiController.js';
import FileHandler from './fileHandler.js';

class PersonaData {
    constructor() {
        this.data = this.getDefaultData();
    }

    getDefaultData() {
        return {
            personal_info: {
                name: "",
                age: null,
                gender: "",
                occupation: ""
            },
            background: "",
            personality: {
                model: "BigFive",
                traits: {
                    openness: 0.5,
                    conscientiousness: 0.5,
                    extraversion: 0.5,
                    agreeableness: 0.5,
                    neuroticism: 0.5
                }
            },
            emotion_system: {
                model: "Ekman",
                emotions: {
                    joy: { baseline: 50, description: "幸福感、満足感" },
                    sadness: { baseline: 30, description: "悲しみ、失望感" },
                    anger: { baseline: 25, description: "怒り、いらだち" },
                    fear: { baseline: 40, description: "恐れ、不安" },
                    disgust: { baseline: 20, description: "嫌悪、不快感" },
                    surprise: { baseline: 55, description: "驚き、意外性への反応" }
                }
            },
            memory_system: {
                memories: [
                    {
                        id: "childhood_nature",
                        type: "episodic",
                        content: "子供の頃に森で見つけた珍しい昆虫を観察した経験",
                        period: "Childhood (Age 8)",
                        emotional_valence: "positive",
                        associated_emotions: ["joy", "curiosity"]
                    },
                    {
                        id: "first_research",
                        type: "episodic", 
                        content: "初めて研究論文を発表したときの達成感と緊張",
                        period: "Graduate School (Age 24)",
                        emotional_valence: "positive",
                        associated_emotions: ["joy", "fear"]
                    }
                ]
            },
            association_system: {
                associations: []
            },
            dialogue_instructions_text: "",
            non_dialogue_metadata_text: "",
            disease_prompts_text: ""
        };
    }

    getData() {
        return this.data;
    }

    setData(newData) {
        this.data = { ...this.data, ...newData };
        this.notifyChange();
    }

    updatePersonalInfo(info) {
        this.data.personal_info = { ...this.data.personal_info, ...info };
        this.notifyChange();
    }

    updatePersonality(traits) {
        this.data.personality.traits = { ...this.data.personality.traits, ...traits };
        this.notifyChange();
    }

    updateEmotionSystem(emotions) {
        Object.keys(emotions).forEach(emotion => {
            if (this.data.emotion_system.emotions[emotion]) {
                this.data.emotion_system.emotions[emotion].baseline = emotions[emotion];
            }
        });
        this.notifyChange();
    }

    updateBackground(background) {
        this.data.background = background;
        this.notifyChange();
    }

    updateDialogueText(text) {
        this.data.dialogue_instructions_text = text;
        this.notifyChange();
    }

    updateMetadataText(text) {
        this.data.non_dialogue_metadata_text = text;
        this.notifyChange();
    }

    updateDiseasePromptsText(text) {
        this.data.disease_prompts_text = text;
        this.notifyChange();
    }

    mergeDiseaseTemplate(template) {
        let current = {};
        try {
            current = jsyaml.load(this.data.disease_prompts_text) || {};
        } catch (e) {
            current = {};
        }
        const merged = { ...current, ...template };
        this.data.disease_prompts_text = jsyaml.dump(merged);
        this.notifyChange();
    }

    addAssociation(association) {
        association.id = Date.now(); // 簡易ID生成
        this.data.association_system.associations.push(association);
        this.notifyChange();
    }

    updateAssociation(id, updates) {
        const index = this.data.association_system.associations.findIndex(a => a.id === id);
        if (index !== -1) {
            this.data.association_system.associations[index] = { 
                ...this.data.association_system.associations[index], 
                ...updates 
            };
            this.notifyChange();
        }
    }

    deleteAssociation(id) {
        this.data.association_system.associations = 
            this.data.association_system.associations.filter(a => a.id !== id);
        this.notifyChange();
    }

    getAssociations() {
        return this.data.association_system.associations;
    }

    getMemoryIds() {
        return this.data.memory_system.memories.map(m => m.id).filter(id => id);
    }

    getEmotionIds() {
        const emotions = this.data.emotion_system.emotions;
        const additionalEmotions = this.data.emotion_system.additional_emotions || {};
        return [...Object.keys(emotions), ...Object.keys(additionalEmotions)];
    }

    reset() {
        this.data = this.getDefaultData();
        this.notifyChange();
    }

    toYAML() {
        // 数値を適切な形式に変換
        const outputData = JSON.parse(JSON.stringify(this.data));

        // 性格特性を0-1の範囲に変換
        Object.keys(outputData.personality.traits).forEach(trait => {
            outputData.personality.traits[trait] = outputData.personality.traits[trait] / 100;
        });

        // dialogue_instructions と non_dialogue_metadata を YAML オブジェクトに変換
        try {
            outputData.dialogue_instructions = jsyaml.load(this.data.dialogue_instructions_text) || {};
        } catch (e) {
            outputData.dialogue_instructions = this.data.dialogue_instructions_text || {};
        }
        try {
            outputData.non_dialogue_metadata = jsyaml.load(this.data.non_dialogue_metadata_text) || {};
        } catch (e) {
            outputData.non_dialogue_metadata = this.data.non_dialogue_metadata_text || {};
        }
        try {
            outputData.disease_specific_prompts = jsyaml.load(this.data.disease_prompts_text) || {};
        } catch (e) {
            outputData.disease_specific_prompts = this.data.disease_prompts_text || {};
        }

        delete outputData.dialogue_instructions_text;
        delete outputData.non_dialogue_metadata_text;
        delete outputData.disease_prompts_text;

        return jsyaml.dump(outputData, {
            lineWidth: -1,
            noRefs: true,
            sortKeys: false
        });
    }

    fromYAML(yamlString) {
        try {
            const parsedData = jsyaml.load(yamlString);

            // 性格特性を0-100の範囲に変換
            if (parsedData.personality && parsedData.personality.traits) {
                Object.keys(parsedData.personality.traits).forEach(trait => {
                    parsedData.personality.traits[trait] = parsedData.personality.traits[trait] * 100;
                });
            }

            const instructions = parsedData.dialogue_instructions;
            const metadata = parsedData.non_dialogue_metadata;
            const disease = parsedData.disease_specific_prompts;
            delete parsedData.dialogue_instructions;
            delete parsedData.non_dialogue_metadata;
            delete parsedData.disease_specific_prompts;

            this.data = { ...this.getDefaultData(), ...parsedData };
            this.data.dialogue_instructions_text = instructions ? jsyaml.dump(instructions) : '';
            this.data.non_dialogue_metadata_text = metadata ? jsyaml.dump(metadata) : '';
            this.data.disease_prompts_text = disease ? jsyaml.dump(disease) : '';
            this.notifyChange();
            return true;
        } catch (error) {
            console.error('YAML parse error:', error);
            return false;
        }
    }

    notifyChange() {
        const event = new CustomEvent('personaDataChanged', {
            detail: { data: this.data }
        });
        document.dispatchEvent(event);
    }
}
class App {
    constructor() {
        this.personaData = new PersonaData();
        this.uiController = new UIController(this.personaData);
        this.fileHandler = new FileHandler(this.personaData, this.uiController);
        this.currentStep = 1;
        this.editingAssociationId = null;
        this.associationFormData = {};
        this.initializeAssociationModal();
        this.initializeTemplates();
        this.initializeShortcuts();
        this.initializeMedicalSelector();
    }

    initializeAssociationModal() {
        // ラジオボタンの変更を監視
        document.addEventListener('change', (e) => {
            if (e.target.name === 'triggerType') {
                this.updateTriggerDetails(e.target.value);
            } else if (e.target.id === 'responseType') {
                this.updateResponseTargets(e.target.value);
            }
        });

        // 関連強度スライダーの監視
        document.addEventListener('input', (e) => {
            if (e.target.id === 'association-strength') {
                const valueDisplay = e.target.parentNode.querySelector('.slider-value');
                valueDisplay.textContent = e.target.value;
            }
        });

        // モーダル背景クリックで閉じる
        document.addEventListener('click', (e) => {
            if (e.target.id === 'association-modal') {
                this.closeAssociationModal();
            }
            if (e.target.id === 'template-modal') {
                this.closeTemplateModal();
            }
        });
    }

    initializeMedicalSelector() {
        fetch('../../persona_lib/medical/templates/index.json')
            .then(res => res.json())
            .then(data => {
                const select = document.getElementById('medical-template-select');
                if (!select) return;
                data.templates.forEach(t => {
                    const option = document.createElement('option');
                    option.value = t.path;
                    option.textContent = t.name;
                    select.appendChild(option);
                });
            })
            .catch(err => console.error('template list load error', err));
    }

    initializeTemplates() {
        this.templates = [
            {
                id: 'trauma_memory',
                icon: '⚠️',
                title: 'トラウマ的記憶',
                description: '特定の話題が不安や恐怖感情を引き起こす関連性',
                category: 'ネガティブ',
                template: {
                    trigger: {
                        type: 'external',
                        category: 'topics',
                        items: ['事故', '病院', '痛み']
                    },
                    response: {
                        type: 'emotion',
                        id: 'fear',
                        association_strength: 85
                    }
                }
            },
            {
                id: 'warm_childhood',
                icon: '🌸',
                title: 'ほのぼのした思い出',
                description: '子供時代の温かい記憶が喜びの感情を呼び起こす',
                category: 'ポジティブ',
                template: {
                    trigger: {
                        type: 'external',
                        category: 'topics',
                        items: ['子供時代', '家族', '遊び']
                    },
                    response: {
                        type: 'emotion',
                        id: 'joy',
                        association_strength: 75
                    }
                }
            },
            {
                id: 'achievement_pride',
                icon: '🏆',
                title: '達成体験',
                description: '成功や達成の話題が誇りや自信を呼び起こす',
                category: 'ポジティブ',
                template: {
                    trigger: {
                        type: 'external',
                        category: 'topics',
                        items: ['成功', '達成', '賞']
                    },
                    response: {
                        type: 'emotion',
                        id: 'joy',
                        association_strength: 80
                    }
                }
            },
            {
                id: 'failure_shame',
                icon: '😞',
                title: '失敗体験',
                description: '失敗や挫折の話題が恥ずかしさや悲しみを引き起こす',
                category: 'ネガティブ',
                template: {
                    trigger: {
                        type: 'external',
                        category: 'topics',
                        items: ['失敗', '挫折', 'ミス']
                    },
                    response: {
                        type: 'emotion',
                        id: 'sadness',
                        association_strength: 70
                    }
                }
            },
            {
                id: 'nature_peace',
                icon: '🌲',
                title: '自然への愛着',
                description: '自然に関する話題が平穏や喜びをもたらす',
                category: 'ポジティブ',
                template: {
                    trigger: {
                        type: 'external',
                        category: 'topics',
                        items: ['自然', '森', '山', '海']
                    },
                    response: {
                        type: 'emotion',
                        id: 'joy',
                        association_strength: 65
                    }
                }
            },
            {
                id: 'social_anxiety',
                icon: '😰',
                title: '社交不安',
                description: '人との接触や評価場面で不安が高まる',
                category: 'ネガティブ',
                template: {
                    trigger: {
                        type: 'external',
                        category: 'topics',
                        items: ['発表', '人前', '評価', '視線']
                    },
                    response: {
                        type: 'emotion',
                        id: 'fear',
                        association_strength: 80
                    }
                }
            },
            {
                id: 'art_inspiration',
                icon: '🎨',
                title: '芸術的感性',
                description: '芸術や美に触れると感動や創造性が湧く',
                category: 'ポジティブ',
                template: {
                    trigger: {
                        type: 'external',
                        category: 'topics',
                        items: ['音楽', '絵画', '詩', '美']
                    },
                    response: {
                        type: 'emotion',
                        id: 'surprise',
                        association_strength: 70
                    }
                }
            },
            {
                id: 'loss_grief',
                icon: '💔',
                title: '喪失体験',
                description: '別れや喪失の話題が深い悲しみを呼び起こす',
                category: 'ネガティブ',
                template: {
                    trigger: {
                        type: 'external',
                        category: 'topics',
                        items: ['別れ', '死', '喪失', 'さよなら']
                    },
                    response: {
                        type: 'emotion',
                        id: 'sadness',
                        association_strength: 90
                    }
                }
            },
            {
                id: 'learning_curiosity',
                icon: '📚',
                title: '学習への興味',
                description: '知識や学習の話題が好奇心を刺激する',
                category: 'ポジティブ',
                template: {
                    trigger: {
                        type: 'external',
                        category: 'topics',
                        items: ['学習', '知識', '発見', '研究']
                    },
                    response: {
                        type: 'emotion',
                        id: 'surprise',
                        association_strength: 75
                    }
                }
            },
            {
                id: 'injustice_anger',
                icon: '😠',
                title: '不公平への憤り',
                description: '不公平や不正の話題が怒りを引き起こす',
                category: 'ネガティブ',
                template: {
                    trigger: {
                        type: 'external',
                        category: 'topics',
                        items: ['不公平', '不正', '差別', 'いじめ']
                    },
                    response: {
                        type: 'emotion',
                        id: 'anger',
                        association_strength: 85
                    }
                }
            }
        ];
    }

    initializeShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch (e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        this.handleSaveFile();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.handleLoadFile();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.handleNewPersona();
                        break;
                }
            }
        });
    }

    handleNewPersona() {
        if (confirm('新しいペルソナを作成します。現在の内容は失われますがよろしいですか？')) {
            this.personaData.reset();
            this.uiController.showNotification('新しいペルソナを作成しました', 'success');
        }
    }

    async handleLoadFile() {
        await this.fileHandler.loadFile();
    }

    handleSaveFile() {
        const personaName = this.personaData.getData().personal_info.name;
        const filename = personaName ? `${personaName.replace(/\s+/g, '_')}.yaml` : 'persona.yaml';
        this.fileHandler.saveFile(filename);
    }

    handleMergeMedicalTemplate() {
        const select = document.getElementById('medical-template-select');
        if (select && select.value) {
            this.fileHandler.loadMedicalTemplate(select.value);
        }
    }

    // 関連性ネットワーク編集メソッド
    openAssociationModal(associationId = null) {
        this.editingAssociationId = associationId;
        this.currentStep = 1;
        this.associationFormData = {};
        
        // モーダル表示
        const modal = document.getElementById('association-modal');
        modal.classList.add('show');
        
        // フォームリセット
        this.resetAssociationForm();
        this.updateStepDisplay();
        
        if (associationId) {
            // 編集モードの場合、既存データを読み込み
            this.loadAssociationData(associationId);
        }
    }

    closeAssociationModal() {
        const modal = document.getElementById('association-modal');
        modal.classList.remove('show');
        this.resetAssociationForm();
    }

    resetAssociationForm() {
        // ラジオボタンリセット
        document.querySelectorAll('input[name="triggerType"]').forEach(radio => {
            radio.checked = false;
        });
        
        // トリガー詳細クリア
        document.getElementById('trigger-details').innerHTML = '';
        
        // レスポンス設定リセット
        document.getElementById('responseType').value = 'memory';
        document.getElementById('responseTarget').innerHTML = '';
        document.getElementById('changeAmount').value = 0;
        document.getElementById('changeAmountGroup').style.display = 'none';
        document.getElementById('responseDescription').value = '';
        document.getElementById('responseDescGroup').style.display = 'none';
        
        // 関連強度リセット
        document.getElementById('association-strength').value = 70;
        document.querySelector('#association-strength').parentNode.querySelector('.slider-value').textContent = '70';
        
        this.currentStep = 1;
        this.updateStepDisplay();
    }

    updateStepDisplay() {
        // ステップ表示切り替え
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        document.querySelector(`[data-step="${this.currentStep}"]`).classList.add('active');
        
        // ボタン表示制御
        const prevBtn = document.getElementById('prev-step-btn');
        const nextBtn = document.getElementById('next-step-btn');
        const saveBtn = document.getElementById('save-association-btn');
        
        prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
        nextBtn.style.display = this.currentStep < 4 ? 'block' : 'none';
        saveBtn.style.display = this.currentStep === 4 ? 'block' : 'none';
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            this.saveCurrentStepData();
            if (this.currentStep < 4) {
                this.currentStep++;
                this.updateStepDisplay();
                
                if (this.currentStep === 3) {
                    this.updateResponseTargets(document.getElementById('responseType').value);
                }
            }
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                const triggerType = document.querySelector('input[name="triggerType"]:checked');
                if (!triggerType) {
                    this.uiController.showNotification('トリガータイプを選択してください', 'warning');
                    return false;
                }
                return true;
            case 2:
                return this.validateTriggerDetails();
            case 3:
                const responseTarget = document.getElementById('responseTarget').value;
                if (!responseTarget) {
                    this.uiController.showNotification('レスポンス対象を選択してください', 'warning');
                    return false;
                }
                return true;
            default:
                return true;
        }
    }

    validateTriggerDetails() {
        const triggerType = this.associationFormData.triggerType;
        
        if (triggerType === 'external') {
            const items = document.getElementById('external-items')?.value;
            if (!items || !items.trim()) {
                this.uiController.showNotification('トリガーワードを入力してください', 'warning');
                return false;
            }
        } else if (triggerType === 'emotion') {
            const emotionTarget = document.getElementById('emotion-target')?.value;
            if (!emotionTarget) {
                this.uiController.showNotification('対象感情を選択してください', 'warning');
                return false;
            }
        } else if (triggerType === 'memory') {
            const memoryTarget = document.getElementById('memory-target')?.value;
            if (!memoryTarget) {
                this.uiController.showNotification('対象記憶を選択してください', 'warning');
                return false;
            }
        }
        
        return true;
    }

    saveCurrentStepData() {
        switch (this.currentStep) {
            case 1:
                this.associationFormData.triggerType = document.querySelector('input[name="triggerType"]:checked').value;
                break;
            case 2:
                this.saveTriggerDetails();
                break;
            case 3:
                this.associationFormData.responseType = document.getElementById('responseType').value;
                this.associationFormData.responseTarget = document.getElementById('responseTarget').value;
                this.associationFormData.changeAmount = parseFloat(document.getElementById('changeAmount').value) || 0;
                this.associationFormData.responseDescription = document.getElementById('responseDescription').value;
                break;
            case 4:
                this.associationFormData.associationStrength = parseInt(document.getElementById('association-strength').value);
                break;
        }
    }

    saveTriggerDetails() {
        const triggerType = this.associationFormData.triggerType;
        
        if (triggerType === 'external') {
            const category = document.getElementById('external-category')?.value || 'topics';
            const items = document.getElementById('external-items').value
                .split(',').map(item => item.trim()).filter(item => item);
            
            this.associationFormData.trigger = {
                type: 'external',
                category: category,
                items: items
            };
        } else if (triggerType === 'emotion') {
            const emotionId = document.getElementById('emotion-target').value;
            const threshold = parseInt(document.getElementById('emotion-threshold').value);
            
            this.associationFormData.trigger = {
                type: 'emotion',
                id: emotionId,
                threshold: threshold
            };
        } else if (triggerType === 'memory') {
            const memoryId = document.getElementById('memory-target').value;
            
            this.associationFormData.trigger = {
                type: 'memory',
                id: memoryId
            };
        }
    }

    updateTriggerDetails(triggerType) {
        const container = document.getElementById('trigger-details');
        
        if (triggerType === 'external') {
            container.innerHTML = `
                <div class="external-trigger-form">
                    <div class="form-group">
                        <label for="external-category">カテゴリ</label>
                        <select id="external-category">
                            <option value="topics">トピック・単語</option>
                            <option value="interaction_quality">対話の雰囲気</option>
                            <option value="context">文脈情報</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="external-items">トリガーワード（カンマ区切り）</label>
                        <textarea id="external-items" class="trigger-items-input" 
                                 placeholder="例: nature, forest, insects"></textarea>
                        <div class="form-help">
                            会話中にこれらの単語が出現したときにトリガーされます
                        </div>
                    </div>
                </div>
            `;
        } else if (triggerType === 'emotion') {
            const emotionIds = this.personaData.getEmotionIds();
            const emotionOptions = emotionIds.map(id => 
                `<option value="${id}">${id}</option>`
            ).join('');
            
            container.innerHTML = `
                <div class="emotion-trigger-form">
                    <div class="form-group">
                        <label for="emotion-target">対象感情</label>
                        <select id="emotion-target">
                            <option value="">選択してください</option>
                            ${emotionOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="emotion-threshold">閾値</label>
                        <div class="slider-container">
                            <input type="range" id="emotion-threshold" 
                                   class="slider-input" min="0" max="100" value="60">
                            <span class="slider-value">60</span>
                        </div>
                        <div class="form-help">
                            この値以上になったときにトリガーされます
                        </div>
                    </div>
                </div>
            `;
            
            // 閾値スライダーのイベントリスナー追加
            document.getElementById('emotion-threshold').addEventListener('input', (e) => {
                e.target.parentNode.querySelector('.slider-value').textContent = e.target.value;
            });
        } else if (triggerType === 'memory') {
            const memoryIds = this.personaData.getMemoryIds();
            const memoryOptions = memoryIds.map(id => 
                `<option value="${id}">${id}</option>`
            ).join('');
            
            container.innerHTML = `
                <div class="memory-trigger-form">
                    <div class="form-group">
                        <label for="memory-target">対象記憶</label>
                        <select id="memory-target">
                            <option value="">選択してください</option>
                            ${memoryOptions}
                        </select>
                    </div>
                    <div class="form-help">
                        この記憶が想起されたときにトリガーされます
                    </div>
                </div>
            `;
        }
    }

    updateResponseTargets(responseType) {
        const select = document.getElementById('responseTarget');
        const changeGroup = document.getElementById('changeAmountGroup');
        const descGroup = document.getElementById('responseDescGroup');

        if (responseType === 'memory') {
            const memoryIds = this.personaData.getMemoryIds();
            select.innerHTML = '<option value="">選択してください</option>' +
                memoryIds.map(id => `<option value="${id}">${id}</option>`).join('');
            changeGroup.style.display = 'none';
            descGroup.style.display = 'none';
        } else if (responseType === 'emotion') {
            const emotionIds = this.personaData.getEmotionIds();
            select.innerHTML = '<option value="">選択してください</option>' +
                emotionIds.map(id => `<option value="${id}">${id}</option>`).join('');
            changeGroup.style.display = 'none';
            descGroup.style.display = 'none';
        } else if (responseType === 'emotion_baseline_change') {
            const emotionIds = this.personaData.getEmotionIds();
            select.innerHTML = '<option value="">選択してください</option>' +
                emotionIds.map(id => `<option value="${id}">${id}</option>`).join('');
            changeGroup.style.display = 'block';
            descGroup.style.display = 'block';
        } else if (responseType === 'special_ability_activation') {
            select.innerHTML = '<option value="">入力してください</option>';
            changeGroup.style.display = 'block';
            descGroup.style.display = 'block';
        }
    }

    saveAssociation() {
        this.saveCurrentStepData();
        
        const association = {
            trigger: this.associationFormData.trigger,
            response: {
                type: this.associationFormData.responseType,
                id: this.associationFormData.responseTarget,
                association_strength: this.associationFormData.associationStrength,
                change_amount: this.associationFormData.changeAmount,
                description: this.associationFormData.responseDescription
            }
        };
        
        if (this.editingAssociationId) {
            this.personaData.updateAssociation(this.editingAssociationId, association);
            this.uiController.showNotification('関連性を更新しました', 'success');
        } else {
            this.personaData.addAssociation(association);
            this.uiController.showNotification('関連性を追加しました', 'success');
        }
        
        this.closeAssociationModal();
    }

    editAssociation(id) {
        this.openAssociationModal(id);
    }

    deleteAssociation(id) {
        if (confirm('この関連性を削除しますか？')) {
            this.personaData.deleteAssociation(id);
            this.uiController.showNotification('関連性を削除しました', 'success');
        }
    }

    loadAssociationData(id) {
        const associations = this.personaData.getAssociations();
        const association = associations.find(a => a.id === id);

        if (!association) {
            return;
        }

        // ステップ1: トリガータイプと詳細を設定
        const triggerType = association.trigger.type;
        const triggerRadio = document.querySelector(`input[name="triggerType"][value="${triggerType}"]`);
        if (triggerRadio) {
            triggerRadio.checked = true;
        }
        this.updateTriggerDetails(triggerType);
        this.fillTriggerDetails(association.trigger);

        // ステップ3: レスポンス設定
        document.getElementById('responseType').value = association.response.type;
        this.updateResponseTargets(association.response.type);
        const targetSelect = document.getElementById('responseTarget');
        if (targetSelect) {
            targetSelect.value = association.response.id || '';
        }
        if (association.response.change_amount !== undefined) {
            document.getElementById('changeAmount').value = association.response.change_amount;
            document.getElementById('changeAmountGroup').style.display = 'block';
        }
        if (association.response.description !== undefined) {
            document.getElementById('responseDescription').value = association.response.description;
            document.getElementById('responseDescGroup').style.display = 'block';
        }

        // ステップ4: 強度
        document.getElementById('association-strength').value = association.response.association_strength;
        document.querySelector('#association-strength').parentNode.querySelector('.slider-value').textContent = association.response.association_strength;

        // フォームデータにも保存
        this.associationFormData = {
            triggerType: triggerType,
            trigger: association.trigger,
            responseType: association.response.type,
            responseTarget: association.response.id,
            changeAmount: association.response.change_amount || 0,
            responseDescription: association.response.description || '',
            associationStrength: association.response.association_strength
        };
    }

    // テンプレート関連メソッド
    openTemplateModal() {
        const modal = document.getElementById('template-modal');
        modal.classList.add('show');
        this.renderTemplateGrid();
    }

    closeTemplateModal() {
        const modal = document.getElementById('template-modal');
        modal.classList.remove('show');
    }

    renderTemplateGrid() {
        const grid = document.getElementById('template-grid');
        grid.innerHTML = this.templates.map(template => `
            <div class="template-card" onclick="app.selectTemplate('${template.id}')">
                <div class="template-card-header">
                    <span class="template-icon">${template.icon}</span>
                    <span class="template-title">${template.title}</span>
                </div>
                <div class="template-description">
                    ${template.description}
                </div>
                <div class="template-preview">
                    ${this.getTemplatePreview(template.template)}
                </div>
                <div class="template-tag">${template.category}</div>
            </div>
        `).join('');
    }

    getTemplatePreview(template) {
        const trigger = template.trigger;
        const response = template.response;
        
        let triggerText = '';
        if (trigger.type === 'external') {
            triggerText = `🏷️ [${trigger.items.slice(0, 2).join(', ')}...]`;
        } else if (trigger.type === 'emotion') {
            triggerText = `😊 ${trigger.id} ≥ ${trigger.threshold}`;
        } else if (trigger.type === 'memory') {
            triggerText = `💭 ${trigger.id}`;
        }
        
        const responseIcon = response.type === 'memory' ? '💭' : '😊';
        const responseText = `${responseIcon} ${response.id}`;
        
        return `${triggerText} → ${responseText} (${response.association_strength})`;
    }

    selectTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (template) {
            this.closeTemplateModal();
            this.applyTemplate(template.template);
        }
    }

    applyTemplate(template) {
        // テンプレートを関連性フォームに適用
        this.openAssociationModal();
        
        // ステップ1: トリガータイプを設定
        setTimeout(() => {
            const triggerTypeRadio = document.querySelector(`input[name="triggerType"][value="${template.trigger.type}"]`);
            if (triggerTypeRadio) {
                triggerTypeRadio.checked = true;
                this.updateTriggerDetails(template.trigger.type);
                
                // トリガー詳細を設定
                setTimeout(() => {
                    this.fillTriggerDetails(template.trigger);
                }, 100);
            }
            
            // レスポンス設定
            setTimeout(() => {
                const responseTypeSelect = document.getElementById('responseType');
                const associationStrengthSlider = document.getElementById('association-strength');
                
                if (responseTypeSelect) {
                    responseTypeSelect.value = template.response.type;
                    this.updateResponseTargets(template.response.type);
                    
                    setTimeout(() => {
                        const responseTargetSelect = document.getElementById('responseTarget');
                        if (responseTargetSelect) {
                            responseTargetSelect.value = template.response.id;
                        }
                    }, 50);
                }
                
                if (associationStrengthSlider) {
                    associationStrengthSlider.value = template.response.association_strength;
                    associationStrengthSlider.parentNode.querySelector('.slider-value').textContent = template.response.association_strength;
                }
            }, 150);
        }, 100);
        
        // フォームデータに保存
        this.associationFormData = {
            triggerType: template.trigger.type,
            trigger: template.trigger,
            responseType: template.response.type,
            responseTarget: template.response.id,
            associationStrength: template.response.association_strength
        };
        
        // 通知
        this.uiController.showNotification('テンプレートを適用しました。各ステップで内容を確認・調整して保存してください。', 'success');
    }

    fillTriggerDetails(trigger) {
        if (trigger.type === 'external') {
            const categorySelect = document.getElementById('external-category');
            const itemsTextarea = document.getElementById('external-items');
            
            if (categorySelect && trigger.category) {
                categorySelect.value = trigger.category;
            }
            if (itemsTextarea && trigger.items) {
                itemsTextarea.value = trigger.items.join(', ');
            }
        } else if (trigger.type === 'emotion') {
            const emotionSelect = document.getElementById('emotion-target');
            const thresholdSlider = document.getElementById('emotion-threshold');
            
            if (emotionSelect && trigger.id) {
                emotionSelect.value = trigger.id;
            }
            if (thresholdSlider && trigger.threshold) {
                thresholdSlider.value = trigger.threshold;
                thresholdSlider.parentNode.querySelector('.slider-value').textContent = trigger.threshold;
            }
        } else if (trigger.type === 'memory') {
            const memorySelect = document.getElementById('memory-target');
            
            if (memorySelect && trigger.id) {
                memorySelect.value = trigger.id;
            }
        }
    }
}

const app = new App();
window.app = app;
