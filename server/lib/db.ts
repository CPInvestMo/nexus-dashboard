import { eq, and, desc, asc, sql, or, lt, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  properties, InsertProperty, Property,
  investors, InsertInvestor, Investor,
  payments, InsertPayment, Payment,
  cheques, InsertCheque, Cheque,
  documents, InsertDocument, Document,
  reservations, InsertReservation, Reservation,
  activityLogs, InsertActivityLog, ActivityLog,
  notifications, InsertNotification, Notification
} from "../../drizzle/schema";
import { ENV } from '../_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "phone", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'super_admin';
      updateSet.role = 'super_admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// INVESTOR MANAGEMENT
// ============================================================================

export async function getInvestorByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(investors).where(eq(investors.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getInvestorById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(investors).where(eq(investors.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllInvestors() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(investors).orderBy(desc(investors.createdAt));
}

export async function getInvestorsByAdminId(adminId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(investors).where(eq(investors.assignedAdminId, adminId)).orderBy(desc(investors.createdAt));
}

export async function createInvestor(investor: InsertInvestor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(investors).values(investor);
  return result;
}

export async function updateInvestor(id: number, updates: Partial<InsertInvestor>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(investors).set(updates).where(eq(investors.id, id));
}

// ============================================================================
// PROPERTY MANAGEMENT
// ============================================================================

export async function getPropertyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPropertiesByInvestorId(investorId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(properties).where(eq(properties.investorId, investorId)).orderBy(desc(properties.createdAt));
}

export async function getAvailableProperties() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(properties).where(
    and(
      eq(properties.category, "For_Sale"),
      or(eq(properties.status, "Available"), eq(properties.status, "Reserved"))
    )
  ).orderBy(desc(properties.createdAt));
}

export async function getAllProperties() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(properties).orderBy(desc(properties.createdAt));
}

export async function getPropertiesByAdminId(adminId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(properties).where(eq(properties.assignedAdminId, adminId)).orderBy(desc(properties.createdAt));
}

export async function createProperty(property: InsertProperty) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(properties).values(property);
  return result;
}

export async function updateProperty(id: number, updates: Partial<InsertProperty>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(properties).set(updates).where(eq(properties.id, id));
}

// ============================================================================
// PAYMENT MANAGEMENT
// ============================================================================

export async function getAllPayments() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(payments).orderBy(desc(payments.dueDate));
}

export async function getPaymentsByAdminId(adminId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all properties assigned to this admin
  const adminProperties = await db.select().from(properties).where(eq(properties.assignedAdminId, adminId));
  const propertyIds = adminProperties.map(p => p.id);

  if (propertyIds.length === 0) return [];

  return await db.select().from(payments).where(
    sql`${payments.propertyId} IN (${sql.join(propertyIds.map(id => sql`${id}`), sql`, `)})`
  ).orderBy(desc(payments.dueDate));
}

export async function getPaymentsByInvestorId(investorId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(payments).where(eq(payments.investorId, investorId)).orderBy(asc(payments.dueDate));
}

export async function getPaymentsByPropertyId(propertyId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(payments).where(eq(payments.propertyId, propertyId)).orderBy(asc(payments.dueDate));
}

export async function getOverduePayments() {
  const db = await getDb();
  if (!db) return [];

  const today = new Date().toISOString().split('T')[0];
  return await db.select().from(payments).where(
    and(
      eq(payments.status, "Overdue"),
      sql`${payments.dueDate} < ${today}`
    )
  ).orderBy(asc(payments.dueDate));
}

export async function getUpcomingPayments(daysAhead: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  const todayStr = today.toISOString().split('T')[0];
  const futureDateStr = futureDate.toISOString().split('T')[0];

  return await db.select().from(payments).where(
    and(
      eq(payments.status, "Pending"),
      sql`${payments.dueDate} >= ${todayStr}`,
      sql`${payments.dueDate} < ${futureDateStr}`
    )
  ).orderBy(asc(payments.dueDate));
}

export async function createPayment(payment: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(payments).values(payment);
  return result;
}

export async function updatePayment(id: number, updates: Partial<InsertPayment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(payments).set(updates).where(eq(payments.id, id));
}

// ============================================================================
// CHEQUE MANAGEMENT
// ============================================================================

export async function getAllCheques() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(cheques).orderBy(desc(cheques.dueDate));
}

export async function getChequesByAdminId(adminId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all properties assigned to this admin
  const adminProperties = await db.select().from(properties).where(eq(properties.assignedAdminId, adminId));
  const propertyIds = adminProperties.map(p => p.id);

  if (propertyIds.length === 0) return [];

  return await db.select().from(cheques).where(
    sql`${cheques.propertyId} IN (${sql.join(propertyIds.map(id => sql`${id}`), sql`, `)})`
  ).orderBy(desc(cheques.dueDate));
}

export async function getChequesByInvestorId(investorId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(cheques).where(eq(cheques.investorId, investorId)).orderBy(asc(cheques.dueDate));
}

export async function getBouncedCheques() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(cheques).where(eq(cheques.status, "Bounced")).orderBy(desc(cheques.createdAt));
}

export async function createCheque(cheque: InsertCheque) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(cheques).values(cheque);
  return result;
}

export async function updateCheque(id: number, updates: Partial<InsertCheque>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(cheques).set(updates).where(eq(cheques.id, id));
}

// ============================================================================
// DOCUMENT MANAGEMENT
// ============================================================================

export async function getDocumentsByInvestorId(investorId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(documents).where(eq(documents.investorId, investorId)).orderBy(desc(documents.createdAt));
}

export async function getDocumentsByPropertyId(propertyId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(documents).where(eq(documents.propertyId, propertyId)).orderBy(desc(documents.createdAt));
}

export async function createDocument(document: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(documents).values(document);
  return result;
}

// ============================================================================
// RESERVATION MANAGEMENT
// ============================================================================

export async function getReservationsByInvestorId(investorId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(reservations).where(eq(reservations.investorId, investorId)).orderBy(desc(reservations.createdAt));
}

export async function getPendingReservations() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(reservations).where(eq(reservations.status, "Pending")).orderBy(desc(reservations.createdAt));
}

export async function createReservation(reservation: InsertReservation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(reservations).values(reservation);
  return result;
}

export async function updateReservation(id: number, updates: Partial<InsertReservation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(reservations).set(updates).where(eq(reservations.id, id));
}

// ============================================================================
// ACTIVITY LOG
// ============================================================================

export async function createActivityLog(log: InsertActivityLog) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(activityLogs).values(log);
  } catch (error) {
    console.error("[Database] Failed to create activity log:", error);
  }
}

export async function getActivityLogsByUserId(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(activityLogs).where(eq(activityLogs.userId, userId)).orderBy(desc(activityLogs.createdAt)).limit(limit);
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(notifications).values(notification);
}

export async function getNotificationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, "false")));
  
  return result.length;
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(notifications)
    .set({ isRead: "true" })
    .where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(notifications)
    .set({ isRead: "true" })
    .where(eq(notifications.userId, userId));
}
