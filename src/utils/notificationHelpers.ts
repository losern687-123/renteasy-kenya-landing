import { supabase } from "@/integrations/supabase/client";

export const createNotification = async (
  userId: string,
  message: string,
  type: string
) => {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    message,
    type,
  });

  if (error) {
    console.error("Error creating notification:", error);
  }
};

export const checkAndCreateRentNotifications = async (
  userId: string,
  userEmail: string
) => {
  // Fetch rent records for the tenant
  const { data: rentRecords, error } = await supabase
    .from("rent_records")
    .select("*")
    .eq("tenant_id", userId)
    .in("status", ["Pending", "Overdue"]);

  if (error || !rentRecords) return;

  const now = new Date();

  for (const record of rentRecords) {
    const dueDate = new Date(record.due_date);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Check if notification already exists for this record today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: existingNotifications } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", todayStart.toISOString())
      .ilike("message", `%${record.property_name}%`);

    if (existingNotifications && existingNotifications.length > 0) {
      continue; // Skip if notification already sent today
    }

    if (diffDays < 0) {
      // Overdue
      await createNotification(
        userId,
        `❗ Your rent for ${record.property_name} is overdue! Please update your payment record.`,
        "rent_overdue"
      );

      // Send email reminder
      await sendRentReminderEmail(
        userEmail,
        record.tenant_name || "Tenant",
        record.property_name,
        record.due_date,
        true
      );
    } else if (diffDays <= 3) {
      // Due soon
      await createNotification(
        userId,
        `⚠️ Your rent for ${record.property_name} is due in ${diffDays} day${
          diffDays !== 1 ? "s" : ""
        }!`,
        "rent_due"
      );

      // Send email reminder
      await sendRentReminderEmail(
        userEmail,
        record.tenant_name || "Tenant",
        record.property_name,
        record.due_date,
        false
      );
    }
  }
};

export const checkAndCreateLandlordNotifications = async (landlordId: string) => {
  // Fetch tenants for the landlord
  const { data: tenants, error: tenantsError } = await supabase
    .from("tenants")
    .select("id")
    .eq("landlord_id", landlordId);

  if (tenantsError || !tenants) return;

  const tenantIds = tenants.map((t) => t.id);

  // Fetch rent records for these tenants
  const { data: rentRecords, error } = await supabase
    .from("rent_records")
    .select("*")
    .in("tenant_id", tenantIds)
    .in("status", ["Pending", "Overdue", "Paid"]);

  if (error || !rentRecords) return;

  // Check for recently paid rent (last 24 hours)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const recentlyPaid = rentRecords.filter(
    (r) =>
      r.status === "Paid" &&
      r.payment_date &&
      new Date(r.payment_date) >= yesterday
  );

  for (const record of recentlyPaid) {
    // Check if notification already exists
    const { data: existingNotifications } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", landlordId)
      .gte("created_at", yesterday.toISOString())
      .ilike("message", `%${record.tenant_name}%${record.property_name}%`);

    if (!existingNotifications || existingNotifications.length === 0) {
      await createNotification(
        landlordId,
        `✅ ${record.tenant_name} has marked rent as paid for ${record.property_name}`,
        "rent_paid"
      );
    }
  }

  // Check for pending/overdue rent
  const pendingOrOverdue = rentRecords.filter(
    (r) => r.status === "Pending" || r.status === "Overdue"
  );

  for (const record of pendingOrOverdue) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: existingNotifications } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", landlordId)
      .gte("created_at", todayStart.toISOString())
      .ilike("message", `%${record.tenant_name}%${record.property_name}%`);

    if (!existingNotifications || existingNotifications.length === 0) {
      await createNotification(
        landlordId,
        `⏳ ${record.tenant_name}'s rent for ${record.property_name} is ${record.status.toLowerCase()}`,
        "rent_pending"
      );
    }
  }
};

const sendRentReminderEmail = async (
  tenantEmail: string,
  tenantName: string,
  propertyName: string,
  dueDate: string,
  isOverdue: boolean
) => {
  try {
    await supabase.functions.invoke("send-rent-reminder", {
      body: {
        tenantEmail,
        tenantName,
        propertyName,
        dueDate,
        isOverdue,
      },
    });
  } catch (error) {
    console.error("Error sending rent reminder email:", error);
  }
};
