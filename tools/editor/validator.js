export function validatePersona(profile) {
    const errors = [];

    // collect emotion IDs
    const emotionIds = new Set();
    if (profile.emotion_system) {
        if (profile.emotion_system.emotions) {
            Object.keys(profile.emotion_system.emotions).forEach(id => emotionIds.add(id));
        }
        if (profile.emotion_system.additional_emotions) {
            Object.keys(profile.emotion_system.additional_emotions).forEach(id => emotionIds.add(id));
        }
        if (profile.emotion_system.compound_emotions) {
            Object.keys(profile.emotion_system.compound_emotions).forEach(id => emotionIds.add(id));
        }
    }

    // collect memory IDs
    const memoryIds = new Set();
    if (profile.memory_system && Array.isArray(profile.memory_system.memories)) {
        profile.memory_system.memories.forEach(m => {
            if (m && m.id) {
                memoryIds.add(m.id);
            }
        });
    }

    // association reference validation
    if (profile.association_system && Array.isArray(profile.association_system.associations)) {
        profile.association_system.associations.forEach((assoc, i) => {
            const index = i + 1;
            const trigger = assoc.trigger || {};
            if (trigger.type === 'memory' && trigger.id && !memoryIds.has(trigger.id)) {
                errors.push(`関連性 #${index}: トリガーが存在しない記憶ID '${trigger.id}' を参照しています`);
            }
            if (trigger.type === 'emotion' && trigger.id && !emotionIds.has(trigger.id)) {
                errors.push(`関連性 #${index}: トリガーが存在しない感情ID '${trigger.id}' を参照しています`);
            }
            if (trigger.operator && Array.isArray(trigger.conditions)) {
                trigger.conditions.forEach((condition, j) => {
                    const cIndex = j + 1;
                    if (condition.type === 'memory' && condition.id && !memoryIds.has(condition.id)) {
                        errors.push(`関連性 #${index}, 条件 #${cIndex}: 条件が存在しない記憶ID '${condition.id}' を参照しています`);
                    }
                    if (condition.type === 'emotion' && condition.id && !emotionIds.has(condition.id)) {
                        errors.push(`関連性 #${index}, 条件 #${cIndex}: 条件が存在しない感情ID '${condition.id}' を参照しています`);
                    }
                });
            }
            const response = assoc.response || {};
            if (response.type === 'memory' && response.id && !memoryIds.has(response.id)) {
                errors.push(`関連性 #${index}: レスポンスが存在しない記憶ID '${response.id}' を参照しています`);
            }
            if (response.type === 'emotion' && response.id && !emotionIds.has(response.id)) {
                errors.push(`関連性 #${index}: レスポンスが存在しない感情ID '${response.id}' を参照しています`);
            }
        });
    }

    // current_emotion_state consistency
    if (profile.current_emotion_state) {
        Object.keys(profile.current_emotion_state).forEach(id => {
            if (!emotionIds.has(id)) {
                errors.push(`current_emotion_stateの感情 '${id}' は感情システムで定義されていません`);
            }
        });
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
