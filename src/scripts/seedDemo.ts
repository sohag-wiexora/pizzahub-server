import mongoose, { Types } from 'mongoose';
import { connectDB } from '../config/db.js';
import { MenuItem } from '../models/menuItem.model.js';
import { User } from '../models/user.model.js';


const img = (id: string, w = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const premiumUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

const vendors = [
  {
    key: 'slice-town',
    _id: new Types.ObjectId('665000000000000000000001'),
    name: 'Samiul Karim',
    email: 'owner@slicetown.com',
    businessName: 'Slice Town',
    subscriptionPlan: 'premium' as const,
    subscriptionExpiresAt: premiumUntil,
  },
  {
    key: 'venezia',
    _id: new Types.ObjectId('665000000000000000000002'),
    name: 'Nadia Islam',
    email: 'owner@pizzavenezia.com',
    businessName: 'Pizza Venezia',
    subscriptionPlan: 'free' as const,
    subscriptionExpiresAt: null,
  },
  {
    key: 'napoli',
    _id: new Types.ObjectId('665000000000000000000003'),
    name: 'Tanvir Hasan',
    email: 'owner@napoliexpress.com',
    businessName: 'Napoli Express',
    subscriptionPlan: 'premium' as const,
    subscriptionExpiresAt: premiumUntil,
  },
  {
    key: 'crust-lab',
    _id: new Types.ObjectId('665000000000000000000004'),
    name: 'Rezaul Haque',
    email: 'owner@crustlab.com',
    businessName: 'The Crust Lab',
    subscriptionPlan: 'free' as const,
    subscriptionExpiresAt: null,
  },
];

interface DemoItem {
  vendorKey: string;
  itemName: string;
  category: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  status: 'approved' | 'pending' | 'rejected' | 'inactive';
  rating: number;
  reviewCount: number;
  createdDaysAgo: number;
}

const items: DemoItem[] = [
  {
    vendorKey: 'slice-town',
    itemName: 'Margherita Classica',
    category: 'Classic Pizzas',
    description:
      'The Neapolitan original — San Marzano tomato sauce, fior di latte mozzarella, torn basil and a charred wood-fired crust finished with Sicilian olive oil.',
    price: 12.99,
    location: 'Dhanmondi, Dhaka',
    images: [
      img('photo-1513104890138-7c749659a591'),
      img('photo-1604382354936-07c5d9983bd3'),
    ],
    status: 'approved',
    rating: 4.8,
    reviewCount: 132,
    createdDaysAgo: 40,
  },
  {
    vendorKey: 'napoli',
    itemName: 'Pepperoni Inferno',
    category: 'Meat Lovers',
    description:
      'Double cup-and-char pepperoni, bubbling provolone, a whisper of Calabrian chilli honey. Our best-selling bake for six years running.',
    price: 14.99,
    location: 'Banani, Dhaka',
    images: [
      img('photo-1574071318508-1cdbab80d002'),
      img('photo-1593560708920-61dd98c46a4e'),
    ],
    status: 'approved',
    rating: 4.9,
    reviewCount: 208,
    createdDaysAgo: 38,
  },
  {
    vendorKey: 'venezia',
    itemName: 'Veggie Garden Delight',
    category: 'Vegetarian Pizzas',
    description:
      'Roasted peppers, cherry tomatoes, black olives, mushrooms and fresh arugula over mozzarella, drizzled with balsamic glaze right out of the oven.',
    price: 11.49,
    location: 'Gulshan, Dhaka',
    images: [
      img('photo-1571407970349-bc81e7e96d47'),
      img('photo-1595854341625-f33ee10dbf94'),
    ],
    status: 'approved',
    rating: 4.6,
    reviewCount: 94,
    createdDaysAgo: 35,
  },
  {
    vendorKey: 'slice-town',
    itemName: 'BBQ Chicken Blast',
    category: 'Meat Lovers',
    description:
      'Smoky house BBQ sauce, chargrilled chicken, sweet red onion and a mozzarella–cheddar blend, topped with fresh coriander.',
    price: 13.99,
    location: 'Dhanmondi, Dhaka',
    images: [
      img('photo-1590947132387-155cc02f3212'),
      img('photo-1548369937-47519962c11a'),
    ],
    status: 'approved',
    rating: 4.7,
    reviewCount: 117,
    createdDaysAgo: 33,
  },
  {
    vendorKey: 'napoli',
    itemName: 'Quattro Formaggi',
    category: 'Specialty / Gourmet Pizzas',
    description:
      'Four cheeses done properly — mozzarella, gorgonzola, fontina and 24-month parmesan, finished with a wildflower honey drizzle.',
    price: 15.49,
    location: 'Banani, Dhaka',
    images: [
      img('photo-1565895405138-6c3a1555da6a'),
      img('photo-1601924994987-69e26d50dc26'),
    ],
    status: 'approved',
    rating: 4.9,
    reviewCount: 156,
    createdDaysAgo: 30,
  },
  {
    vendorKey: 'crust-lab',
    itemName: 'Carnivore Feast',
    category: 'Meat Lovers',
    description:
      'For the brave: pepperoni, spiced sausage, smoked bacon, honey-glazed ham and double mozzarella on a thin, crackling crust.',
    price: 16.99,
    location: 'Zindabazar, Sylhet',
    images: [
      img('photo-1594007654729-407eedc4be65'),
      img('photo-1555072956-7758afb20e8f'),
    ],
    status: 'approved',
    rating: 4.8,
    reviewCount: 88,
    createdDaysAgo: 28,
  },
  {
    vendorKey: 'venezia',
    itemName: 'Hawaiian Sunset',
    category: 'Classic Pizzas',
    description:
      'Smoked ham, caramelised pineapple and mozzarella — the debate-starter that keeps winning hearts, one slice at a time.',
    price: 12.49,
    location: 'Gulshan, Dhaka',
    images: [
      img('photo-1585238342024-78d387f4a707'),
      img('photo-1565299624946-b28f40a0ae38'),
    ],
    status: 'approved',
    rating: 4.4,
    reviewCount: 63,
    createdDaysAgo: 25,
  },
  {
    vendorKey: 'napoli',
    itemName: 'Black Truffle Mushroom',
    category: 'Specialty / Gourmet Pizzas',
    description:
      'Wild mushrooms sautéed in thyme butter, fontina, a créme fraîche base and shaved black truffle — pure fine-dining on a crust.',
    price: 18.99,
    location: 'Banani, Dhaka',
    images: [
      img('photo-1600628421055-4d30de868b8f'),
      img('photo-1630384060421-cb20d0e0649d'),
    ],
    status: 'approved',
    rating: 5,
    reviewCount: 41,
    createdDaysAgo: 22,
  },
  {
    vendorKey: 'slice-town',
    itemName: 'Fire Glazed BBQ Wings',
    category: 'Sides & Appetizers',
    description:
      'Eight wings lacquered in our smoky-sweet fire glaze, showered with toasted sesame and chives, served with gold ranch dip.',
    price: 7.99,
    location: 'Dhanmondi, Dhaka',
    images: [
      img('photo-1608039829572-78524f79c4c7'),
      img('photo-1527477396000-e27163b481c2'),
    ],
    status: 'approved',
    rating: 4.7,
    reviewCount: 71,
    createdDaysAgo: 20,
  },
  {
    vendorKey: 'crust-lab',
    itemName: 'Golden Garlic Breadsticks',
    category: 'Sides & Appetizers',
    description:
      'Hand-stretched dough baked with cultured garlic butter and pecorino, served with slow-simmered marinara.',
    price: 5.99,
    location: 'Zindabazar, Sylhet',
    images: [
      img('photo-1541592106381-b31e9677c0e5'),
      img('photo-1566073771259-6a8506099945'),
    ],
    status: 'approved',
    rating: 4.5,
    reviewCount: 52,
    createdDaysAgo: 18,
  },
  {
    vendorKey: 'venezia',
    itemName: 'Molten Chocolate Dessert Pizza',
    category: 'Beverages & Desserts',
    description:
      'Bittersweet Valrhona chocolate melted over a crisp sweet crust, crowned with berries and a snowfall of icing sugar.',
    price: 9.49,
    location: 'Gulshan, Dhaka',
    images: [
      img('photo-1551024506-0bccd828d307'),
      img('photo-1587314168485-3236d6710814'),
    ],
    status: 'approved',
    rating: 4.9,
    reviewCount: 67,
    createdDaysAgo: 15,
  },
  {
    vendorKey: 'slice-town',
    itemName: 'Iced Mint Lemonade',
    category: 'Beverages & Desserts',
    description:
      'Hand-pressed lemons, muddled mint and cane sugar over crushed ice — the perfect cool-down between slices.',
    price: 3.99,
    location: 'Dhanmondi, Dhaka',
    images: [
      img('photo-1437418747212-8d9709afab22'),
      img('photo-1621263764928-df1444c5e859'),
    ],
    status: 'approved',
    rating: 4.6,
    reviewCount: 38,
    createdDaysAgo: 14,
  },
  {
    vendorKey: 'crust-lab',
    itemName: 'Sicilian Pesto Special',
    category: 'Specialty / Gourmet Pizzas',
    description:
      'Basil pesto base, sun-dried tomatoes, goat cheese and toasted pine nuts — awaiting its first review from our culinary team.',
    price: 14.49,
    location: 'Zindabazar, Sylhet',
    images: [img('photo-1565299624946-b28f40a0ae38')],
    status: 'pending',
    rating: 0,
    reviewCount: 0,
    createdDaysAgo: 2,
  },
  {
    vendorKey: 'venezia',
    itemName: 'Truffle Fries Basket',
    category: 'Sides & Appetizers',
    description:
      'Crispy hand-cut fries tossed in truffle oil and pecorino with a garlic aioli dip.',
    price: 6.49,
    location: 'Gulshan, Dhaka',
    images: [img('photo-1573080496219-bb080dd4f877')],
    status: 'pending',
    rating: 0,
    reviewCount: 0,
    createdDaysAgo: 1,
  },
  {
    vendorKey: 'crust-lab',
    itemName: 'Nachos Overload',
    category: 'Sides & Appetizers',
    description:
      'Loaded nachos with jalapeños, three-cheese sauce and salsa fresca.',
    price: 8.49,
    location: 'Zindabazar, Sylhet',
    images: [img('photo-1598182198821-819f83a239b1')],
    status: 'inactive',
    rating: 4.2,
    reviewCount: 19,
    createdDaysAgo: 26,
  },
  {
    vendorKey: 'venezia',
    itemName: 'Mystery Meat Monday',
    category: 'Meat Lovers',
    description:
      "A surprise selection of the day's meats — removed from the menu pending a clearer description.",
    price: 10.99,
    location: 'Gulshan, Dhaka',
    images: [img('photo-1527477396000-e27163b481c2')],
    status: 'rejected',
    rating: 0,
    reviewCount: 0,
    createdDaysAgo: 12,
  },
];


const itemId = (index: number) =>
  new Types.ObjectId(`66500000000000000000${String(index + 1).padStart(4, '0')}`);

const run = async (): Promise<void> => {
  await connectDB();

  const vendorIds: Record<string, string> = {};

  for (const vendor of vendors) {
    const doc = await User.findOneAndUpdate(
      { email: vendor.email },
      {
        $setOnInsert: { _id: vendor._id },
        $set: {
          name: vendor.name,
          email: vendor.email,
          emailVerified: true,
          image: null,
          role: 'vendor',
          isBlocked: false,
          businessName: vendor.businessName,
          subscriptionPlan: vendor.subscriptionPlan,
          subscriptionExpiresAt: vendor.subscriptionExpiresAt,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );

    if (!doc) throw new Error(`Could not seed vendor ${vendor.email}`);
    vendorIds[vendor.key] = String(doc._id);
  }

  console.log(`✓ ${vendors.length} demo vendors ready`);

  for (const [index, item] of items.entries()) {
    const created = daysAgo(item.createdDaysAgo);

    await MenuItem.updateOne(
      { _id: itemId(index) },
      {
        $set: {
          vendorId: vendorIds[item.vendorKey],
          itemName: item.itemName,
          category: item.category,
          description: item.description,
          price: item.price,
          location: item.location,
          images: item.images,
          status: item.status,
          rating: item.rating,
          reviewCount: item.reviewCount,
          createdAt: created,
          updatedAt: created,
        },
      },
      { upsert: true, setDefaultsOnInsert: true, timestamps: false },
    );
  }

  const approved = items.filter((i) => i.status === 'approved').length;
  console.log(`✓ ${items.length} demo menu items seeded (${approved} approved)`);
  console.log('  Open http://localhost:3000/browse-menu to see them.');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch(async (error) => {
  console.error('✗ Demo seed failed:', error);
  await mongoose.connection.close().catch(() => undefined);
  process.exit(1);
});
