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
   FORM VALIDATION
====================================================== */

const VALID_FORM_SOURCES =
    new Set([
        "contact",
        "home_evaluation"
    ]);


const VALID_INTERESTS =
    new Set([
        "",
        "buying",
        "selling",
        "home-evaluation",
        "community",
        "general"
    ]);


const VALID_CONTACT_TIMELINES =
    new Set([
        "",
        "asap",
        "1-3-months",
        "3-6-months",
        "6-plus-months",
        "exploring"
    ]);


const VALID_PROPERTY_TYPES =
    new Set([
        "",
        "detached",
        "semi-detached",
        "townhouse",
        "condo",
        "other"
    ]);


const VALID_SELLING_TIMELINES =
    new Set([
        "",
        "immediately",
        "1-3-months",
        "3-6-months",
        "6-plus-months",
        "exploring"
    ]);


/* ======================================================
   NORMALIZE TEXT
====================================================== */

function cleanText(
    value,
    maxLength = 1000
) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value)
        .trim()
        .slice(0, maxLength);

}


/* ======================================================
   EMAIL VALIDATION
====================================================== */

function isValidEmail(email) {

    if (
        !email ||
        email.length > 254
    ) {
        return false;
    }


    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );

}


/* ======================================================
   NUMBER VALIDATION
====================================================== */

function isValidNumber(
    value,
    {
        min = 0,
        max = 100,
        step = null
    } = {}
) {

    if (
        value === ""
    ) {
        return true;
    }


    const number =
        Number(value);


    if (
        !Number.isFinite(number) ||
        number < min ||
        number > max
    ) {
        return false;
    }


    if (
        step !== null
    ) {

        const remainder =
            Math.abs(
                number / step -
                Math.round(number / step)
            );


        if (
            remainder > 0.000001
        ) {
            return false;
        }

    }


    return true;

}


/* ======================================================
   VALIDATION ERROR RESPONSE
====================================================== */

