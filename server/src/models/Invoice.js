const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  invoiceDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sender: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      name: '',
      address: '',
      city: '',
      postalCode: '',
      country: ''
    }
  },
  recipient: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      name: '',
      address: '',
      city: '',
      postalCode: '',
      country: ''
    }
  },
  items: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'USD'
  },
  taxRate: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  subtotal: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  total: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: (invoice) => {
      // Calculate subtotal and total before saving
      const subtotal = invoice.items.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice),
        0
      );
      const taxAmount = subtotal * (invoice.taxRate / 100);
      
      invoice.subtotal = subtotal;
      invoice.total = subtotal + taxAmount;
    },
    beforeUpdate: (invoice) => {
      // Recalculate if items or tax rate changed
      if (invoice.changed('items') || invoice.changed('taxRate')) {
        const subtotal = invoice.items.reduce(
          (sum, item) => sum + (item.quantity * item.unitPrice),
          0
        );
        const taxAmount = subtotal * (invoice.taxRate / 100);
        
        invoice.subtotal = subtotal;
        invoice.total = subtotal + taxAmount;
      }
    }
  }
});

// Define association
User.hasMany(Invoice);
Invoice.belongsTo(User);

module.exports = Invoice;