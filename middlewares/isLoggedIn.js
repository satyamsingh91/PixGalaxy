const jwt =require('jsonwebtoken')

const isLoggedIn=function(req,res,next){
    const token =req.cookies.token;
    if(!token){
        return res.redirect("/login")
    }
    try {
        const { id } = jwt.verify(token, process.env.SECRET_KEY);
        req.id = id;
        next();
      } catch (ex) {
        res.status(400).send({ error: "Invalid token." });
      }
};

module.exports=isLoggedIn;