import express, { Request, Response, Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '../models/user.model'
import { Model, Optional } from 'sequelize'
import { secret } from '../utils/jwt_strategy'
import { userCreationPayload } from '../utils/interfaces'
import { failRequest, hashPassword } from '../utils/functions'
import validator from 'validator'

const routerAuth: Router = express.Router()

routerAuth.post('/login', login)
routerAuth.post('/signup', signup)

export default routerAuth

async function login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body
    const defaultFail = (): void => failRequest(res, 401, `Incorrect email or password`)

    if(!email || !password)
        return defaultFail()

    if(!validator.isEmail(email))
        return defaultFail()

    try {
        const user = await User.findOne({ where: { email: email } }) as any

        if(!user)
            return defaultFail()

        if(await bcrypt.compare(password, user.password)) {
            const payload = { id: user.id }
            const token = jwt.sign(payload, secret)
            delete user.dataValues.password
            return res.json({ message: 'ok', token: token, user: user }) as any
        }

        return defaultFail()
    } catch(error: unknown) {
        console.error(error)
        defaultFail()
    }
}

async function signup(req: Request, res: Response): Promise<void> {
    const defaultFail = (): void => failRequest(res, 500, `There have been an error processing your signup.`)

    const { nickname, email, password }: userCreationPayload = req.body

    if(!nickname || !email || !password)
        return defaultFail()

    if(!validator.isEmail(email))
        return defaultFail()

    const payload: userCreationPayload = {
        nickname: nickname,
        email: email,
        password: await hashPassword(password)
    }

    try {

        const newUser: Model = await User.create(payload as Optional<any, any>)
        res.status(201).json(newUser)

    } catch(error: unknown) {
        console.error(error)
        if((error as any).name == 'SequelizeUniqueConstraintError')
            failRequest(res, 409, `This email or nickname already exists.`)
        else
            defaultFail()
    }

}
