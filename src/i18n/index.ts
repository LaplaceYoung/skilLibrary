import { type LocaleType, useSkillStore } from '../store';
import { MESSAGES, SUPPORTED_LOCALES, type MessageKey } from './messages';

const FALLBACK_LOCALE: LocaleType = 'en-US';

function interpolate(template: string, vars?: Record<string, string | number>): string {
    if (!vars) return template;

    return template.replace(/\{\{(\w+)\}\}/g, (_all, key: string) => {
        const value = vars[key];
        if (value === undefined || value === null) return '';
        return String(value);
    });
}

function resolveLocale(locale: LocaleType): LocaleType {
    return SUPPORTED_LOCALES.includes(locale) ? locale : FALLBACK_LOCALE;
}

export function translate(
    locale: LocaleType,
    key: MessageKey,
    vars?: Record<string, string | number>
): string {
    const safeLocale = resolveLocale(locale);
    const localized = MESSAGES[safeLocale][key] || MESSAGES[FALLBACK_LOCALE][key] || key;
    return interpolate(localized, vars);
}

export function useI18n() {
    const locale = useSkillStore((state) => state.activeLocale);
    const setLocale = useSkillStore((state) => state.setLocale);

    return {
        locale,
        setLocale,
        t: (key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars)
    };
}
