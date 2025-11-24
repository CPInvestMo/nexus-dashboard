import { mysqlTable, varchar, int, text, timestamp, date, mysqlEnum } from "drizzle-orm/mysql-core";

/**
 * Users table - Authentication and role management
 * Supports three roles: super_admin, internal_admin, investor
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  role: mysqlEnum("role", ["super_admin", "internal_admin", "investor"]).default("investor").notNull(),
  loginMethod: varchar("loginMethod", { length: 50 }),
  lastSignedIn: timestamp("lastSignedIn"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Investors table - Investor profiles and portfolio information
 */
export const investors = mysqlTable("investors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // Optional link to user account
  investorNumber: varchar("investorNumber", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  nationalId: varchar("nationalId", { length: 50 }),
  address: text("address"),
  numberOfProperties: int("numberOfProperties").default(0).notNull(),
  totalInvestment: int("totalInvestment").default(0).notNull(), // in EGP
  accountStatus: mysqlEnum("accountStatus", ["Active", "At_Risk", "On_Track", "Pending"]).default("Pending").notNull(),
  assignedAdminId: int("assignedAdminId"), // For internal admin segregation
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Investor = typeof investors.$inferSelect;
export type InsertInvestor = typeof investors.$inferInsert;

/**
 * Properties table - Property management across categories
 * Categories: CPI_Asset, For_Sale, Investor_Owned
 */
export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  propertyNumber: varchar("propertyNumber", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["Apartment", "Villa", "Commercial", "Office", "Chalet"]).notNull(),
  category: mysqlEnum("category", ["CPI_Asset", "For_Sale", "Investor_Owned"]).notNull(),
  status: mysqlEnum("status", ["Available", "Reserved", "Contracted"]).default("Available").notNull(),
  area: int("area"), // in sqm
  purchasePrice: int("purchasePrice"), // in EGP
  currentValue: int("currentValue"), // in EGP
  investorId: int("investorId"), // Foreign key to investors table
  assignedAdminId: int("assignedAdminId"), // For internal admin segregation
  thumbnailUrl: text("thumbnailUrl"),
  description: text("description"),
  amenities: text("amenities"),
  contractNumber: varchar("contractNumber", { length: 100 }),
  contractDate: date("contractDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

/**
 * Payments table - Payment tracking with automated penalty calculation
 * Penalty: 3.5% per month on overdue amounts
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  documentNumber: varchar("documentNumber", { length: 100 }).notNull().unique(),
  propertyId: int("propertyId").notNull(), // Foreign key to properties table
  investorId: int("investorId").notNull(), // Foreign key to investors table
  dueDate: date("dueDate").notNull(),
  amount: int("amount").notNull(), // in EGP
  collectionDate: date("collectionDate"),
  delayDays: int("delayDays").default(0).notNull(),
  penaltyRate: int("penaltyRate").default(35).notNull(), // 3.5% stored as 35 (divide by 1000)
  penaltyAmount: int("penaltyAmount").default(0).notNull(), // in EGP
  totalDue: int("totalDue").notNull(), // amount + penaltyAmount
  status: mysqlEnum("status", ["Pending", "Paid", "Overdue"]).default("Pending").notNull(),
  receiptUrl: text("receiptUrl"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Cheques table - Three-party check tracking system
 * Tracks beneficiary, drawer, and collector with penalty calculation
 */
export const cheques = mysqlTable("cheques", {
  id: int("id").autoincrement().primaryKey(),
  checkNumber: varchar("checkNumber", { length: 100 }).notNull().unique(),
  beneficiary: varchar("beneficiary", { length: 255 }).notNull(),
  drawer: varchar("drawer", { length: 255 }).notNull(),
  collector: varchar("collector", { length: 255 }),
  bank: varchar("bank", { length: 255 }).notNull(),
  issueDate: date("issueDate").notNull(),
  dueDate: date("dueDate").notNull(),
  value: int("value").notNull(), // in EGP
  collectionDate: date("collectionDate"),
  delayDays: int("delayDays").default(0).notNull(),
  penaltyAmount: int("penaltyAmount").default(0).notNull(), // 3.5% monthly penalty
  totalDue: int("totalDue").notNull(), // value + penaltyAmount
  status: mysqlEnum("status", ["Issued", "Pending", "Presented", "Cleared", "Bounced"]).default("Issued").notNull(),
  propertyId: int("propertyId"), // Optional link to property
  investorId: int("investorId"), // Optional link to investor
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cheque = typeof cheques.$inferSelect;
export type InsertCheque = typeof cheques.$inferInsert;

/**
 * Documents table - Secure file storage references
 * Types: Contract, Receipt
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  documentNumber: varchar("documentNumber", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["Contract", "Receipt", "Other"]).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: int("fileSize"), // in bytes
  mimeType: varchar("mimeType", { length: 100 }),
  propertyId: int("propertyId"), // Optional link to property
  investorId: int("investorId"), // Optional link to investor
  uploadedBy: int("uploadedBy"), // User ID who uploaded
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Reservations table - Property reservation workflow
 * Workflow: Pending → Approved/Rejected
 */
export const reservations = mysqlTable("reservations", {
  id: int("id").autoincrement().primaryKey(),
  reservationNumber: varchar("reservationNumber", { length: 100 }).notNull().unique(),
  propertyId: int("propertyId").notNull(),
  investorId: int("investorId").notNull(),
  status: mysqlEnum("status", ["Pending", "Approved", "Rejected"]).default("Pending").notNull(),
  message: text("message"),
  reviewedBy: int("reviewedBy"), // Admin user ID
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = typeof reservations.$inferInsert;

/**
 * Activity Logs table - Audit trail for all actions
 */
export const activityLogs = mysqlTable("activityLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  entityType: varchar("entityType", { length: 100 }),
  entityId: int("entityId"),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 50 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

/**
 * Notifications table - In-app notification system
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["info", "success", "warning", "error"]).default("info").notNull(),
  isRead: mysqlEnum("isRead", ["true", "false"]).default("false").notNull(),
  actionUrl: varchar("actionUrl", { length: 500 }),
  relatedEntityType: varchar("relatedEntityType", { length: 100 }),
  relatedEntityId: int("relatedEntityId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
