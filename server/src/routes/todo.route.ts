import express, { Request, Response, Router } from 'express'
import User from '../models/user.model'
import { Model, Optional } from 'sequelize'
import { secret } from '../utils/jwt_strategy'
import { todoCreationPayload, todoUpdatePayload } from '../utils/interfaces'
import { failRequest, isObjectEmpty, decodeJwtToken, isUserRelatedToTodo, isValidTodoStatus } from '../utils/functions'
import validator from 'validator'
import Todo from '../models/todo.model'
import Group from '../models/group.model'

const routerToDo: Router = express.Router()

routerToDo.post('/', createATodo)
routerToDo.get('/:id', getTodoById)
routerToDo.put('/:id', updateTodoById)
routerToDo.get('/author/:user_id', getAllTodoOfAuthor)
routerToDo.get('/assignee/:user_id', getAllTodoOfAssignee)
routerToDo.delete('/:id', deleteTodoById)
routerToDo.get('/group/:group_id', getAllTodoOfGroup)

export default routerToDo

async function createATodo(req: Request, res: Response): Promise<void> {
    try {
        const {
            group_id,
            title,
            description,
            deadline,
            status,
            assignee_id,
            author_id
        }: todoCreationPayload = req.body

        if(!title || !assignee_id || !author_id)
            return failRequest(res, 400, `Required parameters haven't been set`)

        const currentUserId = decodeJwtToken(req.headers.authorization, secret).id

        if(currentUserId !== author_id)
            failRequest(res, 400, `You cannot assign a todo on behalf of others`)

        const createPayload: todoCreationPayload = {
            title: validator.escape(title),
            assignee_id: Number(assignee_id),
            author_id: Number(author_id)
        }

        if(group_id)
            createPayload.group_id = Number(group_id)

        if(description)
            createPayload.description = validator.escape(description)

        if(deadline) {
            if(validator.isDate(deadline as string))
                createPayload.deadline = new Date(deadline)
            else
                return failRequest(res, 400, `Your date format is not valid`)
        }

        if(status) {
            if(isValidTodoStatus(status))
                createPayload.status = validator.escape(status)
            else
                return failRequest(res, 400, `Your todo's status is not valid`)
        }

        const newTodo: Model = await Todo.create(createPayload as Optional<any, any>)
        res.status(201).json(newTodo)

    } catch(error: unknown) {
        failRequest(res, 500, `Internal server error`)
    }
}

async function getTodoById(req: Request, res: Response): Promise<void> {
    try {
        const id = Number(req.params.id)

        const toDo = await Todo.findByPk(id) as any

        if(!toDo)
            return failRequest(res, 404, `ToDo not found`)

        const currentUserId = decodeJwtToken(req.headers.authorization, secret).id
        const currentUser = await User.findByPk(currentUserId) as any

        if(!await isUserRelatedToTodo(currentUser, toDo, currentUserId))
            return failRequest(res, 401, `Unauthorized`)

        res.json(toDo)
    } catch(error: unknown) {
        console.error(error)
        failRequest(res, 500, `Internal server error`)
    }
}

