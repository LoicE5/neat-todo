import { userGetResponse } from "./interfaces"

const storage = {
    clear(): void {
        window.sessionStorage.clear()
    },
    jwt: {
        save(token: string): void {
            window.sessionStorage.setItem(`jwt`, token)
        },
        load(bearer: boolean = true): string {
            const token: string = window.sessionStorage.getItem(`jwt`) || ''
            if(bearer)
                return `Bearer ${token}`
            return token
        },
        exists(): boolean {
            const token: string | null = window.sessionStorage.getItem(`jwt`)
            if(token === "null" || token === "undefined")
                return false
            return !!token
        }
    },
    user: {
        save(user: userGetResponse): void {
            sessionStorage.setItem(`user`, JSON.stringify(user))
        },
        load(): userGetResponse | object {
            try {
                return JSON.parse(sessionStorage.getItem(`user`) as string)
            } catch(error: unknown) {
                return {}
            }
        }
    }
}

export default storage
