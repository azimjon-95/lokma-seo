// src/types/telegram.d.ts

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: Record<string, unknown>;
        version?: string;
        platform?: string;
        colorScheme?: string;
        themeParams?: Record<string, string>;
        isExpanded?: boolean;
        viewportHeight?: number;
        viewportStableHeight?: number;
        headerColor?: string;
        backgroundColor?: string;
        ready?: () => void;
        expand?: () => void;
        close?: () => void;
        enableClosingConfirmation?: () => void;
        disableClosingConfirmation?: () => void;
        onEvent?: (eventType: string, eventHandler: () => void) => void;
        offEvent?: (eventType: string, eventHandler: () => void) => void;
        sendData?: (data: string) => void;
        switchInlineQuery?: (query: string, choose_chat_types?: string[]) => void;
        openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink?: (url: string) => void;
        openInvoice?: (url: string, callback?: (status: string) => void) => void;
        showPopup?: (params: Record<string, unknown>, callback?: (id: string) => void) => void;
        showAlert?: (message: string, callback?: () => void) => void;
        showConfirm?: (message: string, callback?: (confirmed: boolean) => void) => void;
        showScanQrPopup?: (params: Record<string, unknown>, callback?: (text: string) => boolean) => void;
        closeScanQrPopup?: () => void;
        readTextFromClipboard?: (callback?: (text: string) => void) => void;
        requestWriteAccess?: (callback?: (allowed: boolean) => void) => void;
        requestContact?: (callback?: (sent: boolean, shared?: boolean) => void) => void;
        invokeCustomMethod?: (method: string, params: Record<string, unknown>, callback?: (result: unknown) => void) => void;
        HapticFeedback?: Record<string, unknown>;
        CloudStorage?: Record<string, unknown>;
        BiometricManager?: Record<string, unknown>;
      };
    };
  }
}

export {};