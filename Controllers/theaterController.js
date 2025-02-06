const theater=require("../Models/theaterModel");
const getTheater=async(req,res)=>{
    try{
        const {location}=req.params;
        const theaters= await theater.find({location})
        if(!theaters.length){
           return res.status(400).json({message:`No theater available at this ${location}`})
        }
        else{
           return res.status(201).json({message:"list of theaters recieved successfully",theaters})
        }
    }catch(error){
       return res.status(500).json({message:"Error in fetching list of theaters",error:error.message })
    }


}
const addTheater=async(req,res)=>{

}

module.exports={getTheater,addTheater}