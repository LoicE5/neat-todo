import { TodoStatus } from "@/utils/enums"
import { NextRouter, useRouter } from "next/router"

interface ToDoProps {
    id: number
    deadline: Date | string
    status: string
    title: string
    description: string
    author: string
    router?: NextRouter
}

export default function Todo({
    id,
    deadline,
    status,
    title,
    description,
    author,
    router,
}: ToDoProps) {
    let statusElement = <p>ERROR: No status</p>
    switch(status) {
        case TodoStatus.NotStarted:
            statusElement = <p className="italic text-white"><span className="inline-block h-5 w-5 rounded-full bg-gray-400 mr-2"></span>Not started</p>
            break

        case TodoStatus.InProgress:
            statusElement = <p className="italic text-white"><span className="inline-block h-5 w-5 rounded-full bg-blue-300 mr-2"></span>In progress</p>
            break

        case TodoStatus.Done:
            statusElement = <p className="italic text-white"><span className="inline-block h-5 w-5 rounded-full bg-green-500 mr-2"></span>Done</p>
            break

        default:
            statusElement = <p className="italic text-white"><span className="inline-block h-5 w-5 rounded-full bg-gray-500 mr-2"></span>No Status</p>
            break
    }

    if(!(deadline instanceof Date))
        deadline = new Date(deadline)

    if(!router) router = useRouter()

    const todayDate = new Date()
    let late = null

    if(deadline < todayDate && status !== TodoStatus.Done)
        late = <p className="mr-2 font-bold text-white">LATE</p>

    return (
        <div
            className="rounded p-4 text-white bg-gray-400 border border-gray-800 shadow-2xl"
            style={{
                margin: "2em",
                borderRadius: "1em",
                cursor: "pointer",
            }}
            onClick={() => router!.push(`/editTodo?todo_id=${id}`)}
        >
            <div className="flex">
                <h3 className="mr-auto text-lg font-bold">{title}</h3>
                <div className="flex items-center">
                    {late}
                    {statusElement}
                </div>
            </div>
            <div>
                <p className="ml-10">{description}</p>
            </div>
            <div className="flex">
                <p className="mr-auto">Task assigned to: {author}</p>
                <p className="ml-auto">Deadline :<i> {deadline.getDate()}/{deadline.getMonth() + 1}/{deadline.getFullYear()}</i></p>
            </div>
        </div>
    )
}
