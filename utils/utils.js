export function numberToFrenchWords(number) {
    if (typeof number !== "number") {
        throw new Error("Input must be a number");
    }

    const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
    const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
    const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "", "quatre-vingt", ""];
    const thousands = ["", "mille", "million", "milliard"];

    function convertLessThanThousand(n) {
        if (n === 0) return "";
        let result = "";

        // Hundreds
        if (n >= 100) {
            const hundreds = Math.floor(n / 100);
            result += hundreds === 1 ? "cent" : units[hundreds] + " cent";
            if (n % 100 === 0 && hundreds > 1) result += "s";
            if (n % 100 > 0) result += " ";
            n %= 100;
        }

        // Tens & units
        if (n >= 20) {
            const tenIndex = Math.floor(n / 10);
            const unit = n % 10;

            // 70–79 & 90–99
            if (tenIndex === 7 || tenIndex === 9) {
                const base = tenIndex === 7 ? "soixante" : "quatre-vingt";
                const teenIndex = n - (tenIndex === 7 ? 60 : 80) - 10;

                if (n === 71) {
                    result += "soixante-et-onze";
                } else {
                    result += base + "-" + teens[teenIndex];
                }
            } else {
                result += tens[tenIndex];
                if (unit === 1 && tenIndex !== 8) result += "-et-un";
                else if (unit > 0) result += "-" + units[unit];
                else if (tenIndex === 8) result += "s";
            }
        } else if (n >= 10) {
            result += teens[n - 10];
        } else if (n > 0) {
            result += units[n];
        }

        return result.trim();
    }

    function numberToWords(n) {
        if (n === 0) return "zéro";

        let parts = [];
        let index = 0;

        while (n > 0) {
            const chunk = n % 1000;
            if (chunk > 0) {
                let chunkText = convertLessThanThousand(chunk);

                if (index === 1) {
                    chunkText = chunk === 1 ? "mille" : chunkText + " mille";
                } else if (index > 1) {
                    chunkText += " " + thousands[index];
                    if (chunk > 1) chunkText += "s";
                }

                parts.unshift(chunkText);
            }
            n = Math.floor(n / 1000);
            index++;
        }

        return parts.join(" ").trim();
    }

    let prefix = "";
    if (number < 0) {
        prefix = "moins ";
        number = Math.abs(number);
    }

    const integerPart = Math.floor(number);
    const decimalPart = Math.round((number - integerPart) * 100);

    let words = numberToWords(integerPart) + " dirhams";
    if (decimalPart > 0) {
        words += " et " + numberToWords(decimalPart) + " centimes";
    }

    return prefix + words;
}