function validationError(
    message,
    origin
) {

    return new Response(
        JSON.stringify({
            success: false,
            message
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

async function saveInquiry(
    data,
    env
) {

    const result =
        await env.DB.prepare(`
            INSERT INTO inquiries (
                form_source,
                first_name,
                last_name,
                email,
                phone,
                interest,
                timeline,
                message,
                property_address,
                property_type,
                selling_timeline,
                bedrooms,
                bathrooms,
                notes,
                status,
                email_sent
            )
            VALUES (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                'new',
                0
            )
        `)
        .bind(
            data.form_source,
            data.first_name,
            data.last_name,
            data.email,
            data.phone || null,
            data.interest || null,
            data.timeline || null,
            data.message || null,
            data.property_address || null,
            data.property_type || null,
            data.selling_timeline || null,
            data.bedrooms !== ""
                ? Number(data.bedrooms)
                : null,
            data.bathrooms !== ""
                ? Number(data.bathrooms)
                : null,
            data.notes || null
        )
        .run();


    return result;

}

async function markInquiryEmailSent(
    inquiryId,
    env
) {

    await env.DB.prepare(`
        UPDATE inquiries
        SET email_sent = 1
        WHERE id = ?
    `)
    .bind(
        inquiryId
    )
    .run();

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
                    cleanText(
                        formData.get("form_source"),
                        50
                    ),

                first_name:
                    cleanText(
                        formData.get("first_name"),
                        100
                    ),

                last_name:
                    cleanText(
                        formData.get("last_name"),
                        100
                    ),

                email:
                    cleanText(
                        formData.get("email"),
                        254
                    ).toLowerCase(),

                phone:
                    cleanText(
                        formData.get("phone"),
                        50
                    ),

                interest:
                    cleanText(
                        formData.get("interest"),
                        50
                    ),

                timeline:
                    cleanText(
                        formData.get("timeline"),
                        50
                    ),

                message:
                    cleanText(
                        formData.get("message"),
                        3000
                    ),

                property_address:
                    cleanText(
                        formData.get("property_address"),
                        300
                    ),

                property_type:
                    cleanText(
                        formData.get("property_type"),
                        50
                    ),

                selling_timeline:
                    cleanText(
                        formData.get("selling_timeline"),
                        50
                    ),

                bedrooms:
                    cleanText(
                        formData.get("bedrooms"),
                        10
                    ),

                bathrooms:
                    cleanText(
                        formData.get("bathrooms"),
                        10
                    ),

                notes:
                    cleanText(
                        formData.get("notes"),
                        3000
                    ),

                website:
                    cleanText(
                        formData.get("website"),
                        500
                    ),

                turnstile_token:
                    cleanText(
                        formData.get(
                            "cf-turnstile-response"
                        ),
                        3000
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

            /* ======================================================
            FORM DATA VALIDATION
            ====================================================== */

            if (
                !VALID_FORM_SOURCES.has(
                    data.form_source
                )
            ) {

                return validationError(
                    "Invalid form submission.",
                    origin
                );

            }


            if (
                !data.first_name ||
                !data.last_name
            ) {

                return validationError(
                    "First name and last name are required.",
                    origin
                );

            }


            if (
                !isValidEmail(
                    data.email
                )
            ) {

                return validationError(
                    "Please enter a valid email address.",
                    origin
                );

            }


            /* ======================================================
            CONTACT FORM VALIDATION
            ====================================================== */

            if (
                data.form_source ===
                "contact"
            ) {

                if (
                    !VALID_INTERESTS.has(
                        data.interest
                    )
                ) {

                    return validationError(
                        "Invalid interest selection.",
                        origin
                    );

                }


                if (
                    !VALID_CONTACT_TIMELINES.has(
                        data.timeline
                    )
                ) {

                    return validationError(
                        "Invalid timeline selection.",
                        origin
                    );

                }

            }


            /* ======================================================
            HOME EVALUATION VALIDATION
            ====================================================== */

            if (
                data.form_source ===
                "home_evaluation"
            ) {

                if (
                    !data.property_address
                ) {

                    return validationError(
                        "Property address is required.",
                        origin
                    );

                }


                if (
                    !VALID_PROPERTY_TYPES.has(
                        data.property_type
                    )
                ) {

                    return validationError(
                        "Invalid property type.",
                        origin
                    );

                }


                if (
                    !VALID_SELLING_TIMELINES.has(
                        data.selling_timeline
                    )
                ) {

                    return validationError(
                        "Invalid selling timeline.",
                        origin
                    );

                }


                if (
                    !isValidNumber(
                        data.bedrooms,
                        {
                            min: 0,
                            max: 20,
                            step: 1
                        }
                    )
                ) {

                    return validationError(
                        "Bedrooms must be a whole number between 0 and 20.",
                        origin
                    );

                }


                if (
                    !isValidNumber(
                        data.bathrooms,
                        {
                            min: 0,
                            max: 20,
                            step: 0.5
                        }
                    )
                ) {

                    return validationError(
                        "Bathrooms must be between 0 and 20 in 0.5 increments.",
                        origin
                    );

                }

            }

            /* ======================================================
            SAVE INQUIRY TO D1
            ====================================================== */

            let inquiryId;


            try {

                const saveResult =
                    await saveInquiry(
                        data,
                        env
                    );


                inquiryId =
                    saveResult.meta.last_row_id;


            } catch (error) {

                console.error(
                    "Failed to save inquiry:",
                    error
                );


                return new Response(
                    JSON.stringify({
                        success: false,
                        message:
                            "Unable to save your inquiry. Please try again."
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
                        success: true,
                        email_sent: false
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

            try {

                await markInquiryEmailSent(
                    inquiryId,
                    env
                );

            } catch (error) {

                console.error(
                    "Failed to update email_sent status:",
                    error
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