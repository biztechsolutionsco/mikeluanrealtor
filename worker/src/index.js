export default {
    async fetch(request) {
        if (request.method === "POST") {
            return new Response("Form submission received.", {
                status: 200,
                headers: {
                    "Content-Type": "text/plain; charset=UTF-8"
                }
            });
        }

        return new Response("Mike Luan form worker is running.", {
            status: 200,
            headers: {
                "Content-Type": "text/plain; charset=UTF-8"
            }
        });
    }
};