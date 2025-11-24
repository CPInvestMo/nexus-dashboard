import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { 
  users, investors, properties, payments, cheques, 
  documents, reservations, notifications 
} from '../drizzle/schema.js';

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/crystal_power_nexus';

async function seed() {
  console.log('🌱 Starting database seed...');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    // 1. Create Owner/Super Admin
    console.log('Creating super admin user...');
    await db.insert(users).values({
      openId: 'owner-open-id-12345',
      name: 'Mo\'men Maisara',
      email: 'mmaisara@crystalpowerinvestment.com',
      phone: '+20 123 456 7890',
      role: 'super_admin',
      loginMethod: 'google',
      lastSignedIn: new Date(),
    });

    // 2. Create Internal Admin
    console.log('Creating internal admin user...');
    await db.insert(users).values({
      openId: 'admin-open-id-67890',
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@crystalpowerinvestment.com',
      phone: '+20 100 111 2222',
      role: 'internal_admin',
      loginMethod: 'google',
      lastSignedIn: new Date(),
    });

    // 3. Create Investors
    console.log('Creating investors...');
    const investorIds = [];
    
    const investorsData = [
      {
        investorNumber: 'INV-2024-001',
        name: 'Sarah Ahmed',
        email: 'sarah.ahmed@example.com',
        phone: '+20 111 222 3333',
        nationalId: '29001011234567',
        address: '123 Nile Street, Cairo, Egypt',
        numberOfProperties: 2,
        totalInvestment: 5000000, // 5M EGP
        accountStatus: 'On_Track',
        assignedAdminId: 2,
      },
      {
        investorNumber: 'INV-2024-002',
        name: 'Mohamed Ali',
        email: 'mohamed.ali@example.com',
        phone: '+20 122 333 4444',
        nationalId: '28505051234568',
        address: '456 Tahrir Square, Cairo, Egypt',
        numberOfProperties: 1,
        totalInvestment: 3000000, // 3M EGP
        accountStatus: 'Active',
        assignedAdminId: 2,
      },
      {
        investorNumber: 'INV-2024-003',
        name: 'Fatima Hassan',
        email: 'fatima.hassan@example.com',
        phone: '+20 100 555 6666',
        nationalId: '29109091234569',
        address: '789 Zamalek District, Cairo, Egypt',
        numberOfProperties: 3,
        totalInvestment: 8000000, // 8M EGP
        accountStatus: 'On_Track',
        assignedAdminId: 1,
      },
    ];

    for (const investor of investorsData) {
      const result = await db.insert(investors).values(investor);
      investorIds.push(result[0].insertId);
    }

    // 4. Create User accounts for investors
    console.log('Creating investor user accounts...');
    await db.insert(users).values({
      openId: 'investor-sarah-001',
      name: 'Sarah Ahmed',
      email: 'sarah.ahmed@example.com',
      phone: '+20 111 222 3333',
      role: 'investor',
      loginMethod: 'google',
      lastSignedIn: new Date(),
    });

    await db.insert(users).values({
      openId: 'investor-mohamed-002',
      name: 'Mohamed Ali',
      email: 'mohamed.ali@example.com',
      phone: '+20 122 333 4444',
      role: 'investor',
      loginMethod: 'google',
      lastSignedIn: new Date(),
    });

    // 5. Create Properties
    console.log('Creating properties...');
    const propertyIds = [];
    
    const propertiesData = [
      // CPI Assets
      {
        propertyNumber: 'PROP-CPI-001',
        name: 'Nile View Tower - Unit 501',
        location: 'Maadi, Cairo',
        type: 'Apartment',
        category: 'CPI_Asset',
        status: 'Contracted',
        area: 150,
        purchasePrice: 2000000,
        currentValue: 2500000,
        investorId: null,
        assignedAdminId: 1,
        description: 'Luxury 3-bedroom apartment with Nile views',
        amenities: 'Pool, Gym, Parking, Security',
      },
      // For Sale Properties
      {
        propertyNumber: 'PROP-SALE-001',
        name: 'Garden City Villa',
        location: 'Garden City, Cairo',
        type: 'Villa',
        category: 'For_Sale',
        status: 'Available',
        area: 300,
        purchasePrice: 5000000,
        currentValue: 5500000,
        investorId: null,
        assignedAdminId: 1,
        description: 'Spacious villa with private garden',
        amenities: 'Garden, Garage, Smart Home',
      },
      {
        propertyNumber: 'PROP-SALE-002',
        name: 'Zamalek Penthouse',
        location: 'Zamalek, Cairo',
        type: 'Apartment',
        category: 'For_Sale',
        status: 'Reserved',
        area: 200,
        purchasePrice: 4000000,
        currentValue: 4200000,
        investorId: null,
        assignedAdminId: 1,
        description: 'Penthouse with panoramic city views',
        amenities: 'Terrace, Pool, Concierge',
      },
      // Investor Owned Properties
      {
        propertyNumber: 'PROP-INV-001',
        name: 'New Cairo Apartment - A102',
        location: 'New Cairo, Cairo',
        type: 'Apartment',
        category: 'Investor_Owned',
        status: 'Contracted',
        area: 120,
        purchasePrice: 2500000,
        currentValue: 2800000,
        investorId: investorIds[0], // Sarah Ahmed
        assignedAdminId: 2,
        contractNumber: 'CNT-2024-001',
        contractDate: '2024-01-15',
        description: '2-bedroom apartment in gated community',
        amenities: 'Pool, Gym, Playground',
      },
      {
        propertyNumber: 'PROP-INV-002',
        name: 'Sheikh Zayed Villa',
        location: 'Sheikh Zayed, Giza',
        type: 'Villa',
        category: 'Investor_Owned',
        status: 'Contracted',
        area: 250,
        purchasePrice: 3000000,
        currentValue: 3500000,
        investorId: investorIds[1], // Mohamed Ali
        assignedAdminId: 2,
        contractNumber: 'CNT-2024-002',
        contractDate: '2024-02-10',
        description: '4-bedroom villa with garden',
        amenities: 'Garden, Parking, Security',
      },
    ];

    for (const property of propertiesData) {
      const result = await db.insert(properties).values(property);
      propertyIds.push(result[0].insertId);
    }

    // 6. Create Payments
    console.log('Creating payments...');
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setMonth(today.getMonth() + 1);
    const pastDate = new Date(today);
    pastDate.setMonth(today.getMonth() - 2);

    await db.insert(payments).values([
      {
        documentNumber: 'PAY-2024-001',
        propertyId: propertyIds[3], // New Cairo Apartment
        investorId: investorIds[0],
        dueDate: pastDate.toISOString().split('T')[0],
        amount: 100000,
        collectionDate: null,
        delayDays: 60,
        penaltyAmount: 7000, // 3.5% * 2 months
        totalDue: 107000,
        status: 'Overdue',
      },
      {
        documentNumber: 'PAY-2024-002',
        propertyId: propertyIds[3],
        investorId: investorIds[0],
        dueDate: futureDate.toISOString().split('T')[0],
        amount: 100000,
        totalDue: 100000,
        status: 'Pending',
      },
      {
        documentNumber: 'PAY-2024-003',
        propertyId: propertyIds[4], // Sheikh Zayed Villa
        investorId: investorIds[1],
        dueDate: today.toISOString().split('T')[0],
        amount: 150000,
        collectionDate: today.toISOString().split('T')[0],
        totalDue: 150000,
        status: 'Paid',
      },
    ]);

    // 7. Create Cheques
    console.log('Creating cheques...');
    await db.insert(cheques).values([
      {
        checkNumber: 'CHQ-001-2024',
        beneficiary: 'Talaat Moustafa Group',
        drawer: 'Sarah Ahmed',
        collector: 'Crystal Power Investments',
        bank: 'National Bank of Egypt',
        issueDate: '2024-01-01',
        dueDate: futureDate.toISOString().split('T')[0],
        value: 100000,
        totalDue: 100000,
        status: 'Pending',
        propertyId: propertyIds[3],
        investorId: investorIds[0],
      },
      {
        checkNumber: 'CHQ-002-2024',
        beneficiary: 'Sodic Development',
        drawer: 'Mohamed Ali',
        collector: 'Crystal Power Investments',
        bank: 'Commercial International Bank',
        issueDate: '2024-02-01',
        dueDate: '2024-03-01',
        value: 150000,
        collectionDate: '2024-03-05',
        totalDue: 150000,
        status: 'Cleared',
        propertyId: propertyIds[4],
        investorId: investorIds[1],
      },
    ]);

    // 8. Create Documents
    console.log('Creating documents...');
    await db.insert(documents).values([
      {
        documentNumber: 'DOC-2024-001',
        title: 'Purchase Contract - New Cairo Apartment',
        type: 'Contract',
        fileUrl: '/documents/contracts/contract-001.pdf',
        propertyId: propertyIds[3],
        investorId: investorIds[0],
        uploadedBy: 1,
      },
      {
        documentNumber: 'DOC-2024-002',
        title: 'Payment Receipt - March 2024',
        type: 'Receipt',
        fileUrl: '/documents/receipts/receipt-001.pdf',
        propertyId: propertyIds[4],
        investorId: investorIds[1],
        uploadedBy: 2,
      },
    ]);

    // 9. Create Reservations
    console.log('Creating reservations...');
    await db.insert(reservations).values([
      {
        reservationNumber: 'RES-2024-001',
        propertyId: propertyIds[2], // Zamalek Penthouse
        investorId: investorIds[2],
        status: 'Pending',
        message: 'Interested in purchasing this property. Please contact me.',
      },
    ]);

    // 10. Create Notifications
    console.log('Creating notifications...');
    await db.insert(notifications).values([
      {
        userId: 1, // Super admin
        title: 'New Reservation Request',
        message: 'Fatima Hassan has submitted a reservation for Zamalek Penthouse',
        type: 'info',
        isRead: 'false',
        actionUrl: '/admin/reservations',
        relatedEntityType: 'reservation',
        relatedEntityId: 1,
      },
      {
        userId: 3, // Sarah Ahmed
        title: 'Payment Overdue',
        message: 'Your payment of EGP 100,000 is overdue. Please pay as soon as possible.',
        type: 'warning',
        isRead: 'false',
        actionUrl: '/investor/payments',
        relatedEntityType: 'payment',
        relatedEntityId: 1,
      },
    ]);

    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log('- Users: 4 (1 super admin, 1 internal admin, 2 investors)');
    console.log('- Investors: 3');
    console.log('- Properties: 5 (1 CPI Asset, 2 For Sale, 2 Investor Owned)');
    console.log('- Payments: 3 (1 overdue, 1 pending, 1 paid)');
    console.log('- Cheques: 2 (1 pending, 1 cleared)');
    console.log('- Documents: 2');
    console.log('- Reservations: 1 (pending)');
    console.log('- Notifications: 2');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
