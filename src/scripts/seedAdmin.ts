import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/user.model.js';

/**
 * Securely promotes an existing account to admin.
 *
 * Admin accounts are never created through public registration — sign up
 * in the app with ADMIN_EMAIL first, then run this script once:
 *
 *   npm run seed:admin
 */
const run = async (): Promise<void> => {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminName = process.env.ADMIN_NAME ?? 'PizzaHub Admin';

  if (!adminEmail) {
    console.error('✗ ADMIN_EMAIL is missing in .env');
    process.exit(1);
  }

  await connectDB();

  const user = await User.findOne({ email: adminEmail });

  if (!user) {
    console.error(
      `✗ No account found for "${adminEmail}". ` +
        'Sign up in the PizzaHub client with this email first, then run the script again.',
    );
    await mongoose.connection.close();
    process.exit(1);
  }

  if (user.role === 'admin') {
    console.log(`✓ "${user.email}" is already an admin — nothing to do.`);
  } else {
    user.role = 'admin';
    user.isBlocked = false;
    await user.save();
    console.log(`✓ "${user.email}" has been promoted to admin.`);
  }

  // Keep the display name in sync with the environment.
  if (user.name !== adminName) {
    user.name = adminName;
    await user.save();
  }

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((error) => {
  console.error('✗ Admin seed failed:', error);
  process.exit(1);
});
