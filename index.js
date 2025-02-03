const express=require("express");
const app=express();
require("./config/config");
const cookieParser=require("cookie-parser");
const cors=require("cors");
app.use(express.json());
app.use(cookieParser());
const port=process.env.PORT||3000;
app.use(cors())
app.use("/",require("./Routes/AuthenticationRoute"))
// app.use("/login",require("./Routes/AuthenticationRoute"))
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});