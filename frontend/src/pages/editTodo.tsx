import Header from "@/components/Header"
import { useRouter } from "next/router"
import storage from "@/utils/storage"
import { todoGetResponse, userGetResponse } from "@/utils/interfaces"
import TodoForm from "@/components/TodoForm"
import { useEffect, useState } from "react"

export default function EditTodo() {

    const router = useRouter()
    const user = storage.user.load() as userGetResponse

    const [todoFormElement, setTodoFormElement] = useState((<p>Please wait for the Todo to load</p>))

    useEffect(() => {

        if(!storage.jwt.exists()) {
            router.push('/login')
            return
        }

        const { todo_id } = router.query
        let todoIdInteger = parseInt(todo_id as string)

        if(!todoIdInteger) {

            // If we access the page via another way than the Next Router (direct URL access or other), we can check the GET params the old way
            const urlSearchParams = new URLSearchParams(window.location.search)
            const todoIdFromQueryString = urlSearchParams.get('todo_id')

            if(todoIdFromQueryString) {
                todoIdInteger = parseInt(todoIdFromQueryString)
            } else {
                router.push('/404')
                return
            }
        }

        getTodoById(todoIdInteger).then((todo: any) => {
            setTodoFormElement((
                <TodoForm
                    todoId={todo.id}
                    title={todo.title}
                    description={todo.description}
                    deadline={todo.deadline}
                    groupId={todo.group_id}
                    assigneeId={todo.assignee_id}
                    status={todo.status}
                    user={user}
                    router={router}
                    context="edit"
                />
            ))
        })

    }, [])

    async function getTodoById(todoId: number): Promise<todoGetResponse | void> {
        const response = await fetch(`/api/todo/${todoId}`, {
            method: 'GET',
            headers: {
                'Authorization': storage.jwt.load(),
                'Content-Type': 'application/json'
            }
        })

        if(!response.ok) {
            if(response.status === 404)
                return await router.push(`/404`) as any
            else
                return alert(`We failed getting the information of the todo. Response code : ${response.status}. Error message : ${await response.text()}`)
        }

        const responsePayload = await response.json() as todoGetResponse

        return responsePayload
    }

    return (
        <>
            <Header />
            {todoFormElement}
        </>
    )

}
