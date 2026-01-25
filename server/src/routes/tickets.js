
 const express = require('express');
 const router = express.Router();
 const auth = require('../middleware/auth');
const { createTicket, getTickets, getTicket, updateTicket } = require('../controllers/ticketController');
const { createTicket, getTickets, getTicket, updateTicket, getTicketHistory } = require('../controllers/ticketController');
 
 // Create ticket
 router.post('/', auth, createTicket);
 
 // Get all tickets
 router.get('/', auth, getTickets);
 
 // Get single ticket
 router.get('/:id', auth, getTicket);
 
+// Get ticket status history
+router.get('/:id/history', auth, getTicketHistory);
+
 // Update ticket
 router.put('/:id', auth, updateTicket);
 
 module.exports = router;