import express, { Request, Response, Router } from 'express'
import validator from 'validator'
import { decodeJwtToken, failRequest } from '../utils/functions'
import Group from '../models/group.model'
import { groupCreationPayload, groupRenamePayload } from '../utils/interfaces'
import { Optional } from 'sequelize'
import { secret } from '../utils/jwt_strategy'
import User from '../models/user.model'

const routerGroup: Router = express.Router()

routerGroup.post('/', createGroup)
routerGroup.get('/:id', getGroupById)
routerGroup.patch('/:id', renameGroupById)
routerGroup.delete('/:id', deleteGroupById)
routerGroup.get('/:id/users', getUsersOfGroupById)
routerGroup.put('/:id/:user_id', addUserToGroupById)
routerGroup.put('/:id/email/:email', addUserToGroupByEmail)
routerGroup.delete('/:id/:user_id', removeUserFromGroupById)

export default routerGroup

async function createGroup(req: Request, res: Response): Promise<void> {
    try {
        const { name, firstUsersEmails }: groupCreationPayload = req.body

        if(!name)
            return failRequest(res, 400, `You must provide a name for your group`)

        const payload: groupCreationPayload = {
            name: validator.escape(name),
        }

        const createdGroup = await Group.create(payload as Optional<any, any>) as any

        if(firstUsersEmails && firstUsersEmails.length > 0) {
            const users = await User.findAll({
                where: {
                    email: firstUsersEmails.map(email => validator.escape(email))
                } as any
            })

            await createdGroup.addUsers(users)
        }

        res.status(201).json(createdGroup)

    } catch(error: unknown) {
        console.error(error)
        failRequest(res, 500, `Internal server error`)
    }
}

async function getGroupById(req: Request, res: Response): Promise<void> {
    try {
        const id = Number(req.params.id)

        const group = await Group.findByPk(id)

        if(!group)
            return failRequest(res, 404, `Group not found`)

        res.json(group)
    } catch(error: unknown) {
        console.error(error)
        failRequest(res, 500, `Internal server error`)
    }
}

async function renameGroupById(req: Request, res: Response): Promise<void> {
    try {
        const id = Number(req.params.id)

        const userId = decodeJwtToken(req.headers.authorization, secret).id
        const currentUser = await User.findByPk(userId) as any

        // If the user isn't inside the group, he can't rename it
        if(!await currentUser.hasGroup(id))
            return failRequest(res, 401, 'Unauthorized')

        const { name }: groupRenamePayload = req.body

        if(!name)
            return failRequest(res, 400, `You must provide a new name for your group`)

        const updatePayload: groupRenamePayload = {
            name: validator.escape(name)
        }

        const renamedGroup = await Group.update(updatePayload, {
            where: { id }
        })

        res.json(renamedGroup)
    } catch(error: unknown) {
        console.error(error)
        failRequest(res, 500, `Internal server error`)
    }
}

async function deleteGroupById(req: Request, res: Response): Promise<void> {
    try {
        const id = Number(req.params.id)

        const userId = decodeJwtToken(req.headers.authorization, secret).id
        const currentUser = await User.findByPk(userId) as any

        // If the user isn't inside the group, he can't rename it
        if(!await currentUser.hasGroup(id))
            return failRequest(res, 401, 'Unauthorized')

        const group = await Group.findByPk(id)

        if(!group)
            return failRequest(res, 404, `Group not found`)

        await group.destroy()

        res.json({ message: 'Group deleted successfully' })
    } catch(error: unknown) {
        console.error(error)
        failRequest(res, 500, `Internal server error`)
    }
}

async function getUsersOfGroupById(req: Request, res: Response): Promise<void> {
    try {
        const id = Number(req.params.id)

        const userId = decodeJwtToken(req.headers.authorization, secret).id
        const currentUser = await User.findByPk(userId) as any

        // If the user isn't inside the group, he can't rename it
        if(!await currentUser.hasGroup(id))
            return failRequest(res, 401, 'Unauthorized')

        const group = await Group.findByPk(id) as any
        const usersOfGroup = await group.getUsers({
            attributes: {
                exclude: ['password']
            }
        })

        res.json(usersOfGroup)
    } catch(error: unknown) {
        console.error(error)
        failRequest(res, 500, `Internal server error`)
    }
}

async function addUserToGroupById(req: Request, res: Response): Promise<void> {
    try {
        const id = Number(req.params.id)
        const userId = Number(req.params.user_id)

        if(!id || !userId)
            return failRequest(res, 400, `You must provide a group id and a user id in the request parameters`)

        const group = await Group.findByPk(id) as any

        if(!group)
            return failRequest(res, 404, `Group not found`)

        const user = await User.findByPk(userId)

        if(!user)
            return failRequest(res, 404, `User not found`)

        await group.addUser(user)

        res.json({ message: `User n°${userId} added to group n°${id}.` })
    } catch(error: unknown) {
        console.error(error)
        failRequest(res, 500, `Internal server error`)
    }
}

async function addUserToGroupByEmail(req: Request, res: Response): Promise<void> {
    try {
        const id = Number(req.params.id)
        const email = validator.escape(req.params.email)

        if(!id || !email || !validator.isEmail(email))
            return failRequest(res, 400, `You must provide a group id and a user email in the request parameters`)

        const user = await User.findOne({
            where: {
                email: email
            }
        }) as any
        const group = await Group.findByPk(id) as any

        if(!group)
            return failRequest(res, 404, `Group not found`)

        if(!user)
            return failRequest(res, 404, `User not found`)

        await group.addUser(user)

        res.json({ message: `User n°${user.id} added to group n°${id}.` })
    } catch(error: unknown) {
        console.error(error)
        failRequest(res, 500, `Internal server error`)
    }
}

async function removeUserFromGroupById(req: Request, res: Response): Promise<void> {
    try {
        const id = Number(req.params.id)
        const userId = Number(req.params.user_id)

        if(!id || !userId)
            return failRequest(res, 400, `You must provide a group id and a user id in the request parameters`)

        const group = await Group.findByPk(id) as any

        if(!group)
            return failRequest(res, 404, `Group not found`)

        const user = await User.findByPk(userId) as any

        if(!user)
            return failRequest(res, 404, `User not found`)

        // If the user isn't inside the group, he can't remove someone from it
        if(!await user.hasGroup(id))
            return failRequest(res, 401, "The user provided doesn't belong to the group provided")

        await group.removeUser(user)

        res.json({ message: `User n°${userId} removed from group n°${id}.` })
    } catch(error: unknown) {
        console.error(error)
        failRequest(res, 500, `Internal server error`)
    }
}
