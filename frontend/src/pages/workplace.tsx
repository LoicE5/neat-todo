import Header from "@/components/Header"
import Todo from "@/components/Todo"
import storage from "@/utils/storage"
import { todoGetResponse, userGetResponse } from "@/utils/interfaces"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { decodeSafeHtmlChars } from "@/utils/functions"
import SkewTitle from "@/components/SkewTitle"

export default function Workplace() {

    const router = useRouter()

    useEffect(() => {

        if(!storage.jwt.exists()) {
            router.push('/login')
            return
        }

        getAssigneeTodos()
    }, [])

    const user = storage.user.load() as userGetResponse
    const [todos, setTodos] = useState([])

    async function getAssigneeTodos(): Promise<void> {
        const response = await fetch(`/api/todo/assignee/${user.id}`, {
            method: 'GET',
            headers: {
                'Authorization': storage.jwt.load(),
                'Content-Type': 'application/json'
            }
        })

        if(!response.ok)
            return alert(`We failed fetching your todo. Response code : ${response.status}. Error message : ${await response.text()}`)

        const responsePayload = await response.json() as todoGetResponse[]

        const todoElements = responsePayload
            .sort((a: todoGetResponse, b: todoGetResponse) => b.status.localeCompare(a.status))
            .map((todo: todoGetResponse) => (
                <Todo
                    key={todo.id}
                    id={todo.id}
                    title={todo.title}
                    status={todo.status}
                    description={decodeSafeHtmlChars(todo.description as string) || ""}
                    author={todo.author ? todo.author.nickname : "Author removed"}
                    deadline={todo.deadline || "No deadline"}
                />
            ))

        setTodos(todoElements as any)
    }

    return (
        <div>
            <Header />
            <SkewTitle>Your personal ToDos</SkewTitle>
            {todos}
        </div>
    )

}
