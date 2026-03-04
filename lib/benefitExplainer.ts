export const benefitMap: Record<string, Record<string, string>> = {
    "dryness": {
        "hydration": "Boosts moisture levels instantly and strengthens the skin barrier to lock in hydration for 24 hours.",
        "dry": "Provides deep, long-lasting hydration without feeling heavy.",
        "moisturizer": "Nourishes the skin and locks in essential moisture to combat dryness.",
    },
    "dullness": {
        "brightening": "Contains Vitamin B3 that visibly brightens and evens skin tone in 7 days.",
        "radiance": "Revitalizes dull skin to restore a healthy, natural glow."
    },
    "oiliness": {
        "oilcontrol": "Controls excess sebum and minimizes shine for up to 12 hours.",
        "oily": "Lightweight formula that balances oil production without clogging pores.",
        "acne": "Helps clarify the skin and prevent breakouts by balancing oil levels."
    },
    "acne": {
        "acne": "Targets blemishes and helps clear up breakouts while soothing redness."
    },
    "sensitive": {
        "sensitive": "Gentle, fragrance-free formula that soothes irritation and protects delicate skin.",
    },
    "hairfall": {
        "thicklong": "Strengthens hair roots and reduces breakage by up to 90%.",
        "hair_shampoo": "Cleanses gently while fortifying strands to prevent hair fall."
    },
    "all-hair": {
        "hair_shampoo": "A gentle daily cleanser that maintains healthy, shiny hair.",
        "hair_conditioner": "Softens and detangles for smooth, manageable hair.",
        "hair_treatment": "Provides deep nourishment to keep hair looking vibrant and healthy."
    },
    "straight": {
        "straight": "Keeps hair sleek, smooth, and frizz-free all day long."
    },
    "curly": {
        "curly": "Defines curls and coils while providing intense moisture and bounce.",
        "coily": "Deeply moisturizes and enhances natural curl patterns."
    },
    "wavy": {
        "wavy": "Enhances natural waves without weighing them down."
    }
};

/**
 * Generates a personalized reason why a product is recommended.
 * @param productTags Tags belonging to the product (e.g., "dry", "moisturizer")
 * @param userTags Target tags based on the user's analysis (e.g., "dryness", "dullness")
 * @param category The product's overarching category
 * @returns A formatted string explaining the recommendation
 */
export function generateReason(productTags: string[], userTags: string[], category: string): string {
    // Try to match a user concern (user tag) to a product tag using the benefit map
    for (const userTag of userTags) {
        if (benefitMap[userTag]) {
            for (const productTag of productTags) {
                if (benefitMap[userTag][productTag]) {
                    const concernFormatted = userTag.replace(/_/g, " ");
                    return `Helps with your **${concernFormatted}** because it ${benefitMap[userTag][productTag].toLowerCase()}`;
                }
            }

            // Fallback: Check if the category has a specific message for this concern
            if (benefitMap[userTag][category]) {
                const concernFormatted = userTag.replace(/_/g, " ");
                return `Helps with your **${concernFormatted}** because it ${benefitMap[userTag][category].toLowerCase()}`;
            }
        }
    }

    // Fallback if no specific match is found, but we want to sound personalized
    const labels = userTags.slice(0, 2).map((t) => t.replace(/_/g, " "));
    if (labels.length > 0) {
        return `Carefully selected to support your overall profile, paying special attention to your **${labels.join(" and ")}**.`;
    }

    return "A solid essential carefully selected for your daily routine.";
}
