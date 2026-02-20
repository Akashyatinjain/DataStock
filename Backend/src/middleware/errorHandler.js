export const errorHandler = (req,res,err,next)=>{
    console.error(err);
    res.status(500).json({message:"Internal server error"});
}