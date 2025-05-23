import jwt from 'jsonwebtoken';
export const isAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                message: "Unauthorized",
            });
            return;
        }
        ;
        const token = authHeader.split(" ")[1];
        const decodeValue = jwt.verify(token, process.env.JWT_SECRET);
        if (!decodeValue) {
            res.status(401).json({
                message: "Unauthorized",
            });
            return;
        }
        req.user = decodeValue.user;
        next();
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error",
        });
    }
};
