import { create } from 'zustand';

export type DialogVariant = 'danger' | 'warning' | 'info';

interface DialogOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: DialogVariant;
    /** Si défini, affiche un champ texte (mode "prompt") */
    inputLabel?: string;
    inputPlaceholder?: string;
}

interface ConfirmState {
    open: boolean;
    options: DialogOptions | null;
    inputValue: string;
    resolve: ((value: boolean | string | null) => void) | null;
    /** Lance un dialogue confirm → retourne true/false */
    confirm: (opts: DialogOptions) => Promise<boolean>;
    /** Lance un dialogue prompt → retourne la valeur saisie ou null si annulé */
    prompt: (opts: DialogOptions) => Promise<string | null>;
    _accept: () => void;
    _cancel: () => void;
    _setInput: (v: string) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
    open: false,
    options: null,
    inputValue: '',
    resolve: null,

    confirm: (opts) =>
        new Promise<boolean>((resolve) => {
            set({ open: true, options: opts, inputValue: '', resolve: resolve as any });
        }),

    prompt: (opts) =>
        new Promise<string | null>((resolve) => {
            set({
                open: true,
                options: { ...opts, inputLabel: opts.inputLabel || 'Valeur' },
                inputValue: '',
                resolve: resolve as any,
            });
        }),

    _accept: () => {
        const { resolve, options, inputValue } = get();
        if (!resolve) return;
        // Si mode prompt, retourne la saisie; sinon retourne true
        resolve(options?.inputLabel !== undefined ? inputValue : true);
        set({ open: false, options: null, resolve: null, inputValue: '' });
    },

    _cancel: () => {
        const { resolve, options } = get();
        if (!resolve) return;
        resolve(options?.inputLabel !== undefined ? null : false);
        set({ open: false, options: null, resolve: null, inputValue: '' });
    },

    _setInput: (v) => set({ inputValue: v }),
}));

/** Helpers utilisables hors de React (dans les handlers) */
export const dialog = {
    confirm: (opts: DialogOptions) => useConfirmStore.getState().confirm(opts),
    prompt: (opts: DialogOptions) => useConfirmStore.getState().prompt(opts),
};
