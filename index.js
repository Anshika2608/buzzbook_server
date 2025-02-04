const express = require("express");
const app = express();
require("./config/config");
const cookieParser = require("cookie-parser");
const passport = require("./Middleware/PassPort");
const cors = require("cors");
app.use(express.json());
app.use(cookieParser());
const session = require('express-session');
const port = process.env.PORT || 3000;
app.use(cors())


//iss session ki help se user ko validate krenge session ki id se user ki details mil jayengi isliye hum session bna rhe h


app.use(session({
    secret: "9527351144674ansh@11234",
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());


app.use("/", require("./Routes/AuthenticationRoute"))
// app.use("/movie",require("./Routes/MovieRoutes"))
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});