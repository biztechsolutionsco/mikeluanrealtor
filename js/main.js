/* ======================================================
   SITE BASE PATH
====================================================== */

/*
    Local development / custom domain:
    SITE_BASE = ""

    GitHub Pages project site:
    SITE_BASE = "/mikeluanrealtor"
*/

const SITE_BASE =
    window.location.hostname.endsWith("github.io")
        ? "/mikeluanrealtor"
        : "";


/* ======================================================
   NORMALIZE SHARED COMPONENT PATHS
====================================================== */

/*
    header.html and footer.html use clean root-relative paths:

    /buy/
    /communities/
    /images/realtor/headshot.jpg

    Those work directly on the final custom domain.

    On GitHub Pages they need the project folder added:

    /mikeluanrealtor/buy/
    /mikeluanrealtor/communities/
    /mikeluanrealtor/images/...
*/

function normalizeComponentPaths(container) {

    if (!container || !SITE_BASE) {
        return;
    }


    /* ------------------------------------------------------
       LINKS
    ------------------------------------------------------ */

    container
        .querySelectorAll("[href]")
        .forEach((element) => {

            const href =
                element.getAttribute("href");


            if (
                !href ||
                !href.startsWith("/") ||
                href.startsWith("//")
            ) {
                return;
            }


            /*
                Prevent accidentally adding SITE_BASE twice.
            */

            if (href.startsWith(`${SITE_BASE}/`)) {
                return;
            }


            element.setAttribute(
                "href",
                `${SITE_BASE}${href}`
            );

        });


    /* ------------------------------------------------------
       IMAGES / OTHER SRC ATTRIBUTES
    ------------------------------------------------------ */

    container
        .querySelectorAll("[src]")
        .forEach((element) => {

            const src =
                element.getAttribute("src");


            if (
                !src ||
                !src.startsWith("/") ||
                src.startsWith("//")
            ) {
                return;
            }


            if (src.startsWith(`${SITE_BASE}/`)) {
                return;
            }


            element.setAttribute(
                "src",
                `${SITE_BASE}${src}`
            );

        });

}


/* ======================================================
   LOAD SHARED COMPONENT
====================================================== */

async function loadComponent(
    selector,
    componentPath
) {

    const container =
        document.querySelector(selector);


    if (!container) {
        return;
    }


    try {

        const response =
            await fetch(
                `${SITE_BASE}${componentPath}`
            );


        if (!response.ok) {

            throw new Error(
                `Unable to load ${componentPath}: ${response.status}`
            );

        }


        const html =
            await response.text();


        container.innerHTML =
            html;


        /*
            Fix root-relative paths after the
            component has been inserted.
        */

        normalizeComponentPaths(
            container
        );


    } catch (error) {

        console.error(
            `Component loading error for ${componentPath}:`,
            error
        );

    }

}


/* ======================================================
   MOBILE NAVIGATION
====================================================== */

function initializeMobileNavigation() {

    const toggle =
        document.querySelector(
            ".mobile-menu-toggle"
        );

    const mobileNav =
        document.querySelector(
            ".mobile-nav"
        );


    if (!toggle || !mobileNav) {
        return;
    }


    /* ------------------------------------------------------
       OPEN / CLOSE MENU
    ------------------------------------------------------ */

    toggle.addEventListener(
        "click",
        () => {

            const isOpen =
                mobileNav.classList.toggle(
                    "is-open"
                );


            toggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );


            toggle.setAttribute(
                "aria-label",
                isOpen
                    ? "Close navigation menu"
                    : "Open navigation menu"
            );

        }
    );


    /* ------------------------------------------------------
       CLOSE AFTER SELECTING A LINK
    ------------------------------------------------------ */

    mobileNav
        .querySelectorAll("a")
        .forEach((link) => {

            link.addEventListener(
                "click",
                () => {

                    closeMobileNavigation(
                        toggle,
                        mobileNav
                    );

                }
            );

        });


    /* ------------------------------------------------------
       ESCAPE KEY
    ------------------------------------------------------ */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key !== "Escape" ||
                !mobileNav.classList.contains(
                    "is-open"
                )
            ) {
                return;
            }


            closeMobileNavigation(
                toggle,
                mobileNav
            );


            toggle.focus();

        }
    );

}


/* ======================================================
   CLOSE MOBILE NAVIGATION
====================================================== */

function closeMobileNavigation(
    toggle,
    mobileNav
) {

    mobileNav.classList.remove(
        "is-open"
    );


    toggle.setAttribute(
        "aria-expanded",
        "false"
    );


    toggle.setAttribute(
        "aria-label",
        "Open navigation menu"
    );


    /*
        Also close the Communities submenu.
    */

    const communityDropdown =
        mobileNav.querySelector(
            ".mobile-nav-dropdown"
        );

    const communityTrigger =
        mobileNav.querySelector(
            ".mobile-nav-dropdown-trigger"
        );


    if (communityDropdown) {

        communityDropdown.classList.remove(
            "is-open"
        );

    }


    if (communityTrigger) {

        communityTrigger.setAttribute(
            "aria-expanded",
            "false"
        );

    }

}


/* ======================================================
   MOBILE COMMUNITIES DROPDOWN
====================================================== */

