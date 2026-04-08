/**
 * Message Formatter
 *
 * Formats messages using i18n support.
 * Currently uses Spanish as primary language with English fallback.
 */

import { messages, DEFAULT_LANGUAGE, Language, Messages } from './messages';

export class MessageFormatter {
  private currentLanguage: Language;

  constructor(language: Language = DEFAULT_LANGUAGE) {
    this.currentLanguage = language;
  }

  /**
   * Set the current language
   */
  setLanguage(language: Language): void {
    this.currentLanguage = language;
  }

  /**
   * Get the current language
   */
  getLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Get messages for current language
   */
  getMessages(): Messages {
    return messages[this.currentLanguage] || messages[DEFAULT_LANGUAGE];
  }

  /**
   * Get a message by key path (e.g., 'errors.serviceNotFound')
   */
  get(key: string): string {
    const parts = key.split('.');
    let value: unknown = this.getMessages();

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return key; // Return key as fallback
      }
    }

    return typeof value === 'string' ? value : key;
  }

  /**
   * Format a message with placeholders
   * Example: format('Hello {name}', { name: 'World' })
   */
  format(template: string, placeholders: Record<string, string | number>): string {
    let result = template;
    for (const [key, value] of Object.entries(placeholders)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }
    return result;
  }

  /**
   * Get and format a message by key
   */
  getFormat(key: string, placeholders: Record<string, string | number>): string {
    return this.format(this.get(key), placeholders);
  }
}

// Singleton instance for default use
let defaultFormatter: MessageFormatter | null = null;

/**
 * Get the default message formatter
 */
export function getMessageFormatter(): MessageFormatter {
  if (!defaultFormatter) {
    defaultFormatter = new MessageFormatter(DEFAULT_LANGUAGE);
  }
  return defaultFormatter;
}

/**
 * Quick access to a message
 */
export function t(key: string, placeholders?: Record<string, string | number>): string {
  const formatter = getMessageFormatter();
  if (placeholders) {
    return formatter.getFormat(key, placeholders);
  }
  return formatter.get(key);
}
