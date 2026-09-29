const ALLOWED_ORIGINS =
    new Set([
        "https://biztechsolutionsco.github.io"
    ]);


const ALLOWED_TURNSTILE_HOSTNAMES =
    new Set([
        "biztechsolutionsco.github.io"
    ]);


/* ======================================================
   CORS
====================================================== */

function getCorsHeaders(origin) {

    if (
        !origin ||
        !ALLOWED_ORIGINS.has(origin)
    ) {
        return {};
    }


    return {
        "Access-Control-Allow-Origin":
            origin,

        "Access-Control-Allow-Methods":
            "POST, OPTIONS",

        "Access-Control-Allow-Headers":
            "Content-Type",

        "Access-Control-Max-Age":
            "86400",

        "Vary":
            "Origin"
    };

}


/* ======================================================
   TURNSTILE VERIFICATION
====================================================== */

async function verifyTurnstile(
    token,
    request,
    env
) {

    if (
        !env.TURNSTILE_SECRET_KEY
    ) {

        console.error(
            "TURNSTILE_SECRET_KEY is not configured."
        );


        return {
            success: false
        };

    }


    const remoteIp =
        request.headers.get(
            "CF-Connecting-IP"
        ) || "";


    try {

        const response =
            await fetch(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            secret:
                                env.TURNSTILE_SECRET_KEY,

                            response:
                                token,

                            remoteip:
                                remoteIp
                        })
                }
            );


        if (!response.ok) {

            console.error(
                "Turnstile Siteverify returned:",
                response.status
            );


            return {
                success: false
            };

        }


        return await response.json();

    } catch (error) {

        console.error(
            "Turnstile verification failed:",
            error
        );


        return {
            success: false
        };

    }

}


/* ======================================================
   WORKER
====================================================== */

