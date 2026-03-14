// pages/_app.tsx
import { AppProps } from 'next/app'

import '@/styles/globals.css'
import '@/styles/home.css'
import { AnimatePresence, motion } from 'framer-motion'
import { Analytics } from '@vercel/analytics/react'

function App({ Component, pageProps, router }: AppProps) {
    return (
        <>
            <AnimatePresence mode='wait'>
                <motion.div key={router.route}>
                    <Component {...pageProps} />
                    <motion.div
                        className="slide-in"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 0 }}
                        exit={{ scaleY: 1 }}
                        transition={{ duration: 0.33, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <motion.div
                        className="slide-out"
                        initial={{ scaleY: 1 }}
                        animate={{ scaleY: 0 }}
                        exit={{ scaleY: 0 }}
                        transition={{ duration: 0.33, ease: [0.22, 1, 0.36, 1] }}
                    />
                </motion.div>

            </AnimatePresence>
            <Analytics mode='auto' />
        </>
    )
}

export default App
