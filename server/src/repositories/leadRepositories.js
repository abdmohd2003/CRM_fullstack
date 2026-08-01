const Lead=require('../models/Lead')

const createLead=async(leadData)=>{

    return await Lead.create(leadData)
}

const getAllLeads=async()=>{

return await Lead.find().sort({createdAt: -1})

}

const getLeadById=async(id)=>{

    return await Lead.findById(id)

}

const updateLead=async (id,leadData)=>{
    return await Lead.findByIdAndUpdate(id,leadData,{
        new:true,
        runValidators:true
    })
}

const deleteLead=async(id)=>{
    return await Lead.findByIdAndDelete(id)
}

const getLeadByEmail=async()=>{
    return await Lead.findOne({
        email
    })
}

module.exports={

    createLead,
    getAllLeads,
    getLeadById,
    updateLead,
    deleteLead,
    getLeadByEmail
}   
