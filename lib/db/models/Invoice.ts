import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';
import User from './User';

// Define Invoice Item interface
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

// Define Invoice attributes
interface InvoiceAttributes {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate?: Date;
  logoUrl?: string;
  sender: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  recipient: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  items: InvoiceItem[];
  currency: string;
  taxRate: number;
  subtotal: number;
  total: number;
  UserId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define optional attributes for Invoice creation
interface InvoiceCreationAttributes extends Optional<InvoiceAttributes, 'id' | 'invoiceNumber' | 'subtotal' | 'total'> {}

// Define Invoice model
interface InvoiceInstance extends Model<InvoiceAttributes, InvoiceCreationAttributes>, InvoiceAttributes {}

const Invoice = sequelize.define<InvoiceInstance>(
  'Invoice',
  {
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
    },
    UserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  },
  {
    timestamps: true,
    hooks: {
      beforeCreate: (invoice: InvoiceInstance) => {
        // Calculate subtotal and total before saving
        const subtotal = invoice.items.reduce(
          (sum, item) => sum + (item.quantity * item.unitPrice),
          0
        );
        const taxAmount = subtotal * (invoice.taxRate / 100);
        
        invoice.subtotal = subtotal;
        invoice.total = subtotal + taxAmount;
      },
      beforeUpdate: (invoice: InvoiceInstance) => {
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
  }
);

// Define association
User.hasMany(Invoice);
Invoice.belongsTo(User);

export default Invoice;