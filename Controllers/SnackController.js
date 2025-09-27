const Snack = require("../Models/snackModel");
const { getIO } = require("../socket");
const TempBooking = require("../Models/TempBookingModel")
const cloudinary = require("../Middleware/Cloudinary");
const Theater=require("../Models/theaterModel")
const getSnacksByTheater = async (req, res) => {
    try {
        const { theaterId } = req.params;
        const snacks = await Snack.find({ theater: theaterId });
        return res.status(200).json({message:"Snacks fetched successfully",snacks});
    } catch (error) {
        console.error("Error fetching snacks:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};
const addSnack = async (req, res) => {
    const {
        theaterId,
        name,
        description,
        available,
        category,
        ingredients,
        quantity_options,
        rating,
    } = req.body;

    const snack_img = req.files?.['snack_img'] || [];
    if (!theaterId) {
        return res.status(400).json({ message: "Theater ID is required." });
    }

    const theaterExists = await Theater.findById(theaterId);
    if (!theaterExists) {
        return res.status(404).json({ message: "Theater not found." });
    }

    if (!name || !category || !quantity_options ) {
        return res.status(400).json({
            message: "Fields 'name','category', and 'quantity_options' are required.",
        });
    }
    const parsedRating = rating ? parseFloat(rating) : 0;
    if (parsedRating < 0 || parsedRating > 5) {
        return res.status(400).json({ message: "Rating must be between 0 and 5." });
    }
    const validCategories = ["Veg", "Non-Veg"];
    if (!validCategories.includes(category)) {
        return res.status(400).json({
            message: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        });
    }
    let parsedQuantityOptions = [];
    try {
        parsedQuantityOptions =
            typeof quantity_options === "string"
                ? JSON.parse(quantity_options)
                : quantity_options;

        if (!Array.isArray(parsedQuantityOptions) || parsedQuantityOptions.length === 0) {
            return res.status(400).json({ message: "quantity_options must be a non-empty array." });
        }

        for (const option of parsedQuantityOptions) {
            if (!option.unit || typeof option.unit !== "string" || !option.price) {
                return res.status(400).json({ message: "Each quantity option must have a 'unit' and 'price'." });
            }
            if (isNaN(option.price) || option.price < 0) {
                return res.status(400).json({ message: "Quantity option price must be a non-negative number." });
            }
        }
    } catch (err) {
        return res.status(400).json({
            message: "Invalid format for quantity_options. Must be a JSON array.",
        });
    }
    const parsedIngredients =
        typeof ingredients === "string"
            ? ingredients.split(",").map((i) => i.trim())
            : ingredients || [];

    const existingSnack = await Snack.findOne({ name: name.trim(), category,theater: theaterId });
    if (existingSnack) {
        return res.status(409).json({
            message: "A snack with this name and category already exists.",
        });
    }

    const snackImageUrls = [];
    for (const file of snack_img) {
        try {
            const upload = await cloudinary.uploader.upload(file.path);
            snackImageUrls.push(upload.secure_url);
        } catch (error) {
            console.error("Image upload failed:", error);
            return res.status(500).json({
                message: "Failed to upload snack image.",
                error: error.message,
            });
        }
    }


    try {
        const newSnack = new Snack({
            theater:theaterId,
            name: name.trim(),
            snack_img: snackImageUrls,
            description,
            available: available === "true" || available === true,
            category,
            ingredients: parsedIngredients,
            quantity_options: parsedQuantityOptions,
            rating: parsedRating,
        });

        await newSnack.save();
        const io = getIO();
        io.emit("snackAdded", newSnack);

        return res.status(201).json({
            message: "Snack added successfully.",
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
    const { _id } = req.query;

    if (!_id) {
        return res.status(400).json({ message: "Snack ID is required." });
    }

    try {
        const snack = await Snack.findByIdAndDelete(_id);
        if (!snack) {
            return res.status(404).json({ message: "Snack not found." });
        }
        const io = getIO();
        io.emit("snackDeleted", _id);
        return res.status(200).json({ message: "Snack deleted successfully." });
    } catch (error) {
        console.error("Error deleting snack:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}
const updateSnack = async (req, res) => {
    const { _id } = req.query;
    const updateData = req.body;

    if (!_id) {
        return res.status(400).json({ message: "Snack ID is required." });
    }
    if (updateData.quantity_options && typeof updateData.quantity_options === "string") {
        try {
            updateData.quantity_options = JSON.parse(updateData.quantity_options);
        } catch (err) {
            return res.status(400).json({ message: "Invalid quantity_options format" });
        }
    }
    if (updateData.ingredients && typeof updateData.ingredients === "string") {
        updateData.ingredients = updateData.ingredients.split(",").map((i) => i.trim());
    }
    const snack_img = req.files && req.files["snack_img"] ? req.files["snack_img"] : [];

    if (snack_img.length > 0) {
        try {
            const snackImageUrls = [];
            for (const file of snack_img) {
                const upload = await cloudinary.uploader.upload(file.path);
                snackImageUrls.push(upload.secure_url);
            }
            updateData.snack_img = snackImageUrls;
        } catch (err) {
            return res.status(400).json({ message: "Error uploading snack image", error: err.message });
        }
    }
    try {
        const updatedSnack = await Snack.findByIdAndUpdate(_id, updateData, { new: true });
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
    getSnacksByTheater, addSnack, deleteSnack, updateSnack
};