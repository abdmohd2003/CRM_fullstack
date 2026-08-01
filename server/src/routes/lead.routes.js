const express = require('express')

const router = express.Router()
const { createLead, getAllLeads, getLeadById, updateLead, deleteLead, bulkImportLeads } = require('../controllers/lead.controller')


router.post('/bulk-import', bulkImportLeads)

router.post('/', createLead)
router.get('/', getAllLeads)
router.get('/:id', getLeadById)
router.put('/:id', updateLead)
router.delete('/:id', deleteLead)


module.exports = router