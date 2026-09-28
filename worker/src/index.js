export default {
    async fetch(request) {
        if (request.method === "POST") {
            const formData = await request.formData();

            const data = {
                form_source: formData.get("form_source"),

                first_name: formData.get("first_name"),
                last_name: formData.get("last_name"),
                email: formData.get("email"),
                phone: formData.get("phone"),

                interest: formData.get("interest"),
                timeline: formData.get("timeline"),
                message: formData.get("message"),

                property_address: formData.get("property_address"),
                property_type: formData.get("property_type"),
                selling_timeline: formData.get("selling_timeline"),
                bedrooms: formData.get("bedrooms"),
                bathrooms: formData.get("bathrooms"),
                notes: formData.get("notes")
            };

            return new Response(JSON.stringify(data, null, 2), {
                status: 200,
                headers: {
                    "Content-Type": "application/json; charset=UTF-8"
                }
            });
        }

        return new Response("Mike Luan form worker is running!!", {
            status: 200,
            headers: {
                "Content-Type": "text/plain; charset=UTF-8"
            }
        });
    }
};