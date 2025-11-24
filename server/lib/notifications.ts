import { notifyOwner } from "./_core/notification";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Notification types for the system
 */
export type NotificationType =
  | "reservation_approved"
  | "reservation_rejected"
  | "payment_overdue"
  | "payment_received"
  | "document_uploaded"
  | "cheque_bounced"
  | "property_status_changed";

/**
 * Send email notification to a user
 */
export async function sendEmailNotification(params: {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Notifications] Database not available");
      return false;
    }

    // Get user email
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1);

    if (userRecords.length === 0) {
      console.warn(`[Notifications] User ${params.userId} not found`);
      return false;
    }

    const user = userRecords[0];
    const email = user.email;

    if (!email) {
      console.warn(`[Notifications] User ${params.userId} has no email`);
      return false;
    }

    // For now, log the notification (in production, integrate with email service)
    console.log(`[Email Notification] To: ${email}`);
    console.log(`[Email Notification] Type: ${params.type}`);
    console.log(`[Email Notification] Title: ${params.title}`);
    console.log(`[Email Notification] Message: ${params.message}`);

    // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
    // Example:
    // await sendGrid.send({
    //   to: email,
    //   from: 'noreply@crystalpowerinvestments.com',
    //   subject: params.title,
    //   html: generateEmailTemplate(params),
    // });

    return true;
  } catch (error) {
    console.error("[Notifications] Error sending email:", error);
    return false;
  }
}

/**
 * Send notification to system owner (admin)
 */
export async function notifyAdmin(params: {
  title: string;
  content: string;
}): Promise<boolean> {
  try {
    return await notifyOwner(params);
  } catch (error) {
    console.error("[Notifications] Error notifying admin:", error);
    return false;
  }
}

/**
 * Notification templates for different event types
 */
export function getNotificationTemplate(
  type: NotificationType,
  data: Record<string, any>
): { title: string; message: string } {
  switch (type) {
    case "reservation_approved":
      return {
        title: "Reservation Approved! 🎉",
        message: `Your reservation for ${data.propertyName} has been approved. Our team will contact you shortly to proceed with the contract.`,
      };

    case "reservation_rejected":
      return {
        title: "Reservation Update",
        message: `Unfortunately, your reservation for ${data.propertyName} could not be approved at this time. ${data.reason || "Please contact us for more information."}`,
      };

    case "payment_overdue":
      return {
        title: "Payment Overdue Notice ⚠️",
        message: `Your payment of ${data.amount} EGP for ${data.propertyName} is now overdue. Please make the payment as soon as possible to avoid additional penalties.`,
      };

    case "payment_received":
      return {
        title: "Payment Received ✅",
        message: `We have received your payment of ${data.amount} EGP for ${data.propertyName}. Thank you!`,
      };

    case "document_uploaded":
      return {
        title: "New Document Available 📄",
        message: `A new document (${data.documentName}) has been uploaded for ${data.propertyName}. You can view it in your Document Vault.`,
      };

    case "cheque_bounced":
      return {
        title: "Cheque Bounced - Urgent Action Required ⚠️",
        message: `Cheque #${data.chequeNumber} for ${data.amount} EGP has bounced. Please contact us immediately to resolve this issue.`,
      };

    case "property_status_changed":
      return {
        title: "Property Status Update",
        message: `The status of ${data.propertyName} has been updated to: ${data.newStatus}`,
      };

    default:
      return {
        title: "Notification",
        message: "You have a new notification from Crystal Power Investments.",
      };
  }
}

/**
 * Send notification when reservation is approved/rejected
 */
export async function notifyReservationStatus(params: {
  investorUserId: number;
  propertyName: string;
  status: "approved" | "rejected";
  reason?: string;
}): Promise<void> {
  const type: NotificationType =
    params.status === "approved"
      ? "reservation_approved"
      : "reservation_rejected";

  const template = getNotificationTemplate(type, {
    propertyName: params.propertyName,
    reason: params.reason,
  });

  await sendEmailNotification({
    userId: params.investorUserId,
    type,
    title: template.title,
    message: template.message,
  });
}

/**
 * Send notification when payment is overdue
 */
export async function notifyPaymentOverdue(params: {
  investorUserId: number;
  propertyName: string;
  amount: number;
}): Promise<void> {
  const template = getNotificationTemplate("payment_overdue", {
    propertyName: params.propertyName,
    amount: params.amount,
  });

  await sendEmailNotification({
    userId: params.investorUserId,
    type: "payment_overdue",
    title: template.title,
    message: template.message,
  });
}

/**
 * Send notification when document is uploaded
 */
export async function notifyDocumentUploaded(params: {
  investorUserId: number;
  propertyName: string;
  documentName: string;
}): Promise<void> {
  const template = getNotificationTemplate("document_uploaded", {
    propertyName: params.propertyName,
    documentName: params.documentName,
  });

  await sendEmailNotification({
    userId: params.investorUserId,
    type: "document_uploaded",
    title: template.title,
    message: template.message,
  });
}
