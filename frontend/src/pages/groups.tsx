import Header from "@/components/Header"
import Group from "@/components/Group"
import { userGetResponse, userGroupGetResponse } from "@/utils/interfaces"
import storage from "@/utils/storage"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import Link from "next/link"
import SkewTitle from "@/components/SkewTitle"

export async function getGroups(user: userGetResponse): Promise<userGroupGetResponse[] | void> {
    const response = await fetch(`/api/user/${user.id}/groups`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': storage.jwt.load()
        }
    })

    if(!response.ok)
        return alert(`We failed deleting your groups. Response code : ${response.status}. Error message : ${await response.text()}`)

    const responsePayload = await response.json()

    if(responsePayload.length <= 0)
        return []

    return responsePayload
}

export default function Groups() {
    const router = useRouter()
    const user = storage.user.load() as userGetResponse

    useEffect(() => {

        if(!storage.jwt.exists()) {
            router.push('/login')
            return
        }

        getGroups(user).then((groups: any) => {

            const elements = groups.map((group: userGroupGetResponse) => (
                <Group id={group.id} title={group.name} userCount={group.userCount} user={user} />
            ))

            setGroupElements(elements)
        })

    }, [])

    const [groupElements, setGroupElements] = useState([])

    return (
        <div>
            <Header />

            <SkewTitle>Your Groups</SkewTitle>
            <br />
            <div style={{ zIndex: "1" }}>


                {groupElements.length > 0 ? groupElements : (<h2 style={{ textAlign: "center" }}>You don't belong to a group yet.</h2>)}

                {/* Compensate the footer's space for aesthetics */}
                <div style={{ height: "10vh" }}></div>
            </div>


            <div className="fixed bottom-0 w-full bg-gradient-to-t from-white via-white to-transparent filter blur-1" style={{ height: "15vh" }}>
            </div>
            <Link href="/createGroup">
                <button type="submit"
                    className="bg-gray-400 hover:bg-gray-400 text-black font-bold py-2 px-8 rounded-full border border-black"
                    style={{
                        position: "fixed",
                        zIndex: "2",
                        marginTop: "2em",
                        bottom: "2em",
                        left: "50%",
                        transform: "translateX(-50%)",
                    }}>
                    Create group
                </button>
            </Link>
        </div>
    )

}
