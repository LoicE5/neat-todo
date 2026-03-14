import express, { Request, Response, Router } from 'express'
import User from '../models/user.model'
import UserGroup from '../models/user_group.model'
import validator from 'validator'
import Group from '../models/group.model'
import { failRequest, isUserIdFromTokenMatchingRequest, hashPassword, isObjectEmpty } from '../utils/functions'
import { userUpdatePayload } from '../utils/interfaces'
import sequelize from '../../db'

const routerUser: Router = express.Router()

routerUser.get('/:id', getUserById)
routerUser.get('/:id/groups', getUserGroupsById)
routerUser.put('/:id', updateUserById)
routerUser.delete('/:id', deleteUserById)

export default routerUser

async function getUserById(req: Request, res: Response): Promise<void> {
    try {
        const id = Number(req.params.id)

        if(!isUserIdFromTokenMatchingRequest(req.headers.authorization, id))
            return failRequest(res, 401, `Unauthorized`)

        const user = await User.findByPk(id, { attributes: { exclude: ['password'] } })

        if(!user)
            return failRequest(res, 404, `User not found`)

        res.json(user)
    } catch(error: unknown) {
        console.error(error)
        failRequest(res, 500, `Internal server error`)
    }

}

async function getUserGroupsById(req: Request, res: Response): Promise<void> {
    try {
        const id = Number(validator.escape(req.params.id))

        if(!isUserIdFromTokenMatchingRequest(req.headers.authorization, id))
            return failRequest(res, 401, `Unauthorized`)

        const user = await User.findByPk(id, {
            include: [{
                model: Group,
                through: UserGroup,
                attributes: [
                    'id',
                    'name',
                    [
                        sequelize.literal(`(SELECT COUNT(*) FROM user_group_ WHERE user_group_.group_id = "Groups"."id")`),
                        'userCount'
                    ]
                ],
                include: [{
                    model: User,
                    attributes: ['id', 'nickname', 'email'],
                    through: { attributes: [] } // Exclude the UserGroup association attributes
                }]
            } as any],
        }) as any

        if(!user)
            return failRequest(res, 404, `User not found`)

        res.json(user.Groups)
    } catch(error: unknown) {
        console.error(error)
        failRequest(res, 500, `Internal server error`)
    }
}

async function updateUserById(req: Request, res: Response): Promise<void> {
    try {

        const id = Number(req.params.id)

        // If the user tries to access another user's profile (token's id doesn't match params id)
        if(!isUserIdFromTokenMatchingRequest(req.headers.authorization, id))
            return failRequest(res, 401, `Unauthorized`)

        const { nickname, email, password }: userUpdatePayload = req.body

        const updatePayload: userUpdatePayload = {}

        if(nickname)
            updatePayload.nickname = validator.escape(nickname)

        // If an email is provided, we check if it is well formed and push it, otherwise we warn
        if(email) {
            if(validator.isEmail(email))
                updatePayload.email = validator.escape(email)
            else
                return failRequest(res, 400, `Your email address doesn't have the right format`)
        }

        if(password)
            updatePayload.password = await hashPassword(password)

        // If the payload we generate haven't been populated (wrong params, empty body, ...), we fail the req
        if(isObjectEmpty(updatePayload))
            return failRequest(res, 400, `Your request doesn't have the adequate parameters`)

        const updatedUser = await User.update(
            updatePayload,
            {
                where: { id }
            }
        )

        res.json(updatedUser)
    } catch(error: unknown) {
        console.error(error)
        if((error as any).name == 'SequelizeUniqueConstraintError')
            failRequest(res, 409, `This nickname and/or email address is already taken`)
        else
            failRequest(res, 500, `Internal server error`)
    }
}

async function deleteUserById(req: Request, res: Response): Promise<void> {
    try {
        const id = Number(req.params.id)

        // If the user tries to access another user's profile (token's id doesn't match params id)
        if(!isUserIdFromTokenMatchingRequest(req.headers.authorization, id))
            return failRequest(res, 401, `Unauthorized`)

        const user = await User.findByPk(id)

        if(!user)
            return failRequest(res, 404, `User not found`)

        await user.destroy()

        res.json({ message: 'User deleted successfully' })

    } catch(error: unknown) {
        console.error(error)
        failRequest(res, 500, `Internal server error`)
    }
}
