import jwt from 'jsonwebtoken';
import * as Yup from 'yup';

import User from '../models/User';
import File from '../models/File';
import autoConfig from '../../config/auth';

class SessionController {
    async store(req, res) {
        const schema = Yup.object().shape({
            email: Yup.string()
                .required()
                .email(),
            password: Yup.string()
                .required()
                .min(6),
        });

        if (!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: 'Validation fails.' });
        }
        const { email, password } = req.body;

        const user = await User.findOne({
            where: { email },
            include: [
                {
                    model: File,
                    as: 'avatar',
                    attributes: ['id', 'path', 'url'],
                },
            ],
        });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (!(await user.checkPassword(password))) {
            return res.status(401).json({ error: 'Password does not match' });
        }
        const { id, name, avatar, provider } = user;

        if (avatar === null) {
            const defaultAvatar = {
                url: 'https://api.adorable.io/avatars/50/abott@adorable.png',
            };
            return res.json({
                user: {
                    id,
                    name,
                    email,
                    provider,
                    avatar: defaultAvatar,
                },
                token: jwt.sign({ id }, autoConfig.secret, {
                    expiresIn: autoConfig.expiresIn,
                }),
            });
        }

        return res.json({
            user: {
                id,
                name,
                email,
                provider,
                avatar,
            },
            token: jwt.sign({ id }, autoConfig.secret, {
                expiresIn: autoConfig.expiresIn,
            }),
        });
    }
}

export default new SessionController();
