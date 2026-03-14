import { TodoStatus } from "@/utils/enums"
import { FormEvent, useEffect, useState } from "react"
import { getGroups } from "@/pages/groups"
import { NextRouter, useRouter } from "next/router"
import storage from "@/utils/storage"
import { userGetResponse, userGroupGetResponse } from "@/utils/interfaces"
import { decodeSafeHtmlChars } from "@/utils/functions"
import SkewTitle from "./SkewTitle"

interface TodoFormProps {
    todoId?: number
    title?: string
    description?: string
    deadline?: Date | string
    groupId?: number
    assigneeId?: number
    status: TodoStatus
    user?: userGetResponse
    router?: NextRouter
    context: 'create' | 'edit'
}

export default function TodoForm({ todoId, title, description, deadline, groupId, assigneeId, status, user, router, context }: TodoFormProps) {

    if(!router)
        router = useRouter()

    if(!user)
        user = storage.user.load() as userGetResponse

    if(deadline instanceof Date)
        deadline = deadline.toISOString().split('T').at(0)

    if(deadline?.includes('T'))
        deadline = deadline.split('T').at(0)

    // Hooks
    const [groups, setGroups] = useState([])
    const [groupOptions, setGroupOptions] = useState([])
    const [selectedGroupId, setSelectedGroupId] = useState(groupId || 0)

    const [todoTitle, setTodoTitle] = useState(title || '')
    const [todoDescription, setTodoDescription] = useState(description || '')
    const [todoDeadline, setTodoDeadline] = useState(deadline as string || '')
    const [todoAssigneeId, setTodoAssigneeId] = useState(assigneeId || 0)
    const [todoFirstStatus, setTodoFirstStatus] = useState(status)


    // onMount
    useEffect(() => {

        if(!storage.jwt.exists()) {
            router!.push('/login')
            return
        }

        getGroups(user!).then((groups: any) => {

            const groupOptionElements: any = [

                (<option key={0} value={0}>🏡 Personal ToDo</option>),

                ...groups.map((group: userGroupGetResponse) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                ))
            ]

            setGroups(groups)
            setGroupOptions(groupOptionElements)
        })
    }, [])

    // Methods
    /**
     * Gives a set of HTML options, each of them corresponding to a user of the selected group
     * @param groupId The id of the currently selected group in the relevant dropdown menu (via selectedGroupId)
     * @returns {HTMLOptionElement[]}
     */
    function groupUsersOptionElements(groupId: number): HTMLOptionElement[] | void {
        if(selectedGroupId <= 0)
            return

        const foundUsers = groups.find((group: userGroupGetResponse) => group.id === groupId)! as userGroupGetResponse

        if(!foundUsers)
            return

        // We sort the users in order to keep the current user first, so that the first option available is always his nickname & email
        return foundUsers.Users
            .sort((a, b): number => {
                if(a.id === user!.id)
                    return -1
                if(b.id === user!.id)
                    return 1
                return a.id - b.id
            })
            .map(oneUser => (
                <option key={oneUser.id} value={oneUser.id}>{oneUser.nickname} ({oneUser.email})</option>
            ) as any)
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault()

        if(!todoTitle)
            return alert(`Please give your todo a title`)

        const payload = {
            title: todoTitle,
            description: todoDescription || null,
            deadline: todoDeadline || null,
            group_id: selectedGroupId > 0 ? selectedGroupId : null,
            assignee_id: todoAssigneeId > 0 ? todoAssigneeId : user!.id,
            author_id: user!.id,
            status: todoFirstStatus
        }

        let url = `/api/todo`
        if(context === 'edit')
            url = url.concat(`/${todoId}`)

        const method = context === 'create' ? 'POST' : 'PUT'

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': storage.jwt.load()
            },
            body: JSON.stringify(payload)
        })

        if(!response.ok)
            return alert(`We failed creating or editing your ToDo. Response code : ${response.status}. Error message : ${await response.text()}`)

        if(selectedGroupId > 0)
            router!.push(`/groupDetails?group_id=${selectedGroupId}`)
        else
            router!.push('/workplace')
    }

    return (
        <div>
            <SkewTitle>{context === 'create' ? 'Create a new ToDo' : 'Edit the ToDo'}</SkewTitle>
            <form onSubmit={handleSubmit}>
                <div className="flex flex-col items-center" style={{ marginTop: "50px" }}>
                    <label>Your ToDo's title</label>
                    <input
                        type="text"
                        name="inptNewTDTitle"
                        placeholder="Wire money to Alexandre"
                        className="mx-auto w-1/3 bg-gray-400 hover:bg-gray-400 text-black py-2 px-4 rounded mb-4"
                        required
                        value={decodeSafeHtmlChars(todoTitle)}
                        onChange={event => setTodoTitle(event.target.value)}
                    />
                </div>


                <div className="flex flex-col items-center" style={{ marginTop: "25px" }}>
                    <label>The description</label>
                    <input
                        type="text"
                        name="inptNewTDDescription"
                        placeholder="For yesterday's coffee"
                        className="mx-auto w-1/3 bg-gray-400 hover:bg-gray-400 text-black py-2 px-4 rounded mb-4"
                        value={decodeSafeHtmlChars(todoDescription)}
                        onChange={event => setTodoDescription(event.target.value)}
                    />
                </div>

                <div className="flex flex-col items-center" style={{ marginTop: "25px" }}>
                    <label>ToDo's deadline</label>
                    <input
                        type="date"
                        name="inptNewTDDeadline"
                        min="2023-01-01"
                        max="2050-12-31"
                        className="mx-auto w-1/3 bg-gray-400 hover:bg-gray-400 text-black py-2 px-4 rounded mb-4"
                        value={todoDeadline}
                        onChange={event => setTodoDeadline(event.target.value)}
                    />
                </div>

                <div className="flex flex-col items-center" style={{ marginTop: "25px" }}>
                    <label>In which group would you like to {context === 'create' ? 'create' : 'edit'} this ToDo ?</label>
                    <select
                        name="groupTD"
                        className="mx-auto w-1/3 bg-gray-400 hover:bg-gray-400 text-black py-2 px-4 rounded mb-4"
                        value={selectedGroupId}
                        onChange={event => setSelectedGroupId(Number(event.target.value))}
                    >
                        {groupOptions}
                    </select>
                </div>

                <div className="flex flex-col items-center" style={{
                    marginTop: "25px",
                    display: selectedGroupId <= 0 ? 'none' : 'flex'
                }}>
                    <label>Which group member do you want to assign this ToDo to?</label>
                    <select
                        name="groupTD"
                        className="mx-auto w-1/3 bg-gray-400 hover:bg-gray-400 text-black py-2 px-4 rounded mb-4"
                        disabled={selectedGroupId <= 0}
                        value={todoAssigneeId}
                        onChange={event => setTodoAssigneeId(Number(event.target.value))}
                    >
                        {groupUsersOptionElements(selectedGroupId) as any}
                    </select>
                </div>

                <div className="flex flex-col items-center" style={{ marginTop: "25px" }}>
                    <label>The ToDo's status</label>
                    <select
                        name="statusTD"
                        className="mx-auto w-1/3 bg-gray-400 hover:bg-gray-400 text-black py-2 px-4 rounded mb-4"
                        value={todoFirstStatus}
                        onChange={event => setTodoFirstStatus(event.target.value as TodoStatus)}
                    >
                        <option value={TodoStatus.NotStarted}>Not started</option>
                        <option value={TodoStatus.InProgress}>In progress</option>
                        <option value={TodoStatus.Done}>Done</option>
                    </select>
                </div>

                <button type="submit"
                    className="bg-gray-400 hover:bg-gray-400 text-black font-bold py-2 px-8 rounded-full border border-black"
                    style={{ display: "block", margin: "auto", marginTop: "1em", marginBottom: "2em" }}>
                    {context === 'create' ? 'Create ToDo' : 'Edit ToDo'}
                </button>

            </form>

        </div>
    )

}
