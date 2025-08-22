export default class UIController {
    constructor(personaData) {
        this.personaData = personaData;
        this.initializeUI();
        this.bindEvents();
    }

    initializeUI() {
        this.updateAllUI();
    }

    bindEvents() {
        // タブ切り替え
        document.addEventListener('click', (e) => {
            if (e.target.matches('.tab-btn')) {
                this.showTab(e.target.dataset.tab);
            }
            if (e.target.matches('.suggestion')) {
                const snippet = e.target.dataset.snippet || '';
                const textarea = e.target.closest('#instructions-tab') ?
                    document.getElementById('instructions-text') :
                    document.getElementById('metadata-text');
                this.insertSnippet(textarea, snippet);
            }
        });

        // データ変更イベント
        document.addEventListener('input', (e) => {
            if (e.target.matches('.persona-input')) {
                this.handlePersonalInfoChange(e);
            } else if (e.target.matches('.slider-input')) {
                this.handleSliderChange(e);
            } else if (e.target.matches('.instructions-input')) {
                this.handleDialogueInputChange(e);
            } else if (e.target.matches('.metadata-input')) {
                this.handleMetadataInputChange(e);
            }
        });

        document.addEventListener('dragstart', (e) => {
            if (e.target.matches('.suggestion')) {
                e.dataTransfer.setData('text/plain', e.target.dataset.snippet || '');
            }
        });

        ['instructions-text', 'metadata-text'].forEach(id => {
            const area = document.getElementById(id);
            area.addEventListener('dragover', e => e.preventDefault());
            area.addEventListener('drop', e => {
                e.preventDefault();
                const text = e.dataTransfer.getData('text/plain');
                if (text) {
                    this.insertSnippet(area, text);
                }
            });
            area.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    const start = area.selectionStart;
                    const indentMatch = area.value.slice(0, start).split('\n').pop().match(/^\s+/);
                    const indent = indentMatch ? indentMatch[0] : '';
                    setTimeout(() => {
                        const pos = area.selectionStart;
                        area.setRangeText(indent, pos, pos, 'end');
                        area.selectionStart = area.selectionEnd = pos + indent.length;
                    }, 0);
                }
            });
        });

        // データ変更通知を受信
        document.addEventListener('personaDataChanged', () => {
            this.updateAllUI();
        });
    }

    showTab(tabName) {
        // すべてのタブボタンとパネルを非アクティブに
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

        // 指定されたタブをアクティブに
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.querySelector(`#${tabName}-tab`).classList.add('active');

        // プレビュータブの場合は更新
        if (tabName === 'preview') {
            this.updatePreview();
        }
    }

    handlePersonalInfoChange(e) {
        const { id, value } = e.target;
        
        if (id === 'persona-name') {
            this.personaData.updatePersonalInfo({ name: value });
        } else if (id === 'persona-age') {
            this.personaData.updatePersonalInfo({ age: value ? parseInt(value) : null });
        } else if (id === 'persona-gender') {
            this.personaData.updatePersonalInfo({ gender: value });
        } else if (id === 'persona-occupation') {
            this.personaData.updatePersonalInfo({ occupation: value });
        } else if (id === 'persona-background') {
            this.personaData.updateBackground(value);
        }
    }

    handleSliderChange(e) {
        const { id, value } = e.target;
        const numValue = parseInt(value);

        // スライダー値表示を更新
        const valueDisplay = e.target.parentNode.querySelector('.slider-value');
        
        if (id.includes('-slider')) {
            const traitName = id.replace('-slider', '');
            
            if (['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'].includes(traitName)) {
                valueDisplay.textContent = numValue + '%';
                this.personaData.updatePersonality({ [traitName]: numValue });
            } else if (['joy', 'sadness', 'anger', 'fear', 'disgust', 'surprise'].includes(traitName)) {
                valueDisplay.textContent = numValue.toString();
                this.personaData.updateEmotionSystem({ [traitName]: numValue });
            }
        }
    }

    handleDialogueInputChange(e) {
        const { id, value } = e.target;
        if (id === 'instructions-text') {
            this.personaData.updateDialogueText(value);
        }
    }

    handleMetadataInputChange(e) {
        const { id, value } = e.target;
        if (id === 'metadata-text') {
            this.personaData.updateMetadataText(value);
        }
    }

    updateAllUI() {
        const data = this.personaData.getData();
        this.updatePersonalInfoUI(data);
        this.updatePersonalityUI(data);
        this.updateEmotionSystemUI(data);
        this.updateAssociationsUI(data);
        this.updateDialogueInstructionsUI(data);
        this.updateMetadataUI(data);
    }

    updatePersonalInfoUI(data) {
        document.getElementById('persona-name').value = data.personal_info.name || '';
        document.getElementById('persona-age').value = data.personal_info.age || '';
        document.getElementById('persona-gender').value = data.personal_info.gender || '';
        document.getElementById('persona-occupation').value = data.personal_info.occupation || '';
        document.getElementById('persona-background').value = data.background || '';
    }

    updatePersonalityUI(data) {
        const traits = data.personality.traits;
        Object.keys(traits).forEach(trait => {
            const slider = document.getElementById(`${trait}-slider`);
            const valueDisplay = slider.parentNode.querySelector('.slider-value');
            slider.value = traits[trait];
            valueDisplay.textContent = Math.round(traits[trait]) + '%';
        });
    }

    updateEmotionSystemUI(data) {
        const emotions = data.emotion_system.emotions;
        Object.keys(emotions).forEach(emotion => {
            const slider = document.getElementById(`${emotion}-slider`);
            const valueDisplay = slider.parentNode.querySelector('.slider-value');
            slider.value = emotions[emotion].baseline;
            valueDisplay.textContent = emotions[emotion].baseline.toString();
        });
    }

    updateAssociationsUI(data) {
        const associations = data.association_system.associations;
        const tbody = document.getElementById('associations-tbody');
        const emptyState = document.getElementById('associations-empty');
        
        if (associations.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        tbody.innerHTML = associations.map((assoc, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${assoc.id}</td>
                <td>${this.renderTrigger(assoc.trigger)}</td>
                <td>${this.renderResponse(assoc.response)}</td>
                <td>${this.renderStrength(assoc.response.association_strength)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="app.editAssociation(${assoc.id})" title="編集">
                            ✏️
                        </button>
                        <button class="btn-icon" onclick="app.deleteAssociation(${assoc.id})" title="削除">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    updateDialogueInstructionsUI(data) {
        document.getElementById('instructions-text').value = data.dialogue_instructions_text || '';
    }

    updateMetadataUI(data) {
        document.getElementById('metadata-text').value = data.non_dialogue_metadata_text || '';
    }

    renderTrigger(trigger) {
        if (trigger.type === 'external') {
            const items = trigger.items ? trigger.items.slice(0, 3).join(', ') : '';
            const more = trigger.items && trigger.items.length > 3 ? '...' : '';
            return `
                <div class="trigger-display">
                    <span class="trigger-type-icon">🏷️</span>
                    <div>
                        <div class="trigger-details">[${items}${more}]</div>
                    </div>
                </div>
            `;
        } else if (trigger.type === 'emotion') {
            return `
                <div class="trigger-display">
                    <span class="trigger-type-icon">😊</span>
                    <div>
                        <div>${trigger.id}</div>
                        <div class="trigger-details">≥ ${trigger.threshold}</div>
                    </div>
                </div>
            `;
        } else if (trigger.type === 'memory') {
            return `
                <div class="trigger-display">
                    <span class="trigger-type-icon">💭</span>
                    <div>
                        <div>${trigger.id}</div>
                    </div>
                </div>
            `;
        }
        return 'Unknown';
    }

    renderResponse(response) {
        let icon = '💭';
        if (response.type === 'emotion' || response.type === 'emotion_baseline_change') {
            icon = '😊';
        } else if (response.type === 'special_ability_activation') {
            icon = '⚡';
        }
        const change = response.change_amount !== undefined ? ` (${response.change_amount})` : '';
        return `
            <div class="response-display">
                <span class="response-type-icon">${icon}</span>
                <div>${response.id}${change}</div>
            </div>
        `;
    }

    renderStrength(strength) {
        const bars = Math.floor(strength / 10);
        const filled = '■'.repeat(bars);
        const empty = '□'.repeat(10 - bars);
        return `<div class="strength-bar">${filled}${empty} ${strength}</div>`;
    }

    updatePreview() {
        const yamlContent = this.personaData.toYAML();
        document.getElementById('yaml-preview').textContent = yamlContent;
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        
        const container = document.getElementById('notifications');
        container.appendChild(notification);

        setTimeout(() => {
            container.removeChild(notification);
        }, 5000);
    }

    insertSnippet(textarea, snippet) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.setRangeText(snippet, start, end, 'end');
        textarea.focus();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
}
