import Header from "@/components/Header"
import { userGetResponse } from "@/utils/interfaces"
import storage from "@/utils/storage"
import React, { FormEvent, useEffect, useState } from 'react'
import { useRouter } from "next/router"
import SkewTitle from "@/components/SkewTitle"

interface userEditPayload {
    nickname: string
    email: string
    password?: string
}

export default function UserDetail() {

    const router = useRouter()
    const user = (typeof window !== 'undefined' ? storage.user.load() : {}) as userGetResponse

    const [userNickname, setUserNickname] = useState(user?.nickname || '')
    const [userEmail, setUserEmail] = useState(user?.email || '')
    const [userPassword, setUserPassword] = useState("false")


    useEffect(() => {

        if(!storage.jwt.exists()) {
            router.push('/login')
            return
        }

    }, [])



    async function editUserOnSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault()

        const payload: userEditPayload = {
            nickname: userNickname,
            email: userEmail,
        }

        if(userPassword && userPassword !== "false") {
            payload.password = userPassword
        }

        const url = `/api/user/${user.id}`

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': storage.jwt.load()
            },
            body: JSON.stringify(payload)
        })

        if(!response.ok)
            return alert(`We failed creating or editing your User. Response code : ${response.status}. Error message : ${await response.text()}`)

        await router.push('/workplace')
    }


    return (
        <div>
            <Header />
            <SkewTitle>Settings</SkewTitle>
            <br />

            <form onSubmit={editUserOnSubmit}>
                <div className="flex items-center">
                    <div className="bg-gray-400 rounded-md p-4 items-center border border-gray-800 ml-5 flex shadow-2xl">
                        <div className="flex flex-col items-center space-y-4">
                            <img
                                className="h-8 w-auto cursor-pointer"
                                src="back.png"
                                alt="backIcon"
                                draggable={false}
                                onClick={() => router.push('/workplace')}
                            />
                            <img
                                className="h-8 w-auto cursor-pointer"
                                src="refresh.png"
                                alt="refreshIcon"
                                draggable={false}
                                onClick={() => window.location.reload()}
                            />
                            <button
                                type="submit"
                                className="h-8 w-auto p-0 cursor-pointer border-none bg-none"
                            >
                                <img
                                    src="validation.png"
                                    alt="validationIcon"
                                    draggable={false}
                                    className="h-8 w-auto"
                                />
                            </button>

                        </div>
                    </div>
                    <div className="bg-gray-400 rounded-md p-4 items-center border border-gray-800 ml-5 shadow-2xl" style={{ width: "90%", height: "350px", marginRight: '1.25rem' }}>
                        <h3 className="text-gray-800" style={{ fontWeight: "bold", textAlign: "center", marginBottom: 0 }}>Account</h3>
                        <br />
                        <div className="items-center mx-auto" style={{ paddingTop: "1vw" }}>
                            <div className="text-left" style={{ width: "35vw" }}>
                                <label htmlFor="nickname" className="text-gray-800 block">Nickname</label>
                                <input
                                    type="text"
                                    name="inputNickname"
                                    placeholder="someone"
                                    value={userNickname}
                                    className="w-full bg-gray-400 hover:bg-gray-400 text-black py-2 px-4 rounded mb-4 italic"
                                    onChange={event => setUserNickname(event.target.value)}
                                />
                                <label htmlFor="email" className="text-gray-800 block">Email</label>
                                <input
                                    type="email"
                                    name="inputEmail"
                                    placeholder="someone@dauphine.eu"
                                    value={userEmail}
                                    className="w-full bg-gray-400 hover:bg-gray-400 text-black py-2 px-4 rounded mb-4 italic"
                                    onChange={event => setUserEmail(event.target.value)}
                                />
                                <label htmlFor="password" className="text-gray-800 block">Password</label>
                                <input
                                    type="password"
                                    name="inputPassword"
                                    placeholder="Your password"
                                    value={userPassword}
                                    className="w-full bg-gray-400 hover:bg-gray-400 text-black py-2 px-4 rounded mb-4 italic"
                                    onChange={event => setUserPassword(event.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )

}
