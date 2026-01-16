   export const numberToFrenchWords = (number) => {
    if (!Number.isInteger(number)) {
        throw new Error("Input must be an integer");
    }

    if (number < 0) {
        return "moins " + numberToFrenchWords(Math.abs(number));
    }

    const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
    const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
    const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "", "quatre-vingt", ""];
    const thousands = ["", "mille", "million", "milliard"];

    function convertLessThanThousand(n) {
        if (n === 0) return "";
        let result = "";

        if (n >= 100) {
            const hundreds = Math.floor(n / 100);
            if (hundreds === 1) {
                result += "cent";
            } else {
                result += units[hundreds] + " cent";
            }
            if (n % 100 === 0 && hundreds > 1) {
                result += "s";
            }
            if (n % 100 > 0) {
                result += " ";
            }
            n %= 100;
        }

        if (n > 0) {
            if (n >= 20) {
                const tenIndex = Math.floor(n / 10);
                const unit = n % 10;
                if (tenIndex === 7 || tenIndex === 9) {
                    const base = tenIndex === 7 ? "soixante" : "quatre-vingt";
                    if (unit === 0) {
                        result += base + "-" + teens[0];
                    } else {
                        result += base + "-" + teens[unit]; // no "et" here
                    }
                } else {
                    result += tens[tenIndex];
                    if (unit === 1 && tenIndex !== 8) {
                        result += "-et-" + units[unit];
                    } else if (unit > 0) {
                        result += "-" + units[unit];
                    } else if (tenIndex === 8 && unit === 0) {
                        result += "s"; // quatre-vingts
                    }
                }
            } else if (n >= 10) {
                result += teens[n - 10];
            } else {
                result += units[n];
            }
        }

        return result.trim();
    }

    if (number === 0) {
        return "zéro";
    }

    let n = number;
    let groupIndex = 0;
    const parts = [];

    while (n > 0) {
        const group = n % 1000;
        if (group !== 0) {
            const words = convertLessThanThousand(group);
            const scale = thousands[groupIndex];

            if (groupIndex === 0) {
                parts.unshift(words);
            } else if (groupIndex === 1) {
                // "mille" never takes "un" (1000 = "mille")
                if (group === 1) {
                    parts.unshift(scale);
                } else {
                    parts.unshift(`${words} ${scale}`);
                }
            } else {
                // million/milliard pluralization
                const plural = group > 1 ? "s" : "";
                parts.unshift(`${words} ${scale}${plural}`);
            }
        }
        n = Math.floor(n / 1000);
        groupIndex++;
    }

    return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export default {
    numberToFrenchWords,
};
