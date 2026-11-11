import { Op } from "sequelize";
import { Customer, syncCustomerDatabase } from "../models/customerModel.js";

const normalizeValue = (value) => String(value ?? "").trim();

const buildCustomerWhere = (search, customerType, status) => {
  const where = {};
  const filters = [];

  if (search) {
    const term = `%${search.trim()}%`;
    filters.push({ customer_code: { [Op.like]: term } });
    filters.push({ first_name: { [Op.like]: term } });
    filters.push({ last_name: { [Op.like]: term } });
    filters.push({ email: { [Op.like]: term } });
    filters.push({ phone: { [Op.like]: term } });
    where[Op.or] = filters;
  }

  if (customerType) {
    where.customer_type = customerType;
  }

  if (status) {
    where.status = status;
  }

  return where;
};

const getCustomerStats = async () => {
  const total = await Customer.count();
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [newThisMonth, active, inactive, regular, vip] = await Promise.all([
    Customer.count({ where: { createdAt: { [Op.gte]: currentMonthStart } } }),
    Customer.count({ where: { status: "Active" } }),
    Customer.count({ where: { status: "Inactive" } }),
    Customer.count({ where: { customer_type: "Regular" } }),
    Customer.count({ where: { customer_type: "VIP" } })
  ]);

  return {
    total,
    newThisMonth,
    active,
    inactive,
    regular,
    vip,
    returning: Math.max(0, total - newThisMonth)
  };
};

const buildCustomerCode = () => {
  const stamp = Date.now().toString().slice(-8);
  return `CUST-${stamp}`;
};

const validateCustomerPayload = async (payload, currentId = null) => {
  const errors = {};
  const firstName = normalizeValue(payload.first_name);
  const lastName = normalizeValue(payload.last_name);
  const email = normalizeValue(payload.email).toLowerCase();
  const phone = normalizeValue(payload.phone);
  const address = normalizeValue(payload.address);
  const gender = normalizeValue(payload.gender);
  const birthday = normalizeValue(payload.birthday);
  const customerType = normalizeValue(payload.customer_type) || "Regular";
  const status = normalizeValue(payload.status) || "Active";

  if (!firstName) errors.first_name = "First name is required.";
  if (!lastName) errors.last_name = "Last name is required.";
  if (!gender) errors.gender = "Gender is required.";
  if (!birthday) errors.birthday = "Birthday is required.";
  if (!address) errors.address = "Complete address is required.";

  if (!email) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address.";
  } else {
    const existingRecord = await Customer.findOne({
      where: {
        email,
        ...(currentId ? { id: { [Op.ne]: Number(currentId) } } : {})
      }
    });

    if (existingRecord) {
      errors.email = "This email address is already registered.";
    }
  }

  if (!phone) {
    errors.phone = "Contact number is required.";
  } else if (!/^[0-9+()\-\s]{7,20}$/.test(phone)) {
    errors.phone = "Contact number format is invalid.";
  }

  if (!customerType || !["Regular", "VIP"].includes(customerType)) {
    errors.customer_type = "Customer type must be Regular or VIP.";
  }

  if (!status || !["Active", "Inactive"].includes(status)) {
    errors.status = "Account status must be Active or Inactive.";
  }

  return {
    ...payload,
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    address,
    gender,
    birthday,
    customer_type: customerType,
    status,
    errors
  };
};

export const customerDashboard = async (req, res) => {
  try {
    await syncCustomerDatabase();
    const stats = await getCustomerStats();
    const recentCustomers = await Customer.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      attributes: ["id", "customer_code", "first_name", "last_name", "email", "phone", "customer_type", "status", "createdAt"]
    });

    res.render("customer-dashboard", {
      title: "JAPZGRILL Dashboard",
      stats,
      recentCustomers,
      activeNav: "dashboard",
      nav: { dashboard: true, customers: false, history: false, reports: false, settings: false }
    });
  } catch (error) {
    res.render("customer-dashboard", {
      title: "JAPZGRILL Dashboard",
      stats: { total: 0, newThisMonth: 0, returning: 0, active: 0, inactive: 0, regular: 0, vip: 0 },
      recentCustomers: [],
      activeNav: "dashboard",
      nav: { dashboard: true, customers: false, history: false, reports: false, settings: false },
      error_msg: "Unable to load customer dashboard data right now."
    });
  }
};

