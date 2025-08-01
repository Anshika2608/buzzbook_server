const express=require("express");
const router=express.Router();
const { getAllSnacks, addSnack, updateSnack, deleteSnack } = require("../Controllers/SnackController");
const authenticate = require("../Middleware/Authenticate");
const { uploadSnackImages } = require("../Middleware/Multer");
router.get("/snack_list",authenticate,  getAllSnacks);
router.post("/add_snack",authenticate,uploadSnackImages, addSnack);
router.patch("/update_snack",authenticate,  uploadSnackImages, updateSnack);
router.delete("/delete_snack", authenticate, deleteSnack);  
module.exports = router;
