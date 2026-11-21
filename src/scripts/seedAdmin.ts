import mongoose from 'mongoose';
import { auth, closeAuthClient } from '../config/auth.js';
import { connectDB } from '../config/db.js';
import { User } from '../models/user.model.js';

/**
 * Creates (or promotes) the admin account securely.
 *
 * Admin accounts are never created through public registration — this
 * server-side script is the only path. It signs the account up through
 * Better Auth (so the password is hashed correctly) and then promotes
 * the role in the database:
 *
 *   npm run seed:admin
 */
const run = async (): Promise<void> => {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminName = process.env.ADMIN_NAME ?? 'PizzaHub Admin';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail) {
    console.error('✗ ADMIN_EMAIL is missing in .env');
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email: adminEmail });

  if (!existing) {
    if (!adminPassword) {
      console.error(
        '✗ ADMIN_PASSWORD is missing in .env — it is required to create the admin account.',
      );
      await mongoose.connection.close();
      await closeAuthClient();
      process.exit(1);
    }

    await auth.api.signUpEmail({
      body: { name: adminName, email: adminEmail, password: adminPassword },
    });
    console.log(`✓ Admin account created for "${adminEmail}" via Better Auth`);
  }

  const admin = await User.findOneAndUpdate(
    { email: adminEmail },
    {
      $set: {
        name: adminName,
        role: 'admin',
        isBlocked: false,
        emailVerified: true,
        subscriptionPlan: 'free',
        subscriptionExpiresAt: null,
      },
    },
    { returnDocument: 'after' },
  );

  if (!admin) {
    console.error('✗ Could not promote the admin account.');
    await mongoose.connection.close();
    await closeAuthClient();
    process.exit(1);
  }

  console.log(`✓ "${admin.email}" is now an admin (name: ${admin.name})`);
  if (existing) {
    console.log('  (the account already existed — role promoted to admin)');
  }

  await mongoose.connection.close();
  await closeAuthClient();
  process.exit(0);
};

run().catch(async (error) => {
  console.error('✗ Admin seed failed:', error);
  await mongoose.connection.close().catch(() => undefined);
  await closeAuthClient().catch(() => undefined);
  process.exit(1);
});
