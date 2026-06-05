const express = require('express');
const router = express.Router();
const apiTokenController = require('../controllers/ApiTokenController');

router.get('/', apiTokenController.getTokens);
router.post('/', apiTokenController.createToken);
router.delete('/:id', apiTokenController.deleteToken);

module.exports = router;
