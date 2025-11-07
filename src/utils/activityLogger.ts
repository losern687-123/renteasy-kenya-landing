import { supabase } from "@/integrations/supabase/client";

interface LogActivityParams {
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
}

/**
 * Logs an activity to the activity_logs table
 * @param action - The action performed (e.g., 'landlord_approved', 'tenant_added', 'payment_confirmed')
 * @param entityType - The type of entity (e.g., 'landlord_application', 'tenant', 'payment')
 * @param entityId - The ID of the entity (optional)
 * @param details - Additional details about the action (optional)
 */
export const logActivity = async ({
  action,
  entityType,
  entityId,
  details,
}: LogActivityParams): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn("Cannot log activity: No authenticated user");
      return;
    }

    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details: details || {},
      });

    if (error) {
      console.error("Error logging activity:", error);
    }
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

// Predefined activity types for consistency
export const ActivityActions = {
  // Landlord actions
  LANDLORD_APPROVED: 'landlord_approved',
  LANDLORD_REJECTED: 'landlord_rejected',
  
  // Tenant actions
  TENANT_ADDED: 'tenant_added',
  TENANT_UPDATED: 'tenant_updated',
  TENANT_DELETED: 'tenant_deleted',
  
  // Payment actions
  PAYMENT_RECORDED: 'payment_recorded',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  PAYMENT_UPDATED: 'payment_updated',
  
  // Property actions
  PROPERTY_ADDED: 'property_added',
  PROPERTY_UPDATED: 'property_updated',
  PROPERTY_DELETED: 'property_deleted',
  
  // Auth actions
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  
  // Application actions
  APPLICATION_SUBMITTED: 'application_submitted',
} as const;

export const EntityTypes = {
  LANDLORD_APPLICATION: 'landlord_application',
  TENANT: 'tenant',
  PAYMENT: 'payment',
  PROPERTY: 'property',
  USER: 'user',
} as const;
