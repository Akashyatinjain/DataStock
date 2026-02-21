export const asyncHandler = (req,res,next) =>{
    Promise.resolve(fn(req,res,next)).catch(next);
}