export default {
    async fetch(request) {
        return new Response("Mike Luan form worker is running.", {
            status: 200,
            headers: {
                "Content-Type": "text/plain; charset=UTF-8"
            }
        });
    }
};