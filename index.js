const express=require("express");
const app=express();
require("./config/config");
const cors=require("cors");
app.use(express.json());
const port=process.env.PORT||3000;

app.use("/",require("./Routes/AuthenticationRoute"))

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});