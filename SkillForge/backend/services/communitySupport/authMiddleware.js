const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];  // Extract token after "Bearer"
    console.log("Received Token:", token);  // Log received token for debugging

    if (!token) {
        console.log("No token provided.");  // Log if no token is present
        return res.status(401).json({ message: 'Unauthorized Access' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error("JWT Verification Error:", err);  // Log detailed error
            return res.status(403).json({ message: 'Forbidden' });
        }

        console.log("Token Verified Successfully. User:", user);  // Log user on successful verification
        req.user = user;
        next();
    });
};

const authorizeRoles = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            console.log("No user in request object.");  // Log if user is missing from the request
            return res.status(403).json({ message: 'Forbidden' });
        }

        const userRole = req.user.role;
        if (!roles.includes(userRole)) {
            console.log(`User role "${userRole}" is not authorized for this resource.`);  // Log user role if unauthorized
            return res.status(403).json({ message: 'Forbidden' });
        }

        console.log("User authorized with role:", userRole);  // Log user role when authorized
        next();
    };
};

module.exports = { authenticateToken, authorizeRoles };
