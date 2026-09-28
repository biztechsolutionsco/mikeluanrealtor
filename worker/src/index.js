export default {
    async fetch(request) {
        if (request.method === "POST") {
            const formData = await request.formData();

            const data = {
                first_name: formData.get("first_name"),
                last_name: formData.get("last_name"),
                email: formData.get("email"),
                phone: formData.get("phone"),
                interest: formData.get("interest"),
                timeline: formData.get("timeline"),
                message: formData.get("message"),
                form_source: formData.get("form_source")
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