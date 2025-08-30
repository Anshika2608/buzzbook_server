const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({
    destination:(req,file,callback)=>{
        callback(null,"./uploads")
    }, 
    filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        callback(null, `image-${uniqueSuffix}${path.extname(file.originalname)}`); 
    }

});

const isImage = (req, file, callback) => {
    const allowedFileTypes = /jpeg|jpg|png|gif/;

    const mimeTypeIsValid = file.mimetype.startsWith("image/");

    const extnameIsValid = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimeTypeIsValid && extnameIsValid) {
        callback(null, true);
    } else if (!mimeTypeIsValid) {
        callback(new Error("File type is not an image. Only image files are allowed."));
    } else if (!extnameIsValid) {
        callback(new Error("File extension is not allowed. Only JPEG, JPG, PNG, and GIF files are permitted."));
    } else {
        callback(new Error("File is not allowed."));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 2000000 }, 
    fileFilter: isImage
})
const uploadMultiple = upload.fields([
    { name: 'poster_img', maxCount: 3 },
    {name:"cast_img",maxCount:6}
    
]);
const uploadSnackImages = upload.fields([{ name: 'snack_img', maxCount: 2 }]);

module.exports = {uploadMultiple,uploadSnackImages};