import dotenv from "dotenv"
dotenv.config()
import express, { Express, Request, Response } from "express"
import cors from 'cors'
import passport from "passport"
import sequelize from "./db"
import routerAuth from "./src/routes/auth.route"
import routerUser from "./src/routes/user.route"
import jwtStrategy from "./src/utils/jwt_strategy"
import routerToDo from "./src/routes/todo.route"
import routerGroup from "./src/routes/group.route"
import { failRequest } from "./src/utils/functions"

const app: Express = express()
const port: number = Number(process.env.PORT) || 3001

passport.use(jwtStrategy)

app.use(express.json())
app.use(express.text())
app.use(cors({
    origin: [
        'http://localhost:3000', // Local
        /https:\/\/.*-loicprojects\.vercel\.app$/, // Preview
        'https://neat-todo.vercel.app/' // Prod
    ]
}))

app.use('/api/auth', routerAuth)
app.use('/api/user', passport.authenticate('jwt', { session: false }), routerUser)
app.use('/api/todo', passport.authenticate('jwt', { session: false }), routerToDo)
app.use('/api/group', passport.authenticate('jwt', { session: false }), routerGroup)

app.all('/api', (req: Request, res: Response): void => failRequest(res, 418, `You cannot pour coffee here, please use tea instead.`))

sequelize.sync({ force: false }).then(() => {
    console.info('The database have been synced')
})

app.listen(port, (): void => console.info(`The server is listening to the port ${port}`))

export default app
