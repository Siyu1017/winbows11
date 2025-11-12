const PREFERENCE_KEY = 'WINBOWS_DEVTOOL_PREFERENCE';
const DATA_KEY = 'WINBOWS_DEVTOOL_DATA';
const preference = {
    save: (k: string, v: any) => {
        const preferences = JSON.parse(localStorage.getItem(PREFERENCE_KEY) || '{}');
        preferences[k] = v;
        localStorage.setItem(PREFERENCE_KEY, JSON.stringify(preferences));
    },
    load: (j: string | Record<string, any>) => {
        if (typeof j === 'string') {
            const preferences = JSON.parse(j);
            localStorage.setItem(PREFERENCE_KEY, JSON.stringify(preferences));
        } else if (typeof j === 'object') {
            const preferences = j;
            localStorage.setItem(PREFERENCE_KEY, JSON.stringify(preferences));
        }
    },
    get: (k: string) => {
        const preferences = JSON.parse(localStorage.getItem(PREFERENCE_KEY) || '{}');
        return preferences[k];
    }
}

const data = {
    save: (k: string, v: any) => {
        const datas = JSON.parse(localStorage.getItem(DATA_KEY) || '{}');
        datas[k] = v;
        localStorage.setItem(DATA_KEY, JSON.stringify(datas));
    },
    get: (k: string) => {
        const datas = JSON.parse(localStorage.getItem(DATA_KEY) || '{}');
        return datas[k];
    }
}

export { preference as UserPreference, data as UserData };
