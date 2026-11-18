import Stripe from 'stripe';
import { env } from '../../config/env.js';
import { PREMIUM_PERIOD_DAYS } from '../../constants/index.js';
import { Transaction } from '../../models/transaction.model.js';
import { User } from '../../models/user.model.js';
import { ApiError } from '../../utils/apiError.js';
import { isPremiumActive } from '../../utils/premium.js';
import type { AuthUser } from '../../interfaces/auth.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

const msPerDay = 24 * 60 * 60 * 1000;

const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * msPerDay);

/** Stripe works in minor units (cents) — the API exposes major units (9.99 USD). */
const toMajorUnits = (amount?: number | null): number => (amount ?? 0) / 100;

/** Subscription ids can arrive as strings or expanded objects depending on the API version. */
const asSubscriptionId = (subscription: unknown): string | null => {
  if (typeof subscription === 'string') return subscription;
  if (subscription && typeof subscription === 'object' && 'id' in subscription) {
    return String((subscription as { id: unknown }).id);
  }
  return null;
};

/**
 * Resolves when the paid period ends by reading the subscription from
 * Stripe, falling back to a fixed period when it cannot be retrieved.
 */
const resolvePeriodEnd = async (subscriptionId: unknown): Promise<Date> => {
  const fallback = addDays(new Date(), PREMIUM_PERIOD_DAYS);
  const id = asSubscriptionId(subscriptionId);
  if (!id) return fallback;

  try {
    const subscription = await stripe.subscriptions.retrieve(id);
    const firstItem = subscription.items.data[0];
    // Newer Stripe API versions moved current_period_end to the subscription item.
    const periodEnd = (firstItem as { current_period_end?: number } | undefined)?.current_period_end;

    return periodEnd ? new Date(periodEnd * 1000) : fallback;
  } catch {
    return fallback;
  }
};

/* ────────────────────────── Checkout session ────────────────────────── */

/**
 * Creates a Premium subscription checkout session for the signed-in vendor.
 * The vendor is always taken from the verified token, so a vendor can never
 * create a session on behalf of someone else.
 */
export const createCheckoutSession = async (vendor: AuthUser) => {
  if (isPremiumActive(vendor)) {
    throw new ApiError(400, 'You are already enjoying the Premium plan.');
  }

  const clientOrigin = env.clientOrigins[0] ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    // Stripe picks the available payment methods automatically.
    customer_email: vendor.email,
    client_reference_id: vendor.id,
    metadata: { vendorId: vendor.id },
    subscription_data: { metadata: { vendorId: vendor.id } },
    line_items: [{ price: env.STRIPE_PREMIUM_PRICE_ID, quantity: 1 }],
    success_url: `${clientOrigin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientOrigin}/payment/cancel`,
  });

  return { sessionId: session.id, url: session.url };
};

/** Lets the Payment Success page confirm the state of a session it owns. */
export const getSessionStatus = async (vendor: AuthUser, sessionId: string) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const sessionVendorId = session.metadata?.vendorId ?? session.client_reference_id;

  if (sessionVendorId !== vendor.id) {
    throw new ApiError(403, 'You are not allowed to view this payment session.');
  }

  const vendorDoc = await User.findById(vendor.id);

  return {
    paymentStatus: session.payment_status,
    sessionStatus: session.status,
    subscriptionPlan: vendorDoc?.subscriptionPlan ?? 'free',
  };
};

/* ────────────────────────── Webhook events ────────────────────────── */

/**
 * The ONLY place Premium is activated. The frontend success redirect is
 * never trusted — this handler runs after Stripe's signature is verified.
 */
const handleCheckoutCompleted = async (session: Stripe.Checkout.Session): Promise<void> => {
  const vendorId = session.metadata?.vendorId ?? session.client_reference_id;
  if (!vendorId) {
    console.warn('⚠ checkout.session.completed without a vendorId — skipped');
    return;
  }

  const vendor = await User.findById(vendorId);
  if (!vendor) {
    console.warn(`⚠ checkout.session.completed for missing vendor ${vendorId} — skipped`);
    return;
  }

  const subscriptionId = asSubscriptionId(session.subscription);

  // Webhooks can be retried — make the transaction write idempotent.
  const alreadyRecorded = await Transaction.exists({ stripeSessionId: session.id });
  if (!alreadyRecorded) {
    await Transaction.create({
      vendorId,
      plan: 'premium',
      amount: toMajorUnits(session.amount_total),
      currency: session.currency ?? 'usd',
      stripeSessionId: session.id,
      stripeSubscriptionId: subscriptionId,
      status: session.payment_status === 'paid' ? 'paid' : 'pending',
    });
  }

  await User.findByIdAndUpdate(vendorId, {
    subscriptionPlan: 'premium',
    subscriptionExpiresAt: await resolvePeriodEnd(session.subscription),
    stripeSubscriptionId: subscriptionId,
  });

  console.log(`✓ Premium activated for vendor ${vendor.email}`);
};

/**
 * Renewal invoices extend the subscription. The first invoice is skipped
 * because checkout.session.completed already recorded that payment.
 */
const handleInvoicePaid = async (invoice: Stripe.Invoice): Promise<void> => {
  const billingReason = (invoice as { billing_reason?: string | null }).billing_reason;
  if (billingReason === 'subscription_create') return;

  const subscriptionId = asSubscriptionId(
    (invoice as { subscription?: unknown }).subscription,
  );
  if (!subscriptionId) return;

  const vendor = await User.findOne({ stripeSubscriptionId: subscriptionId });
  if (!vendor) return;

  const invoiceId = String(invoice.id ?? '');
  const alreadyRecorded = invoiceId
    ? await Transaction.exists({ stripeSessionId: invoiceId })
    : true;
  if (alreadyRecorded) return;

  await Transaction.create({
    vendorId: vendor._id,
    plan: 'premium',
    amount: toMajorUnits(invoice.amount_paid),
    currency: invoice.currency ?? 'usd',
    stripeSessionId: invoiceId,
    stripeSubscriptionId: subscriptionId,
    status: 'paid',
  });

  // Extend from the current expiry (or now) so late webhooks never shorten a plan.
  const currentExpiry = vendor.subscriptionExpiresAt ?? new Date();
  const base = currentExpiry.getTime() > Date.now() ? currentExpiry : new Date();

  await User.findByIdAndUpdate(vendor._id, {
    subscriptionExpiresAt: addDays(base, PREMIUM_PERIOD_DAYS),
  });

  console.log(`✓ Premium renewed for vendor ${vendor.email}`);
};

/** Cancellations through Stripe immediately drop the vendor back to Free. */
const handleSubscriptionDeleted = async (subscription: Stripe.Subscription): Promise<void> => {
  const vendorId = subscription.metadata?.vendorId;

  const vendor = await User.findById(vendorId ?? undefined) ??
    await User.findOne({ stripeSubscriptionId: subscription.id });

  if (!vendor) return;

  await User.findByIdAndUpdate(vendor._id, {
    subscriptionPlan: 'free',
    subscriptionExpiresAt: null,
    stripeSubscriptionId: null,
  });

  console.log(`✓ Premium cancelled for vendor ${vendor.email} — moved back to Free plan`);
};

/** Verifies the Stripe signature and dispatches the supported events. */
export const handleStripeWebhook = async (rawBody: Buffer, signature: string | undefined) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature ?? '', env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    throw new ApiError(400, `Stripe webhook verification failed: ${(error as Error).message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    default:
      // Other events are acknowledged without action.
      break;
  }

  return event;
};
