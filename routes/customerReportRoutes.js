import express from "express";
import { customerHistoryPage, customerReportsPage } from "../controllers/customerReportController.js";

const router = express.Router();

router.get("/customer-history", customerHistoryPage);
router.get("/customer-reports", customerReportsPage);

export default router;