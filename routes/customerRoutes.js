import express from "express";
import {
  addCustomerForm,
  createCustomer,
  customerDashboard,
  editCustomerForm,
  listCustomers,
  showCustomer,
  toggleCustomerStatus,
  updateCustomer
} from "../controllers/customerController.js";

const router = express.Router();

router.get("/customer-dashboard", customerDashboard);
router.get("/customers", listCustomers);
router.get("/customers/add", addCustomerForm);
router.post("/customers/create", createCustomer);
router.get("/customers/:id", showCustomer);
router.get("/customers/:id/edit", editCustomerForm);
router.post("/customers/:id/update", updateCustomer);
router.post("/customers/:id/status", toggleCustomerStatus);

export default router;