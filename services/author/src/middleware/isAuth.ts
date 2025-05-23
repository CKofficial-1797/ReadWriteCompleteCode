import {NextFunction , Request , Response} from 'express';
import jwt,{JwtPayload} from 'jsonwebtoken';


export interface IUser extends Document{
    _id: string;
    name: string;
      email: string;
     image: string;
     instagram: string;   
     facebook: string;
     linkedin: string;
     bio: string; 
}

export interface AuthenticatedRequest extends Request {
    user?: IUser | null;
}


export const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer ")) {
             res.status(401).json({
                message: "Unauthorized",
            });
            return;
        };
        const token = authHeader.split(" ")[1];
        
        const decodeValue = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

        if(!decodeValue) {
            res.status(401).json({
                message: "Unauthorized",
            });
            return;
        }
        req.user= decodeValue.user;

        next();
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
        });
    }
};