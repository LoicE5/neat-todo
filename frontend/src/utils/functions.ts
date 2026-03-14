export function decodeSafeHtmlChars(str: string): string {
    if(!str)
        return ""
    return str.replace('&#x27;', "'")
}