export const listCustomers = async (req, res) => {
  try {
    await syncCustomerDatabase();
    const search = normalizeValue(req.query.search);
    const customerType = normalizeValue(req.query.customerType);
    const status = normalizeValue(req.query.status);
    const sortBy = normalizeValue(req.query.sortBy) || "createdAt";
    const order = normalizeValue(req.query.order) === "asc" ? "ASC" : "DESC";
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = 10;
    const offset = (page - 1) * limit;

    const where = buildCustomerWhere(search, customerType, status);
    const result = await Customer.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, order]],
      attributes: ["id", "customer_code", "first_name", "last_name", "email", "phone", "customer_type", "status", "createdAt"]
    });

    res.render("customers", {
      title: "Customer Management",
      customers: result.rows,
      totalCustomers: result.count,
      page,
      pages: Math.max(1, Math.ceil(result.count / limit)),
      search,
      customerType,
      status,
      sortBy,
      order,
      activeNav: "customers",
      nav: { dashboard: false, customers: true, history: false, reports: false, settings: false }
    });
  } catch (error) {
    res.render("customers", {
      title: "Customer Management",
      customers: [],
      totalCustomers: 0,
      page: 1,
      pages: 1,
      search: "",
      customerType: "",
      status: "",
      sortBy: "createdAt",
      order: "DESC",
      activeNav: "customers",
      nav: { dashboard: false, customers: true, history: false, reports: false, settings: false },
      error_msg: "Unable to load customer records."
    });
  }
};

export const addCustomerForm = (req, res) => {
  res.render("add-customer", {
    title: "Add Customer",
    customer: {},
    errors: {},
    activeNav: "customers",
    nav: { dashboard: false, customers: true, history: false, reports: false, settings: false }
  });
};

export const createCustomer = async (req, res) => {
  try {
    await syncCustomerDatabase();
    const payload = await validateCustomerPayload(req.body);

    if (Object.keys(payload.errors).length > 0) {
      return res.status(400).render("add-customer", {
        title: "Add Customer",
        customer: payload,
        errors: payload.errors,
        activeNav: "customers",
        nav: { dashboard: false, customers: true, history: false, reports: false, settings: false },
        error_msg: "Please correct the highlighted fields."
      });
    }

    const customer = await Customer.create({
      customer_code: buildCustomerCode(),
      first_name: payload.first_name,
      last_name: payload.last_name,
      gender: payload.gender,
      birthday: payload.birthday,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      customer_type: payload.customer_type,
      status: payload.status
    });

    req.flash("success_msg", "Customer added successfully.");
    res.redirect(`/customers/${customer.id}`);
  } catch (error) {
    res.status(500).render("add-customer", {
      title: "Add Customer",
      customer: req.body,
      errors: { submit: "Unable to save customer record. Please try again." },
      activeNav: "customers",
      nav: { dashboard: false, customers: true, history: false, reports: false, settings: false },
      error_msg: "Unable to save customer record. Please try again."
    });
  }
};

export const showCustomer = async (req, res) => {
  try {
    await syncCustomerDatabase();
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      req.flash("error_msg", "Customer not found.");
      return res.redirect("/customers");
    }

    res.render("customer-details", {
      title: "Customer Details",
      customer,
      activeNav: "customers",
      nav: { dashboard: false, customers: true, history: false, reports: false, settings: false }
    });
  } catch (error) {
    req.flash("error_msg", "Unable to load customer details.");
    res.redirect("/customers");
  }
};

export const editCustomerForm = async (req, res) => {
  try {
    await syncCustomerDatabase();
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      req.flash("error_msg", "Customer not found.");
      return res.redirect("/customers");
    }

    res.render("edit-customer", {
      title: "Edit Customer",
      customer,
      errors: {},
      activeNav: "customers",
      nav: { dashboard: false, customers: true, history: false, reports: false, settings: false }
    });
  } catch (error) {
    req.flash("error_msg", "Unable to load customer details for editing.");
    res.redirect("/customers");
  }
};

export const updateCustomer = async (req, res) => {
  try {
    await syncCustomerDatabase();
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      req.flash("error_msg", "Customer not found.");
      return res.redirect("/customers");
    }

    const payload = await validateCustomerPayload(req.body, customer.id);

    if (Object.keys(payload.errors).length > 0) {
      return res.status(400).render("edit-customer", {
        title: "Edit Customer",
        customer: { ...customer.toJSON(), ...payload },
        errors: payload.errors,
        activeNav: "customers",
        nav: { dashboard: false, customers: true, history: false, reports: false, settings: false },
        error_msg: "Please correct the highlighted fields."
      });
    }

    await customer.update({
      first_name: payload.first_name,
      last_name: payload.last_name,
      gender: payload.gender,
      birthday: payload.birthday,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      customer_type: payload.customer_type,
      status: payload.status
    });

    req.flash("success_msg", "Customer information updated successfully.");
    res.redirect(`/customers/${customer.id}`);
  } catch (error) {
    req.flash("error_msg", "Unable to update customer details.");
    res.redirect("/customers");
  }
};

export const toggleCustomerStatus = async (req, res) => {
  try {
    await syncCustomerDatabase();
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      req.flash("error_msg", "Customer not found.");
      return res.redirect("/customers");
    }

    const nextStatus = normalizeValue(req.body.status) || (customer.status === "Active" ? "Inactive" : "Active");
    await customer.update({ status: nextStatus });

    req.flash("success_msg", `Customer status updated to ${nextStatus}.`);
    res.redirect("/customers");
  } catch (error) {
    req.flash("error_msg", "Unable to update customer status.");
    res.redirect("/customers");
  }
};
