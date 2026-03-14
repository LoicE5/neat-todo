import Link from "next/link"
import storage from "@/utils/storage"
import { userGetResponse } from "@/utils/interfaces"
import { NextRouter, useRouter } from "next/router"

interface GroupProps {
    id: number
    title: string
    userCount: number
    user?: userGetResponse
    router?: NextRouter
}

export async function removeUserFromGroup(groupId: number, user: userGetResponse, router: NextRouter, reload: boolean = true): Promise<void> {

    const response = await fetch(`/api/group/${groupId}/${user.id}`, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': storage.jwt.load()
        }
    })

    if(!response.ok)
        return alert(`We failed removing you from the group. Response code : ${response.status}. Error message : ${await response.text()}`)

    if(reload)
        return router.reload()
    else
        return await router.push('/groups') as any
}

export default function Group({ id, title, userCount, user, router }: GroupProps) {
    if(!router)
        router = useRouter()

    if(!user)
        user = storage.user.load() as userGetResponse

    return (
        <Link href={`/groupDetails?group_id=${id}`} style={{ textDecoration: "none", color: "black" }}>
            <div style={{
                marginLeft: "7em", marginRight: "7em", marginBottom: "1.7em", paddingTop: "0.5em", borderRadius: "1em", height: "92px", backgroundColor: "#D7D7D7", position: "relative"
            }}>

                <h3 className="mr-auto ml-8 text-lg font-bold">{title}</h3>
                <div className="flex justify-between">
                    <p style={{ marginLeft: "4em" }}>{userCount} members</p>
                    <div
                        style={{
                            display: "block",
                            width: "2em",
                            marginRight: "1em"
                        }}
                        onClick={() => removeUserFromGroup(id, user as userGetResponse, router as NextRouter, true)}
                    >
                        <img src="exitGroup.png" alt="TrashIcon" />
                    </div>

                </div>
                <div style={{
                    backgroundColor: "#706c6c", borderRadius: "10em",
                    position: "absolute", bottom: "0", width: "100%", height: "10px"
                }}></div>
            </div>

        </Link>

    )

}
