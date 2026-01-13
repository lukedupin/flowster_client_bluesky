import { create } from 'zustand'

export const useStore = create(set => ({
    csrf_token: "",
    setCsrfIfEmpty: (csrf) => set( state => ((state.csrf_token === "" && csrf !== "")? {csrf_token: csrf}: {})),

    usr_info: {},
    setUsrInfo: (usr_info) => set( state => ({ usr_info })),

    cache: {},
    setCache: (cache) => set( state => ({ cache: { ...state.cache, ...cache } })),
}))
