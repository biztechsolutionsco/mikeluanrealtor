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