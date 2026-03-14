import { Sequelize, Options } from "sequelize"
import * as pg from 'pg'

const isSSLEnabled: boolean = process.env.DB_SSL === 'true'

const sequelize = new Sequelize(
    process.env.DB_DATABASE || 'neat_todo',
    process.env.DB_USER || 'admin',
    process.env.DB_PASSWORD || 'postgres',
    {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
        dialectModule: pg,
        logging: false,
        ssl: isSSLEnabled,
        dialectOptions: {
            ssl: isSSLEnabled
        }
    } as Options
)

sequelize.authenticate()
    .then((): void => {
        console.info('Connection to the database has been established successfully.')
    })
    .catch((error: unknown): void => {
        console.error('Unable to connect to the database:', error)
    })

export default sequelize