function initializeMobileCommunityDropdown() {

    const dropdown =
        document.querySelector(
            ".mobile-nav-dropdown"
        );

    const trigger =
        document.querySelector(
            ".mobile-nav-dropdown-trigger"
        );


    if (!dropdown || !trigger) {
        return;
    }


    trigger.addEventListener(
        "click",
        () => {

            const isOpen =
                dropdown.classList.toggle(
                    "is-open"
                );


            trigger.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

        }
    );

}


/* ======================================================
   ACTIVE NAVIGATION
====================================================== */

function initializeActiveNavigation() {

    const currentPath =
        normalizeSitePath(
            window.location.pathname
        );


    document
        .querySelectorAll(
            ".desktop-nav a, .mobile-nav a"
        )
        .forEach((link) => {

            const href =
                link.getAttribute("href");


            if (
                !href ||
                href.startsWith("mailto:") ||
                href.startsWith("tel:") ||
                href.startsWith("#")
            ) {
                return;
            }


            let linkPath;

            try {

                linkPath =
                    normalizeSitePath(
                        new URL(
                            href,
                            window.location.origin
                        ).pathname
                    );

            } catch (error) {

                return;

            }


            /*
                Exact page match.
            */

            if (linkPath === currentPath) {

                link.classList.add(
                    "is-active"
                );

            }

        });


    /*
        Individual community pages should also
        highlight the top-level Communities link.
    */

    if (
        currentPath.startsWith(
            "/communities/"
        ) &&
        currentPath !== "/communities/"
    ) {

        document
            .querySelectorAll(
                ".nav-dropdown-trigger"
            )
            .forEach((link) => {

                link.classList.add(
                    "is-active"
                );

            });

    }

}


/* ======================================================
   NORMALIZE CURRENT SITE PATH
====================================================== */

function normalizeSitePath(pathname) {

    let path =
        pathname;


    /*
        Remove the GitHub Pages project prefix.
    */

    if (
        SITE_BASE &&
        path.startsWith(SITE_BASE)
    ) {

        path =
            path.slice(
                SITE_BASE.length
            );

    }


    /*
        Ensure path begins with "/".
    */

    if (!path.startsWith("/")) {

        path =
            `/${path}`;

    }


    /*
        Treat index.html as the folder URL.
    */

    if (path.endsWith("/index.html")) {

        path =
            path.slice(
                0,
                -"index.html".length
            );

    }


    if (path === "/index.html") {

        path = "/";

    }


    return path;

}


/* ======================================================
   HANDLE DESKTOP RESIZE
====================================================== */

function initializeResponsiveReset() {

    const desktopBreakpoint =
        980;


    window.addEventListener(
        "resize",
        () => {

            if (
                window.innerWidth >
                desktopBreakpoint
            ) {

                const toggle =
                    document.querySelector(
                        ".mobile-menu-toggle"
                    );

                const mobileNav =
                    document.querySelector(
                        ".mobile-nav"
                    );


                if (
                    toggle &&
                    mobileNav
                ) {

                    closeMobileNavigation(
                        toggle,
                        mobileNav
                    );

                }

            }

        }
    );

}


/* ======================================================
   INITIALIZE SITE
====================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        /*
            Load header and footer first because
            navigation does not exist until these
            components have been inserted.
        */

        await Promise.all([

            loadComponent(
                "#site-header",
                "/components/header.html"
            ),

            loadComponent(
                "#site-footer",
                "/components/footer.html"
            )

        ]);

         /*
            UPDATE COPYRIGHT YEAR
        */

        document
            .querySelectorAll("[data-current-year]")
            .forEach((element) => {
                element.textContent =
                    new Date().getFullYear();
            });


        /*
            Initialize behavior after shared
            components are present.
        */

        initializeMobileNavigation();

        initializeMobileCommunityDropdown();

        initializeActiveNavigation();

        initializeResponsiveReset();

    }
);

/* ======================================================
   CONTACT FORM SUBMISSION
====================================================== */

const contactForm = document.querySelector("[data-contact-form]");

if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const formMessage = contactForm.querySelector(
            "[data-form-message]"
        );

        try {

            const formData = new FormData(contactForm);

            const response = await fetch(
                contactForm.action,
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
                "Thank you. Your message has been submitted.";

            formMessage.classList.remove("is-error");
            formMessage.classList.add("is-success");

            contactForm.reset();

        } catch (error) {

            console.error(
                "Contact form submission error:",
                error
            );

            formMessage.textContent =
                error.message ||
                "Something went wrong. Please try again.";
            formMessage.classList.remove("is-success");
            formMessage.classList.add("is-error");
        }

    });
}

/* ======================================================
   CLOUDFLARE TURNSTILE
====================================================== */

function renderTurnstileWidgets(root = document) {

    if (
        !window.turnstile
    ) {
        return;
    }


    const widgets =
        root.querySelectorAll(
            ".cf-turnstile:not([data-turnstile-rendered])"
        );


    widgets.forEach((widget) => {

        window.turnstile.render(
            widget,
            {
                sitekey:
                    widget.dataset.sitekey,

                action:
                    widget.dataset.action
            }
        );


        widget.setAttribute(
            "data-turnstile-rendered",
            "true"
        );

    });

}


window.renderTurnstileWidgets =
    renderTurnstileWidgets;


document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderTurnstileWidgets();

    }
);