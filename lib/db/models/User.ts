import { DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../db';

// Define User attributes
interface UserAttributes {
  id: string;
  email: string;
  password?: string;
  emailVerified: boolean;
  name?: string;
  image?: string;
  googleId?: string;
  settings: {
    sender?: {
      name: string;
      address: string;
      city: string;
      postalCode: string;
      country: string;
    };
    logoUrl?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// Define optional attributes for User creation
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'emailVerified' | 'settings'> {}

// Define User model with instance methods
interface UserInstance extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const User = sequelize.define<UserInstance>(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        sender: {
          name: '',
          address: '',
          city: '',
          postalCode: '',
          country: ''
        },
        logoUrl: ''
      }
    }
  },
  {
    timestamps: true,
    hooks: {
      beforeCreate: async (user: UserInstance) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword: string = await bcrypt.hash(user.password, salt);
          user.password = hashedPassword;
        }
      },
      beforeUpdate: async (user: UserInstance) => {
        if (user.changed('password') && user.password) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword: string = await bcrypt.hash(user.password, salt);
          user.password = hashedPassword;
        }
      }
    }
  }
);

// Instance method to compare password
User.prototype.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  // If user has no password (e.g., Google auth user), return false
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

export default User;