import jsyaml from 'js-yaml';
import { validatePersona } from './validator.js';

export default class FileHandler {
    constructor(personaData, uiController) {
        this.personaData = personaData;
        this.uiController = uiController;
    }

    async loadFile() {
        return new Promise((resolve) => {
            const input = document.getElementById('file-input');

            const cleanup = () => {
                input.removeEventListener('change', onChange);
                input.removeEventListener('focusout', onFocusOut);
            };

            const onChange = (e) => {
                const file = e.target.files[0];
                cleanup();
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const content = e.target.result;
                        if (this.personaData.fromYAML(content)) {
                            this.uiController.showNotification('ファイルを正常に読み込みました', 'success');
                            input.value = '';
                            resolve(true);
                        } else {
                            this.uiController.showNotification('ファイルの読み込みに失敗しました', 'error');
                            input.value = '';
                            resolve(false);
                        }
                    };
                    reader.readAsText(file);
                } else {
                    input.value = '';
                    this.uiController.showNotification('ファイルの選択がキャンセルされました', 'error');
                    resolve(false);
                }
            };

            const onFocusOut = () => {
                // ユーザーがダイアログをキャンセルした場合にも Promise を解決する
                if (!input.files || input.files.length === 0) {
                    cleanup();
                    input.value = '';
                    this.uiController.showNotification('ファイルの選択がキャンセルされました', 'error');
                    resolve(false);
                }
            };

            input.addEventListener('change', onChange, { once: true });
            input.addEventListener('focusout', onFocusOut, { once: true });
            input.click();
        });
    }

    async loadMedicalTemplate(relativePath) {
        const basePath = '../../persona_lib/medical/';
        try {
            const response = await fetch(basePath + relativePath);
            const content = await response.text();
            const templateData = jsyaml.load(content);
            this.personaData.mergeDiseaseTemplate(templateData);
            this.uiController.showNotification('医療テンプレートを読み込みました', 'success');
        } catch (error) {
            console.error('Template load error:', error);
            this.uiController.showNotification(
                `テンプレートの読み込みに失敗しました: ${error.message}`,
                'error'
            );
        }
    }

    saveFile(filename = 'persona.yaml') {
        const yamlContent = this.personaData.toYAML();
        let profile;
        try {
            profile = jsyaml.load(yamlContent);
        } catch (e) {
            this.uiController.showNotification('YAMLの生成に失敗しました', 'error');
            return;
        }

        const result = validatePersona(profile);
        if (!result.valid) {
            this.uiController.showNotification(result.errors.join('\n'), 'error');
            return;
        }

        const blob = new Blob([yamlContent], { type: 'text/yaml' });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.uiController.showNotification('ファイルを保存しました', 'success');
    }
}
