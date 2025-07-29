const Snack=require("../Models/snackModel");
const { getIO } = require("../socket");
const cloudinary = require("../Middleware/Cloudinary");

const getAllSnacks = async (req, res) => {
  try {
    const snacks = await Snack.find();
    return res.status(200).json(snacks);
  } catch (error) {
    console.error("Error fetching snacks:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}



const addSnack = async (req, res) => {
  const {
    name,
    price,
    description,
    available,
    category,
    ingredients,
    quantity_options,
    rating,
  } = req.body;
 const snack_img = req.files && req.files['snack_img'] ? req.files['snack_img'] : [];
  
  if (!name || !category || !quantity_options) {
    return res.status(400).json({
      message: "Name, category, and quantity_options are required.",
    });
  }

  
  let parsedQuantityOptions = [];
  try {
    parsedQuantityOptions =
      typeof quantity_options === "string"
        ? JSON.parse(quantity_options)
        : quantity_options;
  } catch (err) {
    return res.status(400).json({
      message: "Invalid format for quantity_options. Must be a JSON array.",
    });
  }

  
  const parsedIngredients =
    typeof ingredients === "string"
      ? ingredients.split(",").map((i) => i.trim())
      : ingredients || [];

  
        const snackImageUrls = [];
        for (const file of snack_img) {
            try {
                console.log("Uploading to Cloudinary:", file.path);
                const upload = await cloudinary.uploader.upload(file.path);
                snackImageUrls.push(upload.secure_url);
            } catch (error) {
                console.error("Error while uploading the bill image:", error);
                return res.status(400).json({ message: "Error while uploading the poster image", error: error.message });
            }
        }

  try {
    const newSnack = new Snack({
      name,
      price,
      snack_img: snackImageUrls,
      description,
      available: available === "true" || available === true,
      category,
      ingredients: parsedIngredients,
      quantity_options: parsedQuantityOptions,
      rating: parseFloat(rating) || 0,
    });

    await newSnack.save();
    const io = getIO();
    io.emit("snackAdded", newSnack);
    return res.status(201).json({
      message: "Snack added successfully",
      snack: newSnack,
    });
  } catch (error) {
    console.error("Error adding snack:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};




const deleteSnack = async (req, res) => {
  const { snackId } = req.params;
    if (!snackId) {
        return res.status(400).json({ message: "Snack ID is required." });
    }
    try {   
        const snack = await Snack.findByIdAndDelete(snackId);
        if (!snack) {
            return res.status(404).json({ message: "Snack not found." });
        }
        const io = getIO();
        io.emit("snackDeleted", snackId);
        return res.status(200).json({ message: "Snack deleted successfully." });
    } catch (error) {
        console.error("Error deleting snack:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }   
}
const updateSnack = async (req, res) => {
  const { snackId } = req.params;
  const updateData = req.body;

  if (!snackId) {
    return res.status(400).json({ message: "Snack ID is required." });
  }

  try {
    const updatedSnack = await Snack.findByIdAndUpdate(snackId, updateData, { new: true });
    if (!updatedSnack) {
      return res.status(404).json({ message: "Snack not found." });
    }
    const io = getIO();
    io.emit("snackUpdated", updatedSnack);
    return res.status(200).json({ message: "Snack updated successfully", snack: updatedSnack });
  } catch (error) {
    console.error("Error updating snack:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}
module.exports = {
  getAllSnacks,addSnack,deleteSnack,updateSnack
};