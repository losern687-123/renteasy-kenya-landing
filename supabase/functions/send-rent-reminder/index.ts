import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RentReminderRequest {
  tenantEmail: string;
  tenantName: string;
  propertyName: string;
  dueDate: string;
  isOverdue: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      tenantEmail,
      tenantName,
      propertyName,
      dueDate,
      isOverdue,
    }: RentReminderRequest = await req.json();

    const subject = isOverdue
      ? `Rent Overdue — ${propertyName}`
      : `Rent Reminder — ${propertyName}`;

    const body = isOverdue
      ? `Hi ${tenantName},\n\nYour rent for ${propertyName} was due on ${dueDate} and is now overdue. Please make payment as soon as possible to avoid penalties.\n\nThank you,\nRentEasy Kenya`
      : `Hi ${tenantName},\n\nYour rent for ${propertyName} is due on ${dueDate}. Kindly ensure timely payment to avoid penalties.\n\nThank you,\nRentEasy Kenya`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "RentEasy Kenya <onboarding@resend.dev>",
        to: [tenantEmail],
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: ${isOverdue ? "#dc2626" : "#f59e0b"};">${
          isOverdue ? "⚠️ Rent Overdue" : "🔔 Rent Reminder"
        }</h1>
            <p>Hi <strong>${tenantName}</strong>,</p>
            <p>${
              isOverdue
                ? `Your rent for <strong>${propertyName}</strong> was due on <strong>${dueDate}</strong> and is now <span style="color: #dc2626;">overdue</span>. Please make payment as soon as possible to avoid penalties.`
                : `Your rent for <strong>${propertyName}</strong> is due on <strong>${dueDate}</strong>. Kindly ensure timely payment to avoid penalties.`
            }</p>
            <p style="margin-top: 30px;">Thank you,<br><strong>RentEasy Kenya</strong></p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-rent-reminder function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
