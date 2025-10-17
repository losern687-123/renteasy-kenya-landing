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

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone }: WaitlistRequest = await req.json();

    console.log("Received waitlist submission:", { name, email, phone });

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
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
          <h1>Welcome to RentEasy Kenya, ${name}!</h1>
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
    console.error("Error in send-waitlist-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
