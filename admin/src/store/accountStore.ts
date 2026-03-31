import { create } from 'zustand';
import CryptoJS from 'crypto-js';
import {
  AccountRecord,
  LogRecord,
  createAccount,
  deleteAccount,
  fetchAccounts,
  fetchLogs,
  runFavorite,
  updateAccount,
} from '@/services/api';

const cryptoSecret = process.env.UMI_APP_CRYPTO_SECRET || 'cbg-auto-collect-secret';

function isEncrypted(value: string) {
  return typeof value === 'string' && value.includes('U2FsdGVkX1');
}

function encryptValue(value: string) {
  return isEncrypted(value) ? value : CryptoJS.AES.encrypt(value, cryptoSecret).toString();
}

type AccountFormValues = {
  name: string;
  username: string;
  password?: string;
  remark?: string;
  isDefault?: boolean;
};

type StoreState = {
  accounts: AccountRecord[];
  logs: LogRecord[];
  loading: boolean;
  submitting: boolean;
  favoriteRunning: boolean;
  lastRunResult?: string;
  loadInitialData: () => Promise<void>;
  saveAccount: (values: AccountFormValues, id?: number) => Promise<void>;
  removeAccount: (id: number) => Promise<void>;
  executeFavorite: (payload: { url: string; accountIds?: number[]; headless?: boolean }) => Promise<void>;
  refreshLogs: () => Promise<void>;
};

export const useAccountStore = create<StoreState>((set, get) => ({
  accounts: [],
  logs: [],
  loading: false,
  submitting: false,
  favoriteRunning: false,
  lastRunResult: undefined,
  loadInitialData: async () => {
    set({ loading: true });

    try {
      const [accounts, logs] = await Promise.all([fetchAccounts(), fetchLogs()]);
      set({ accounts, logs });
    } finally {
      set({ loading: false });
    }
  },
  saveAccount: async (values, id) => {
    set({ submitting: true });

    const payload = {
      name: values.name,
      username: encryptValue(values.username),
      remark: values.remark,
      isDefault: values.isDefault,
      ...(values.password ? { password: encryptValue(values.password) } : {}),
    };

    try {
      if (id) {
        await updateAccount(id, payload);
      } else {
        await createAccount(payload);
      }

      await get().loadInitialData();
    } finally {
      set({ submitting: false });
    }
  },
  removeAccount: async (id) => {
    set({ submitting: true });

    try {
      await deleteAccount(id);
      await get().loadInitialData();
    } finally {
      set({ submitting: false });
    }
  },
  executeFavorite: async (payload) => {
    set({ favoriteRunning: true, lastRunResult: undefined });

    try {
      const response = await runFavorite(payload);
      const summary = response.results
        .map((item) => `${item.accountName}: ${item.status}${item.error ? ` (${item.error})` : ''}`)
        .join('\n');

      set({ lastRunResult: summary || '任务已执行' });
      await get().refreshLogs();
    } finally {
      set({ favoriteRunning: false });
    }
  },
  refreshLogs: async () => {
    const logs = await fetchLogs();
    set({ logs });
  },
}));
