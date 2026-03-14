import { Strategy as JwtStrategy, ExtractJwt, VerifiedCallback } from 'passport-jwt'
import User from '../models/user.model.js'
import { Model } from 'sequelize'
import { jwtPayload } from './interfaces.js'

const secret: string = process.env.JWT_SECRET

const jwtStrategy = new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secret
},
    (payload: jwtPayload, done: VerifiedCallback): void => {
        User.findByPk(payload.id)
            .then((user: Model) => {
                if(user)
                    return done(null, user)
                return done(null, false)
            })
            .catch((error: unknown) => {
                console.error('Error in finding user by ID in JWT:', error)
            })
    }
)

export default jwtStrategy
export {
    secret
}