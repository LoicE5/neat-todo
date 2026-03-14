import React from "react"
import Link from "next/link"
export default function Home() {
    return (

        <div
            style={{
                backgroundImage: `url("golden_gate.webp")`,
                backgroundSize: "cover",
                height: "100vh",
            }}
        >
            <div
                style={{
                    paddingLeft: "30vw",
                    paddingTop: "5%",
                    textAlign: "center",
                }}
            >
                <img
                    src="neat_logo.png"
                    alt="logo"
                    style={{
                        width: "20vw",
                        margin: "auto",
                        display: "block",
                    }}
                />
                <Link href="/login">
                    <button
                        type="submit"
                        className="bg-gray-400 hover:bg-gray-400 text-black font-bold py-2 px-8 rounded-full border border-black"
                        style={{
                            marginTop: "2em",
                        }}
                    >
                        Connexion
                    </button>
                </Link>
                <br />
                <Link href="/signup" style={{ marginTop: "2em" }}>
                    No account yet ?
                </Link>
            </div>
        </div>
    )
}
