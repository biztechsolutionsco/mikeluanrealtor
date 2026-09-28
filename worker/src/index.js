import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";


const sender =
    "website@addplusimmigration.ca";

const recipient =
    "biztechsolutionsco@gmail.com";


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


            const fullName =
                `${data.first_name || ""} ${data.last_name || ""}`.trim();


            let subject;
            let body;


            if (data.form_source === "home_evaluation") {

                subject =
                    `New Home Evaluation Request - ${fullName}`;

                body = `
New home evaluation request

Name:
${fullName}

Email:
${data.email}

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

----------------------------------------

This email was automatically generated from
the Mike Luan real estate website.
                `.trim();

            } else {

                subject =
                    `New Website Contact Inquiry - ${fullName}`;

                body = `
New website contact inquiry

Name:
${fullName}

Email:
${data.email}

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

----------------------------------------

This email was automatically generated from
the Mike Luan real estate website.
                `.trim();

            }


            const message =
                createMimeMessage();


            message.setSender({
                name: "Mike Luan Website",
                addr: sender
            });


            message.setRecipient(
                recipient
            );


            if (data.email) {

                message.setHeader(
                    "Reply-To",
                    data.email
                );

            }


            message.setSubject(
                subject
            );


            message.addMessage({
                contentType: "text/plain",
                data: body
            });


            const email =
                new EmailMessage(
                    sender,
                    recipient,
                    message.asRaw()
                );


            await env.EMAIL.send(
                email
            );


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