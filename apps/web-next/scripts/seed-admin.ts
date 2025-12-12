import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// MongoDB URI - update this with your MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://udeshansanju_db_user:icA6PBeg8evJmM0r@cluster0.ukmhazu.mongodb.net/metro_bus?retryWrites=true&w=majority&appName=Cluster0';

// User Schema definition (inline to avoid import issues)
interface IUser {
  email: string;
  passwordHash: string;
  role: 'admin' | 'owner' | 'driver' | 'finance' | 'passenger';
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
  };
  isVerified: boolean;
  isActive: boolean;
  refreshTokens: string[];
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'owner', 'driver', 'finance', 'passenger'], default: 'passenger' },
    profile: {
      firstName: String,
      lastName: String,
      phone: String,
      address: String,
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    refreshTokens: { type: [String], default: [] },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

async function seedAdminUsers() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    console.log('   URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = [
      {
        email: 'admin@metrobus.com',
        password: 'Admin@123',
        role: 'admin',
        profile: {
          firstName: 'System',
          lastName: 'Administrator',
          phone: '+94771234567',
          address: 'Metro Bus HQ, Colombo',
        },
      },
      {
        email: 'owner@metrobus.com',
        password: 'Owner@123',
        role: 'owner',
        profile: {
          firstName: 'Bus',
          lastName: 'Owner',
          phone: '+94772345678',
          address: 'Colombo, Sri Lanka',
        },
      },
      {
        email: 'driver@metrobus.com',
        password: 'Driver@123',
        role: 'driver',
        profile: {
          firstName: 'Test',
          lastName: 'Driver',
          phone: '+94773456789',
          address: 'Kandy, Sri Lanka',
        },
      },
      {
        email: 'finance@metrobus.com',
        password: 'Finance@123',
        role: 'finance',
        profile: {
          firstName: 'Finance',
          lastName: 'Manager',
          phone: '+94774567890',
          address: 'Metro Bus Finance Dept, Colombo',
        },
      },
    ];

    console.log('👥 Creating system users...\n');

    for (const userData of users) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        // Delete and recreate to ensure correct schema
        await User.deleteOne({ email: userData.email });
        console.log(`🔄 Deleted existing user: ${userData.email}`);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await User.create({
        email: userData.email,
        passwordHash: hashedPassword,
        role: userData.role,
        profile: userData.profile,
        isVerified: true,
        isActive: true,
        refreshTokens: [],
      });

      console.log(`✅ Created ${userData.role.toUpperCase()} user`);
      console.log(`   📧 Email: ${userData.email}`);
      console.log(`   🔑 Password: ${userData.password}`);
      console.log(`   👤 ID: ${user._id}\n`);
    }

    console.log('🎉 Admin users seeding completed!\n');
    console.log('📝 Login Credentials Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👨‍💼 ADMIN:    admin@metrobus.com    / Admin@123');
    console.log('🏢 OWNER:    owner@metrobus.com    / Owner@123');
    console.log('� DRIVER:   driver@metrobus.com   / Driver@123');
    console.log('�💰 FINANCE:  finance@metrobus.com  / Finance@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📌 Note: Passengers should register via /register page');
    console.log('📌 Access dashboards at: /admin, /owner, /driver, /finance, /dashboard\n');

  } catch (error: any) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

seedAdminUsers();
