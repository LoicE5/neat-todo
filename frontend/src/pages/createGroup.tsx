import Header from "@/components/Header"
import { userGetResponse } from "@/utils/interfaces"
import storage from "@/utils/storage"
import { FormEvent, useState } from "react"
import { useRouter } from "next/router"
import SkewTitle from "@/components/SkewTitle"

export default function CreateGroup() {
    const user = (typeof window !== 'undefined' ? storage.user.load() : {}) as userGetResponse
    const router = useRouter()

    const [groupName, setGroupName] = useState("")
    const [firstUserEmail, setFirstUserEmail] = useState(user?.email || '')

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault()

        if(!groupName || !firstUserEmail)
            return alert(`Please fill the form as required`)

        const payload = {
            name: groupName,
            firstUsersEmails: [firstUserEmail]
        }

        const response = await fetch(`/api/group`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': storage.jwt.load()
            },
            body: JSON.stringify(payload)
        })

        if(!response.ok)
            return alert(`We failed creating your group. Response code : ${response.status}. Error message : ${await response.text()}`)

        await router.push('/groups')
    }

    return (
        <div>
            <Header />
            <SkewTitle>Create a new group</SkewTitle>

            <form onSubmit={handleSubmit}>
                <div className="flex flex-col items-center" style={{ marginTop: "50px" }}>
                    <label>The group's name</label>
                    <input
                        type="text"
                        name="inputNewGroupName"
                        placeholder="Projet Todo, Département IT..."
                        className="mx-auto w-1/3 bg-gray-400 hover:bg-gray-400 text-black py-2 px-4 rounded mb-4"
                        onChange={event => setGroupName(event.target.value)}
                        required
                    />
                </div>


                <div className="flex flex-col items-center" style={{ marginTop: "25px" }}>
                    <label htmlFor="email">First group member</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="jean.dupont@dauphine.eu"
                        className="mx-auto w-1/3 bg-gray-400 hover:bg-gray-400 text-black py-2 px-4 rounded mb-4"
                        value={firstUserEmail}
                        onChange={event => setFirstUserEmail(event.target.value)}
                        required
                    />
                </div>

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

            </form>

        </div>
    )

}
