import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Customer = sequelize.define("Customer", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customer_code: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  gender: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  birthday: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(30),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  customer_type: {
    type: DataTypes.ENUM("Regular", "VIP"),
    allowNull: false,
    defaultValue: "Regular"
  },
  status: {
    type: DataTypes.ENUM("Active", "Inactive"),
    allowNull: false,
    defaultValue: "Active"
  }
}, {
  tableName: "customers",
  timestamps: true,
  underscored: false
});

let customerSyncPromise;

export const syncCustomerDatabase = () => {
  if (!customerSyncPromise) {
    customerSyncPromise = (async () => {
      await sequelize.authenticate();
      await Customer.sync();
      return true;
    })().catch((error) => {
      console.error("Customer database initialization failed:", error.message);
      throw error;
    });
  }

  return customerSyncPromise;
};
