const users=require("../Models/userModel")
const googleUsers=require("../Models/googleUser")
const deleteProfile=async(req,res)=>{

}
const updateProfile=async(req,res)=>{

}
const getProfile = async (req, res) => {
  try {
    let user;
    if (req.userType === "google") {
      user = await googleUsers.findById(req.userId).select("-__v -createdAt -updatedAt");
    } else {
      user = await users.findById(req.userId).select("-password -cpassword -tokens -verifytoken -__v");
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};
module.exports={deleteProfile,updateProfile,getProfile}