async function updateTodoById(req: Request, res: Response): Promise<void> {
    try {
        const id = Number(req.params.id)

        const currentUserId = decodeJwtToken(req.headers.authorization, secret).id
        const currentUser = await User.findByPk(currentUserId) as any

        const toBeUpdatedTodo = await Todo.findByPk(id) as any

        if(!toBeUpdatedTodo)
            return failRequest(res, 404, `Todo not found`)

        // A user can't update a todo he's not related to
        if(!await isUserRelatedToTodo(currentUser, toBeUpdatedTodo, currentUserId))
            return failRequest(res, 401, `Unauthorized`)

        const {
            title,
            description,
            deadline,
            status,
            assignee_id,
            group_id
        }: todoUpdatePayload = req.body

        const updatePayload: todoUpdatePayload = {}

        if(title)
            updatePayload.title = validator.escape(title)

        if(description)
            updatePayload.description = validator.escape(description)

        if(status) {
            if(isValidTodoStatus(status))
                updatePayload.status = validator.escape(status)
            else
                return failRequest(res, 400, `Your todo's status is not valid`)
        }

        if(deadline) {
            if(validator.isDate(deadline as string))
                updatePayload.deadline = new Date(deadline)
            else
                return failRequest(res, 400, `Your date format is not valid`)
        }

        if(assignee_id)
            updatePayload.assignee_id = Number(assignee_id)

        if(group_id)
            updatePayload.group_id = Number(group_id)
        else if(group_id === null)
            updatePayload.group_id = null

        // If the payload we generate haven't been populated (wrong params, empty body, ...), we fail the req
        if(isObjectEmpty(updatePayload))
            return failRequest(res, 400, `Your request doesn't have the adequate parameters`)

        await toBeUpdatedTodo.update(updatePayload)

        res.json(toBeUpdatedTodo)

    } catch(error: unknown) {
        if((error as any).name == 'SequelizeUniqueConstraintError')
            failRequest(res, 409, `You can't assign the todo to this user`)
        else
            failRequest(res, 500, `Internal server error`)
    }
}

async function deleteTodoById(req: Request, res: Response): Promise<void> {
    try {
        const id = Number(req.params.id)
        const todo = await Todo.findByPk(id)

        if(!todo)
            return failRequest(res, 404, `Todo not found`)

        const currentUserId = decodeJwtToken(req.headers.authorization, secret).id
        const currentUser = await User.findByPk(currentUserId) as any

        // A user can't delete a todo he's not related to
        if(!await isUserRelatedToTodo(currentUser, todo, currentUserId))
            return failRequest(res, 401, `Unauthorized`)

        await todo.destroy()

        res.json({ message: 'Todo deleted successfully' })

    } catch(error: unknown) {
        console.error(error)
        failRequest(res, 500, `Internal server error`)
    }
}

async function getAllTodoOfAuthor(req: Request, res: Response): Promise<void> {
    getAllTodoByCriteria(req, res, "author")
}

async function getAllTodoOfAssignee(req: Request, res: Response): Promise<void> {
    getAllTodoByCriteria(req, res, "assignee")
}

async function getAllTodoOfGroup(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.group_id)

    if(!id)
        return failRequest(res, 400, 'Invalid group ID')

    const currentUserId = decodeJwtToken(req.headers.authorization, secret).id
    const currentUser = await User.findByPk(currentUserId) as any

    // If the user isn't inside the group, he can't access the todos
    if(!await currentUser.hasGroup(id))
        return failRequest(res, 401, 'Unauthorized')

    const todos = await Todo.findAll({
        where: {
            group_id: id
        },
        include: [
            {
                model: User,
                as: 'assignee',
                attributes: { exclude: ['password'] }
            },
            {
                model: User,
                as: 'author',
                attributes: { exclude: ['password'] }
            },
            {
                model: Group,
                as: 'group'
            }
        ]
    })

    res.json(todos)
}

// Utility function used for DRY, not an actual endpoint
async function getAllTodoByCriteria(req: Request, res: Response, criteria: "author" | "assignee"): Promise<void> {
    try {
        const userId = Number(req.params.user_id)

        if(!userId)
            return failRequest(res, 400, 'Invalid ID')

        const currentUserId = decodeJwtToken(req.headers.authorization, secret).id

        if(userId !== currentUserId)
            return failRequest(res, 401, `Unauthorized`)

        const todos = await Todo.findAll({
            where: criteria == "author" ? { author_id: userId } : { assignee_id: userId },
            include: [
                {
                    model: User,
                    as: 'assignee',
                    attributes: { exclude: ['password'] }
                },
                {
                    model: User,
                    as: 'author',
                    attributes: { exclude: ['password'] }
                },
                {
                    model: Group,
                    as: 'group'
                }
            ]
        })

        res.json(todos)
    } catch(error: unknown) {
        console.error(error)
        failRequest(res, 500, `Internal server error`)
    }
}
