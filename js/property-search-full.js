/* ======================================================
   FULL PROPERTY SEARCH
====================================================== */

const propertySearchFullScriptUrl =
    new URL(document.currentScript.src);

const propertySearchFullComponentUrl =
    new URL(
        "../components/property-search-full.html",
        propertySearchFullScriptUrl
    );


async function loadFullPropertySearch() {

    const containers = document.querySelectorAll(
        "[data-property-search-full]"
    );

    if (!containers.length) {
        return;
    }

    try {

        const response = await fetch(
            propertySearchFullComponentUrl.href
        );

        if (!response.ok) {
            throw new Error(
                `Unable to load full property search: ${response.status}`
            );
        }

        const html = await response.text();

        containers.forEach((container) => {
            container.innerHTML = html;
        });

        initializeFullPropertySearch();

    } catch (error) {

        console.error(
            "Full property search loading error:",
            error
        );

    }

}


/* ======================================================
   INITIALIZE SEARCH
====================================================== */

function initializeFullPropertySearch() {

    initializePropertyMap();
    initializePropertyViewToggle();
    initializePropertySearchControls();

}


/* ======================================================
   MAP
====================================================== */

function initializePropertyMap() {

    const mapElement =
        document.getElementById("property-search-map");

    if (!mapElement) {
        return;
    }

    if (typeof L === "undefined") {

        console.error(
            "Leaflet is not loaded."
        );

        return;
    }


    /*
        Default Ontario view.

        This is intentionally wider than the GTA so the user
        sees Ontario before selecting a location.
    */

    const map = L.map(
        mapElement,
        {
            zoomControl: true,
            scrollWheelZoom: true
        }
    ).setView(
        [43.92, -79.40],
        10
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(map);


    window.mikePropertyMap = map;

}


/* ======================================================
   MOBILE LIST / MAP TOGGLE
====================================================== */

function initializePropertyViewToggle() {

    const buttons =
        document.querySelectorAll(
            "[data-property-view]"
        );

    const resultsPanel =
        document.querySelector(
            "[data-property-results-panel]"
        );

    const mapPanel =
        document.querySelector(
            "[data-property-map-panel]"
        );

    if (
        !buttons.length ||
        !resultsPanel ||
        !mapPanel
    ) {
        return;
    }


    buttons.forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                const view =
                    button.dataset.propertyView;


                buttons.forEach((item) => {
                    item.classList.remove("is-active");
                });

                button.classList.add("is-active");


                if (view === "map") {

                    resultsPanel.classList.add(
                        "is-mobile-hidden"
                    );

                    mapPanel.classList.remove(
                        "is-mobile-hidden"
                    );


                    if (window.mikePropertyMap) {

                        setTimeout(() => {

                            window.mikePropertyMap
                                .invalidateSize();

                        }, 100);

                    }

                } else {

                    resultsPanel.classList.remove(
                        "is-mobile-hidden"
                    );

                    mapPanel.classList.add(
                        "is-mobile-hidden"
                    );

                }

            }
        );

    });

}


/* ======================================================
   SEARCH CONTROLS
====================================================== */

function initializePropertySearchControls() {

    const button =
        document.querySelector(
            "[data-full-property-search-button]"
        );

    const locationInput =
        document.getElementById(
            "property-search-location"
        );

    if (!button || !locationInput) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            runTemporaryPropertySearch();

        }
    );


    locationInput.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Enter") {

                event.preventDefault();

                runTemporaryPropertySearch();

            }

        }
    );

}


/* ======================================================
   TEMPORARY SEARCH BEHAVIOUR
====================================================== */

function runTemporaryPropertySearch() {

    const locationInput =
        document.getElementById(
            "property-search-location"
        );

    const resultsList =
        document.querySelector(
            "[data-property-results-list]"
        );

    const resultsCount =
        document.querySelector(
            "[data-property-results-count]"
        );


    if (
        !locationInput ||
        !resultsList ||
        !resultsCount
    ) {
        return;
    }


    const location =
        locationInput.value.trim();


    /*
        Temporary placeholder behaviour.

        This will later be replaced by live listing data.
    */

    if (!location) {

        resultsCount.textContent =
            "0 properties";

        resultsList.innerHTML = `
            <div class="property-results-empty">

                <h3>
                    Enter a Location
                </h3>

                <p>
                    Search by city, neighbourhood or address
                    to begin exploring properties.
                </p>

            </div>
        `;

        return;

    }


    resultsCount.textContent =
        "Search ready";

    resultsList.innerHTML = `
        <div class="property-results-empty">

            <h3>
                Searching ${escapePropertySearchHtml(location)}
            </h3>

            <p>
                The search interface is ready.
                Live property results will appear here
                once the listing data feed is connected.
            </p>

        </div>
    `;

}


/* ======================================================
   HTML SAFETY
====================================================== */

function escapePropertySearchHtml(value) {

    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* ======================================================
   LOAD COMPONENT
====================================================== */

document.addEventListener(
    "DOMContentLoaded",
    loadFullPropertySearch
);