import Header from "@/components/Header"
import { TodoStatus } from "@/utils/enums"
import { useRouter } from "next/router"
import storage from "@/utils/storage"
import { userGetResponse } from "@/utils/interfaces"
import TodoForm from "@/components/TodoForm"

export default function CreateTodo() {

    const user = storage.user.load()
    const router = useRouter()
    const defaultDeadline = new Date().toISOString().split('T').at(0)

    return (
        <>
            <Header />
            <TodoForm
                todoId={undefined}
                title={undefined}
                description={undefined}
                deadline={defaultDeadline}
                groupId={undefined}
                assigneeId={undefined}
                status={TodoStatus.NotStarted}
                user={user as userGetResponse}
                router={router}
                context="create"
            />
        </>
    )

}
