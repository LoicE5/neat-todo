import sequelize from "../../db"
import { DataTypes } from "sequelize"

const TodoHistory = sequelize.define('TodoHistory', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    group_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'group_',
            key: 'id',
        },
        validate: {
            isAlphanumeric: true
        }
    },
    title: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING(500),

    },
    deadline: {
        type: DataTypes.DATE,
    },
    status: {
        type: DataTypes.STRING(30),
        defaultValue: 'not_started',
        allowNull: false,
    },
    assignee_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'user_',
            key: 'id',
        }
    },
    author_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'user_',
            key: 'id',
        }
    },
  }, {
    timestamps: true,
    freezeTableName: true,
    tableName: 'todo_history_'
  })  

export default TodoHistory