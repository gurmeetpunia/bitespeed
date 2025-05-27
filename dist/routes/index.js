"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const identifyController_1 = require("../controllers/identifyController");
const router = (0, express_1.Router)();
// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Service is running' });
});
// Main identify endpoint
router.post('/identify', identifyController_1.identifyController);
exports.default = router;
//# sourceMappingURL=index.js.map