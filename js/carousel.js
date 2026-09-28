/* ======================================================
   REUSABLE CAROUSEL
====================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const carousels =
        document.querySelectorAll("[data-carousel]");

    carousels.forEach(initializeCarousel);

});

/* ======================================================
   INITIALIZE CAROUSEL
====================================================== */

function initializeCarousel(track) {

    const items =
        Array.from(track.children);

    const minimumItems =
        parseInt(
            track.dataset.carouselMin || "3",
            10
        );

    /*
     * Do not activate carousel unless
     * the number of items exceeds the minimum.
     */

    if (items.length <= minimumItems) {
        return;
    }

    /* ==================================================
       SETTINGS
    ================================================== */

    const desktopVisible =
        parseInt(
            track.dataset.carouselVisible || "3",
            10
        );

    const interval =
        parseInt(
            track.dataset.carouselInterval || "5000",
            10
        );

    /* ==================================================
       CAROUSEL CLASSES
    ================================================== */

    track.classList.add(
        "is-carousel",
        `carousel-visible-${desktopVisible}`
    );

    track.classList.remove(
        "testimonial-grid-single"
    );

    /* ==================================================
       CREATE WRAPPER
    ================================================== */

    const wrapper =
        document.createElement("div");

    wrapper.className = "carousel-wrapper";


    track.parentNode.insertBefore(
        wrapper,
        track
    );

    wrapper.appendChild(track);

    /* ==================================================
    CREATE NAVIGATION
    ================================================== */

    const navigation =
        document.createElement("div");

    navigation.className =
        "carousel-navigation";


    /* Previous button */

    const previousButton =
        document.createElement("button");

    previousButton.type = "button";

    previousButton.className =
        "carousel-arrow carousel-arrow-prev";

    previousButton.setAttribute(
        "aria-label",
        "Previous"
    );

    previousButton.innerHTML =
        '<span aria-hidden="true">←</span>';

    /* Progress track */

    const progressTrack =
        document.createElement("div");

    progressTrack.className =
        "carousel-progress";


    const progressThumb =
        document.createElement("div");

    progressThumb.className =
        "carousel-progress-thumb";


    progressTrack.appendChild(
        progressThumb
    );

    /* Next button */

    const nextButton =
        document.createElement("button");

    nextButton.type = "button";

    nextButton.className =
        "carousel-arrow carousel-arrow-next";

    nextButton.setAttribute(
        "aria-label",
        "Next"
    );

    nextButton.innerHTML =
        '<span aria-hidden="true">→</span>';

    /* Assemble */

    navigation.appendChild(
        previousButton
    );

    navigation.appendChild(
        progressTrack
    );

    navigation.appendChild(
        nextButton
    );

    /* Put navigation underneath carousel */

    wrapper.appendChild(
        navigation
    );

    /* ==================================================
       STATE
    ================================================== */

    let currentIndex = 0;

    let autoplayTimer = null;

    let scrollTimer = null;

    let isPaused = false;


    const prefersReducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );


    /* ==================================================
       GET GAP
    ================================================== */

    function getGap() {

        const styles =
            window.getComputedStyle(track);

        return (
            parseFloat(styles.columnGap) ||
            parseFloat(styles.gap) ||
            0
        );

    }


    /* ==================================================
       GET NUMBER OF VISIBLE ITEMS
    ================================================== */

    function getVisibleCount() {

        const firstItem = items[0];

        if (!firstItem) {
            return 1;
        }

        const itemWidth =
            firstItem.getBoundingClientRect().width;

        const trackWidth =
            track.getBoundingClientRect().width;

        const gap =
            getGap();

        if (!itemWidth) {
            return 1;
        }

        return Math.max(
            1,
            Math.floor(
                (trackWidth + gap) /
                (itemWidth + gap)
            )
        );

    }


    /* ==================================================
       MAXIMUM INDEX
    ================================================== */

    function getMaximumIndex() {

        return Math.max(
            0,
            items.length - getVisibleCount()
        );

    }


    /* ==================================================
       SCROLL TO CARD
    ================================================== */

    function scrollToIndex(index) {

        const maximumIndex =
            getMaximumIndex();

        /*
         * Loop around.
         */

        if (index > maximumIndex) {

            currentIndex = 0;

        } else if (index < 0) {

            currentIndex =
                maximumIndex;

        } else {

            currentIndex =
                index;

        }


        const targetItem =
            items[currentIndex];

        if (!targetItem) {
            return;
        }


        track.scrollTo({
            left: targetItem.offsetLeft,
            behavior:
                prefersReducedMotion.matches
                    ? "auto"
                    : "smooth"
        });

        updateProgress();
    }

    /* ==================================================
    UPDATE PROGRESS
    ================================================== */

    function updateProgress() {

        const maximumIndex =
            getMaximumIndex();

        if (maximumIndex <= 0) {

            progressThumb.style.width = "100%";
            progressThumb.style.transform =
                "translateX(0)";

            return;

        }


        const visibleCount =
            getVisibleCount();

        const totalItems =
            items.length;


        /*
        * Thumb width represents how much
        * of the carousel is currently visible.
        */

        const thumbPercentage =
            (visibleCount / totalItems) * 100;


        /*
        * Remaining track available for movement.
        */

        const travelPercentage =
            100 - thumbPercentage;


        /*
        * Current position through carousel.
        */

        const progress =
            currentIndex / maximumIndex;


        progressThumb.style.width =
            `${thumbPercentage}%`;

        progressThumb.style.transform =
            `translateX(${
                progress * travelPercentage * 100 / thumbPercentage
            }%)`;

    }

    /* ==================================================
       NEXT / PREVIOUS
    ================================================== */

    function showNext() {

        scrollToIndex(
            currentIndex + 1
        );

    }


    function showPrevious() {

        scrollToIndex(
            currentIndex - 1
        );

    }


    /* ==================================================
       AUTOPLAY
    ================================================== */

    function startAutoplay() {

        stopAutoplay();


        if (
            prefersReducedMotion.matches ||
            isPaused
        ) {
            return;
        }


        autoplayTimer =
            window.setInterval(
                showNext,
                interval
            );

    }


    function stopAutoplay() {

        if (autoplayTimer) {

            window.clearInterval(
                autoplayTimer
            );

            autoplayTimer = null;

        }

    }


    function restartAutoplay() {

        stopAutoplay();
        startAutoplay();

    }


    /* ==================================================
       BUTTON EVENTS
    ================================================== */

    previousButton.addEventListener(
        "click",
        () => {

            showPrevious();
            restartAutoplay();

        }
    );


    nextButton.addEventListener(
        "click",
        () => {

            showNext();
            restartAutoplay();

        }
    );


    /* ==================================================
       PAUSE ON HOVER
    ================================================== */

    wrapper.addEventListener(
        "mouseenter",
        () => {

            isPaused = true;
            stopAutoplay();

        }
    );


    wrapper.addEventListener(
        "mouseleave",
        () => {

            isPaused = false;
            startAutoplay();

        }
    );


    /* ==================================================
       PAUSE FOR KEYBOARD USERS
    ================================================== */

    wrapper.addEventListener(
        "focusin",
        () => {

            isPaused = true;
            stopAutoplay();

        }
    );


    wrapper.addEventListener(
        "focusout",
        () => {

            /*
             * Wait until focus has actually moved.
             */

            window.setTimeout(
                () => {

                    if (
                        !wrapper.contains(
                            document.activeElement
                        )
                    ) {

                        isPaused = false;
                        startAutoplay();

                    }

                },
                0
            );

        }
    );


    /* ==================================================
       TRACK MANUAL SCROLLING
    ================================================== */

    track.addEventListener(
        "scroll",
        () => {

            window.clearTimeout(
                scrollTimer
            );


            scrollTimer =
                window.setTimeout(
                    updateIndexFromScroll,
                    100
                );

        },
        {
            passive: true
        }
    );


    function updateIndexFromScroll() {

        const scrollPosition =
            track.scrollLeft;

        let closestIndex = 0;

        let closestDistance =
            Infinity;


        items.forEach(
            (item, index) => {

                const distance =
                    Math.abs(
                        item.offsetLeft -
                        scrollPosition
                    );

                if (
                    distance <
                    closestDistance
                ) {

                    closestDistance =
                        distance;

                    closestIndex =
                        index;

                }

            }
        );


        currentIndex =
            Math.min(
                closestIndex,
                getMaximumIndex()
            );

        updateProgress();
    }

    /* ==================================================
    CLICK PROGRESS TRACK
    ================================================== */

    progressTrack.addEventListener(
        "click",
        (event) => {

            const rect =
                progressTrack.getBoundingClientRect();

            const clickPosition =
                event.clientX - rect.left;

            const percentage =
                clickPosition / rect.width;

            const maximumIndex =
                getMaximumIndex();

            const targetIndex =
                Math.round(
                    percentage * maximumIndex
                );

            scrollToIndex(
                targetIndex
            );

            restartAutoplay();

        }
    );


    /* ==================================================
       HANDLE WINDOW RESIZE
    ================================================== */

    let resizeTimer = null;


    window.addEventListener(
        "resize",
        () => {

            window.clearTimeout(
                resizeTimer
            );


            resizeTimer =
                window.setTimeout(
                    () => {

                        const maximumIndex =
                            getMaximumIndex();

                        currentIndex =
                            Math.min(
                                currentIndex,
                                maximumIndex
                            );

                        scrollToIndex(
                            currentIndex
                        );

                    },
                    150
                );

        }
    );


    /* ==================================================
       PAGE VISIBILITY
    ================================================== */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (document.hidden) {

                stopAutoplay();

            } else {

                startAutoplay();

            }

        }
    );


    /* ==================================================
       REDUCED MOTION
    ================================================== */

    prefersReducedMotion.addEventListener(
        "change",
        () => {

            if (
                prefersReducedMotion.matches
            ) {

                stopAutoplay();

            } else {

                startAutoplay();

            }

        }
    );


    /* ==================================================
       START
    ================================================== */

    updateProgress();

    startAutoplay();

}