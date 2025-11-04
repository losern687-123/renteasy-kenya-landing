const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WaitlistRequest {
  name: string;
  email: string;
  phone: string;
}

// HTML escape function to prevent XSS
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Input validation
function validateWaitlistInput(data: WaitlistRequest): { valid: boolean; error?: string } {
  // Validate name
  if (!data.name || data.name.trim().length === 0 || data.name.length > 100) {
    return { valid: false, error: "Name must be between 1 and 100 characters" };
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email) || data.email.length > 255) {
    return { valid: false, error: "Invalid email address" };
  }

  // Validate phone (Kenyan format)
  const phoneRegex = /^(\+?254|0)?[17]\d{8}$/;
  if (!data.phone || !phoneRegex.test(data.phone.replace(/\s/g, ''))) {
    return { valid: false, error: "Invalid phone number format" };
  }

  // Check for header injection attempts
  const headerInjectionPattern = /[\r\n]/;
  if (headerInjectionPattern.test(data.name) || 
      headerInjectionPattern.test(data.email) || 
      headerInjectionPattern.test(data.phone)) {
    return { valid: false, error: "Invalid characters detected" };
  }

  return { valid: true };
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: WaitlistRequest = await req.json();

    // Validate input
    const validation = validateWaitlistInput(requestData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { name, email, phone } = requestData;

    // Sanitize for logging (don't log full phone)
    console.log("Waitlist submission received:", { 
      name: name.substring(0, 20),
      email: email.substring(0, 30),
      phonePrefix: phone.substring(0, 4) + "****"
    });

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    // Escape HTML to prevent XSS
    const safeName = escapeHtml(name.trim());
    const safeEmail = escapeHtml(email.trim());
    const safePhone = escapeHtml(phone.trim());

    // Send notification email to gregelvis697@gmail.com
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "RentEasy Kenya <onboarding@resend.dev>",
        to: ["gregelvis697@gmail.com"],
        subject: "New Waitlist Signup - RentEasy Kenya",
        html: `
          <h1>New Waitlist Submission</h1>
          <p>Someone has joined the RentEasy Kenya waitlist!</p>
          <hr />
          <h2>Contact Details:</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Phone:</strong> ${safePhone}</p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            This email was sent from RentEasy Kenya waitlist form.
          </p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.json();
      throw new Error(error.message || "Failed to send email");
    }

    console.log("Email sent successfully");

    // Send confirmation email to the user
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "RentEasy Kenya <onboarding@resend.dev>",
        to: [email],
        subject: "Thank you for joining the RentEasy Kenya waitlist!",
        html: `
          <h1>Welcome to RentEasy Kenya, ${safeName}!</h1>
          <p>Thank you for joining our waitlist. We're excited to have you on board!</p>
          <p>We'll keep you updated on our launch and special early access offers.</p>
          <p>Best regards,<br>The RentEasy Kenya Team</p>
        `,
      }),
    });

    const result = await emailResponse.json();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-waitlist-email function:", error.message);
    return new Response(
      JSON.stringify({ error: "Failed to process waitlist submission" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
