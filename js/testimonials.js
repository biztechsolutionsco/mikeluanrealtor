/* ======================================================
   TESTIMONIAL STAR RATINGS
====================================================== */

function initializeTestimonialRatings() {

    const ratings =
        document.querySelectorAll(".testimonial-rating");

    ratings.forEach((ratingElement) => {

        let rating =
            parseFloat(
                ratingElement.dataset.rating
            );

        if (isNaN(rating)) {
            rating = 0;
        }

        /* Keep rating between 0 and 5 */

        rating =
            Math.max(
                0,
                Math.min(5, rating)
            );

        /* Round to nearest 0.5 */

        rating =
            Math.round(rating * 2) / 2;

        let stars = "";

        for (let i = 1; i <= 5; i++) {

            if (rating >= i) {

                stars +=
                    '<span class="star full">★</span>';

            } else if (rating >= i - 0.5) {

                stars +=
                    '<span class="star half">★</span>';

            } else {

                stars +=
                    '<span class="star empty">★</span>';

            }

        }

        ratingElement.innerHTML = stars;

        ratingElement.setAttribute(
            "aria-label",
            `${rating} out of 5 stars`
        );

    });

}


/* ======================================================
   INITIALIZE
====================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeTestimonialRatings
);