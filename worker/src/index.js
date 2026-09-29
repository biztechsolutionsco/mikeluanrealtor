export default {

    async fetch(request, env) {

        if (request.method === "POST") {

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
                    formData.get("notes")
            };


            const senderEmail =
                "biztechsolutionsco@gmail.com";


            const recipientEmail =
                env.INQUIRY_NOTIFICATION_EMAIL;


            const fullName =
                `${data.first_name || ""} ${data.last_name || ""}`.trim();


            let subject;
            let body;


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

                            "Access-Control-Allow-Origin":
                                "*"
                        }
                    }
                );

            }


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


            if (!brevoResponse.ok) {

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

                            "Access-Control-Allow-Origin":
                                "*"
                        }
                    }
                );

            }


            return new Response(
                JSON.stringify({
                    success: true
                }),
                {
                    status: 200,

                    headers: {
                        "Content-Type":
                            "application/json; charset=UTF-8",

                        "Access-Control-Allow-Origin":
                            "*"
                    }
                }
            );

        }


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