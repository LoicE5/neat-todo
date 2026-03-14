import { userGetResponse } from "./interfaces"

const isBrowser = typeof window !== 'undefined'

const storage = {
    clear(): void {
        if(!isBrowser) return
        window.sessionStorage.clear()
    },
    jwt: {
        save(token: string): void {
            if(!isBrowser) return
            window.sessionStorage.setItem(`jwt`, token)
        },
        load(bearer: boolean = true): string {
            if(!isBrowser) return bearer ? 'Bearer ' : ''
            const token: string = window.sessionStorage.getItem(`jwt`) || ''
            if(bearer)
                return `Bearer ${token}`
            return token
        },
        exists(): boolean {
            if(!isBrowser) return false
            const token: string | null = window.sessionStorage.getItem(`jwt`)
            if(token === "null" || token === "undefined")
                return false
            return !!token
        }
    },
    user: {
        save(user: userGetResponse): void {
            if(!isBrowser) return
            sessionStorage.setItem(`user`, JSON.stringify(user))
        },
        load(): userGetResponse | object {
            if(!isBrowser) return {}
            try {
                return JSON.parse(sessionStorage.getItem(`user`) as string)
            } catch(error: unknown) {
                console.error('Failed to parse user from sessionStorage:', error)
                return {}
            }
        }
    }
}

export default storage
