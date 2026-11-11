import { Op } from "sequelize";
import { Customer, syncCustomerDatabase } from "../models/customerModel.js";

const normalize = (value) => String(value ?? "").trim();

export const customerHistoryPage = async (req, res) => {
  try {
    await syncCustomerDatabase();
    const history = [];
    const stats = {
      totalVisits: 0,
      totalTransactions: 0,
      totalSpending: 0,
      lastVisit: "No data yet"
    };

    res.render("customer-history", {
      title: "Customer History",
      history,
      stats,
      activeNav: "history",
      nav: { dashboard: false, customers: false, history: true, reports: false, settings: false },
      emptyStateMessage: "Customer transaction records are not connected yet. Connect your POS or sales module to view visit history."
    });
  } catch (error) {
    res.render("customer-history", {
      title: "Customer History",
      history: [],
      stats: { totalVisits: 0, totalTransactions: 0, totalSpending: 0, lastVisit: "No data yet" },
      activeNav: "history",
      nav: { dashboard: false, customers: false, history: true, reports: false, settings: false },
      emptyStateMessage: "Customer transaction records are not connected yet. Connect your POS or sales module to view visit history."
    });
  }
};

export const customerReportsPage = async (req, res) => {
  try {
    await syncCustomerDatabase();
    const [totalCustomers, newThisMonth, activeCustomers, inactiveCustomers, regularCustomers, vipCustomers] = await Promise.all([
      Customer.count(),
      Customer.count({ where: { createdAt: { [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
      Customer.count({ where: { status: "Active" } }),
      Customer.count({ where: { status: "Inactive" } }),
      Customer.count({ where: { customer_type: "Regular" } }),
      Customer.count({ where: { customer_type: "VIP" } })
    ]);

    res.render("customer-reports", {
      title: "Customer Reports",
      report: {
        totalCustomers,
        newThisMonth,
        activeCustomers,
        inactiveCustomers,
        regularCustomers,
        vipCustomers,
        returningCustomers: Math.max(0, totalCustomers - newThisMonth)
      },
      filters: {
        dateFrom: normalize(req.query.dateFrom),
        dateTo: normalize(req.query.dateTo),
        customerType: normalize(req.query.customerType),
        status: normalize(req.query.status)
      },
      activeNav: "reports",
      nav: { dashboard: false, customers: false, history: false, reports: true, settings: false }
    });
  } catch (error) {
    res.render("customer-reports", {
      title: "Customer Reports",
      report: {
        totalCustomers: 0,
        newThisMonth: 0,
        activeCustomers: 0,
        inactiveCustomers: 0,
        regularCustomers: 0,
        vipCustomers: 0,
        returningCustomers: 0
      },
      filters: { dateFrom: "", dateTo: "", customerType: "", status: "" },
      activeNav: "reports",
      nav: { dashboard: false, customers: false, history: false, reports: true, settings: false },
      error_msg: "Unable to generate customer report."
    });
  }
};