export default {

    async fetch(request, env) {

        const origin =
            request.headers.get("Origin") || "";


        /* ==================================================
           CORS ORIGIN CHECK
        ================================================== */

        if (
            origin &&
            !ALLOWED_ORIGINS.has(origin)
        ) {

            return new Response(
                "Forbidden",
                {
                    status: 403
                }
            );

        }


        /* ==================================================
           PREFLIGHT
        ================================================== */

        if (
            request.method === "OPTIONS"
        ) {

            return new Response(
                null,
                {
                    status: 204,

                    headers:
                        getCorsHeaders(origin)
                }
            );

        }


        /* ==================================================
           FORM POST
        ================================================== */

        if (
            request.method === "POST"
        ) {

            const formData =
                await request.formData();


            const data = {

                form_source:
                    formData.get("form_source"),

                first_name:
                    formData.get("first_name"),

                last_name:
                    formData.get("last_name"),

                email:
                    formData.get("email"),

                phone:
                    formData.get("phone"),

                interest:
                    formData.get("interest"),

                timeline:
                    formData.get("timeline"),

                message:
                    formData.get("message"),

                property_address:
                    formData.get("property_address"),

                property_type:
                    formData.get("property_type"),

                selling_timeline:
                    formData.get("selling_timeline"),

                bedrooms:
                    formData.get("bedrooms"),

                bathrooms:
                    formData.get("bathrooms"),

                notes:
                    formData.get("notes"),

                website:
                    formData.get("website"),

                turnstile_token:
                    formData.get(
                        "cf-turnstile-response"
                    )
            };


            /* ==================================================
               HONEYPOT
            ================================================== */

            if (
                data.website &&
                String(
                    data.website
                ).trim()
            ) {

                return new Response(
                    JSON.stringify({
                        success: true
                    }),
                    {
                        status: 200,

                        headers: {
                            "Content-Type":
                                "application/json; charset=UTF-8",

                            ...getCorsHeaders(origin)
                        }
                    }
                );

            }


            /* ==================================================
               TURNSTILE TOKEN REQUIRED
            ================================================== */

            if (
                !data.turnstile_token
            ) {

                return new Response(
                    JSON.stringify({
                        success: false,

                        message:
                            "Please complete the security verification."
                    }),
                    {
                        status: 400,

                        headers: {
                            "Content-Type":
                                "application/json; charset=UTF-8",

                            ...getCorsHeaders(origin)
                        }
                    }
                );

            }


            /* ==================================================
               VERIFY TURNSTILE
            ================================================== */

            const turnstileResult =
                await verifyTurnstile(
                    data.turnstile_token,
                    request,
                    env
                );


            if (
                !turnstileResult.success
            ) {

                return new Response(
                    JSON.stringify({
                        success: false,

                        message:
                            "Security verification failed. Please refresh the page and try again."
                    }),
                    {
                        status: 403,

                        headers: {
                            "Content-Type":
                                "application/json; charset=UTF-8",

                            ...getCorsHeaders(origin)
                        }
                    }
                );

            }


            /* ==================================================
               TURNSTILE ACTION CHECK
            ================================================== */

            if (
                turnstileResult.action !==
                "contact_form"
            ) {

                console.error(
                    "Unexpected Turnstile action:",
                    turnstileResult.action
                );


                return new Response(
                    JSON.stringify({
                        success: false,

                        message:
                            "Security verification failed. Please refresh the page and try again."
                    }),
                    {
                        status: 403,

                        headers: {
                            "Content-Type":
                                "application/json; charset=UTF-8",

                            ...getCorsHeaders(origin)
                        }
                    }
                );

            }


            /* ==================================================
               TURNSTILE HOSTNAME CHECK
            ================================================== */

            if (
                !ALLOWED_TURNSTILE_HOSTNAMES.has(
                    turnstileResult.hostname
                )
            ) {

                console.error(
                    "Unexpected Turnstile hostname:",
                    turnstileResult.hostname
                );


                return new Response(
                    JSON.stringify({
                        success: false,

                        message:
                            "Security verification failed. Please refresh the page and try again."
                    }),
                    {
                        status: 403,

                        headers: {
                            "Content-Type":
                                "application/json; charset=UTF-8",

                            ...getCorsHeaders(origin)
                        }
                    }
                );

            }


            /* ==================================================
               EMAIL CONFIGURATION
            ================================================== */

            const senderEmail =
                "biztechsolutionsco@gmail.com";


            const recipientEmail =
                env.INQUIRY_NOTIFICATION_EMAIL;


            const fullName =
                `${data.first_name || ""} ${data.last_name || ""}`.trim();


            let subject;
            let body;


            /* ==================================================
               HOME EVALUATION EMAIL
            ================================================== */

            if (
                data.form_source ===
                "home_evaluation"
            ) {

                subject =
                    `New Home Evaluation Request - ${fullName}`;


                body = `
New home evaluation request

Name:
${fullName}

Email:
${data.email || "Not provided"}

Phone:
${data.phone || "Not provided"}

Property Address:
${data.property_address || "Not provided"}

Property Type:
${data.property_type || "Not provided"}

Selling Timeline:
${data.selling_timeline || "Not provided"}

Bedrooms:
${data.bedrooms || "0"}

Bathrooms:
${data.bathrooms || "0"}

Additional Details:
${data.notes || "Not provided"}

Submitted from:
Home Evaluation Form
                `.trim();

            } else {

                /* ==============================================
                   CONTACT EMAIL
                ============================================== */

                subject =
                    `New Website Contact Inquiry - ${fullName}`;


                body = `
New website contact inquiry

Name:
${fullName}

Email:
${data.email || "Not provided"}

Phone:
${data.phone || "Not provided"}

Interested In:
${data.interest || "Not provided"}

Timeline:
${data.timeline || "Not provided"}

Message:
${data.message || "Not provided"}

Submitted from:
Contact Form
                `.trim();

            }


            /* ==================================================
               BREVO CONFIG CHECK
            ================================================== */

            if (
                !env.BREVO_API_KEY ||
                !recipientEmail
            ) {

                console.error(
                    "Brevo email configuration is missing."
                );


                return new Response(
                    JSON.stringify({
                        success: false,

                        message:
                            "Email configuration is missing."
                    }),
                    {
                        status: 500,

                        headers: {
                            "Content-Type":
                                "application/json; charset=UTF-8",

                            ...getCorsHeaders(origin)
                        }
                    }
                );

            }


            /* ==================================================
               SEND EMAIL THROUGH BREVO
            ================================================== */

            const brevoResponse =
                await fetch(
                    "https://api.brevo.com/v3/smtp/email",
                    {
                        method: "POST",

                        headers: {
                            "accept":
                                "application/json",

                            "api-key":
                                env.BREVO_API_KEY,

                            "content-type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                sender: {
                                    name:
                                        "Mike Luan Website",

                                    email:
                                        senderEmail
                                },

                                to: [
                                    {
                                        email:
                                            recipientEmail
                                    }
                                ],

                                replyTo: {
                                    email:
                                        data.email,

                                    name:
                                        fullName
                                },

                                subject:
                                    subject,

                                textContent:
                                    body
                            })
                    }
                );


            if (
                !brevoResponse.ok
            ) {

                const errorBody =
                    await brevoResponse.text();


                console.error(
                    "Brevo email failed:",
                    brevoResponse.status,
                    errorBody
                );


                return new Response(
                    JSON.stringify({
                        success: false,

                        message:
                            "Unable to send notification email."
                    }),
                    {
                        status: 500,

                        headers: {
                            "Content-Type":
                                "application/json; charset=UTF-8",

                            ...getCorsHeaders(origin)
                        }
                    }
                );

            }


            /* ==================================================
               SUCCESS
            ================================================== */

            return new Response(
                JSON.stringify({
                    success: true
                }),
                {
                    status: 200,

                    headers: {
                        "Content-Type":
                            "application/json; charset=UTF-8",

                        ...getCorsHeaders(origin)
                    }
                }
            );

        }


        /* ==================================================
           HEALTH CHECK
        ================================================== */

        return new Response(
            "Mike Luan form worker is running.",
            {
                status: 200,

                headers: {
                    "Content-Type":
                        "text/plain; charset=UTF-8"
                }
            }
        );

    }

};