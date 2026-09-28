/* ======================================================
   SITE BASE PATH
====================================================== */

const PROPERTY_SEARCH_BASE =
    window.location.hostname.endsWith("github.io")
        ? "/mikeluanrealtor"
        : "";


/* ======================================================
   PROPERTY SEARCH COMPONENT
====================================================== */

async function loadPropertySearch() {

    const containers =
        document.querySelectorAll(
            "[data-property-search]"
        );

    if (!containers.length) {
        return;
    }

    try {

        const response = await fetch(
            `${PROPERTY_SEARCH_BASE}/components/property-search.html`
        );

        if (!response.ok) {
            throw new Error(
                "Unable to load property search component."
            );
        }

        const markup =
            await response.text();

        containers.forEach(
            (container, index) => {

                container.innerHTML = markup;

                makePropertySearchIdsUnique(
                    container,
                    index
                );

            }
        );

    } catch (error) {

        console.error(
            "Property search component error:",
            error
        );

    }

}


/* ======================================================
   MAKE FORM IDS UNIQUE
====================================================== */

function makePropertySearchIdsUnique(
    container,
    instanceIndex
) {

    const elementsWithIds =
        container.querySelectorAll("[id]");

    elementsWithIds.forEach((element) => {

        const originalId = element.id;

        const newId =
            `${originalId}-${instanceIndex + 1}`;

        const label =
            container.querySelector(
                `label[for="${originalId}"]`
            );

        element.id = newId;

        if (label) {

            label.setAttribute(
                "for",
                newId
            );

        }

    });

}


/* ======================================================
   INITIALIZE
====================================================== */

document.addEventListener(
    "DOMContentLoaded",
    loadPropertySearch
);