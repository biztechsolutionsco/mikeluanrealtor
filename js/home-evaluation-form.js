/* ======================================================
   HOME EVALUATION FORM LOADER
====================================================== */

const homeEvaluationScriptUrl =
    new URL(document.currentScript.src);

const homeEvaluationFormUrl =
    new URL(
        "../components/home-evaluation-form.html",
        homeEvaluationScriptUrl
    );

async function loadHomeEvaluationForm() {
    const containers = document.querySelectorAll(
        "[data-home-evaluation-form]"
    );

    if (!containers.length) {
        return;
    }
    try {
        const response = await fetch(
            homeEvaluationFormUrl.href
        );
        if (!response.ok) {
            throw new Error(
                `Unable to load home evaluation form: ${response.status}`
            );
        }
        const html = await response.text();
        containers.forEach((container) => {
            container.innerHTML = html;
            if (
                window.renderTurnstileWidgets
            ) {

                window.renderTurnstileWidgets(
                    container
                );

            }
            const form = container.querySelector(
                "[data-home-evaluation-form-element]"
            );
            if (!form) {
                return;
            }
            form.addEventListener("submit", async (event) => {
                event.preventDefault();
                const formMessage = form.querySelector(
                    "[data-form-message]"
                );
                try {
                    const formData = new FormData(form);
                    const response = await fetch(
                        form.action,
                        {
                            method: "POST",
                            body: formData
                        }
                    );
                    const result =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            result.message ||
                            "Something went wrong. Please try again."
                        );

                    }
                    formMessage.textContent =
                        "Thank you. Your home evaluation request has been submitted.";
                    formMessage.classList.remove("is-error");
                    formMessage.classList.add("is-success");
                    form.reset();
                } catch (error) {
                    console.error(
                        "Home evaluation submission error:",
                        error
                    );
                    formMessage.textContent =
                        error.message ||
                        "Something went wrong. Please try again.";
                    formMessage.classList.remove("is-success");
                    formMessage.classList.add("is-error");
                }
            });
        });
    } catch (error) {
        console.error(
            "Home evaluation form loading error:",
            error
        );
    }
}

document.addEventListener(
    "DOMContentLoaded",
    loadHomeEvaluationForm
);