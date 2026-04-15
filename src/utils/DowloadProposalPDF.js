import Handlebars from "handlebars";

const toBase64 = async (url) => {
    try {
        if (!url) return "";

        const response = await fetch(url, {
            mode: "cors",
            cache: "no-cache"
        });

        if (!response.ok) throw new Error("Image fetch failed");

        const blob = await response.blob();

        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

    } catch (err) {
        console.error(" Base64 conversion failed:", url, err);
        
        return ""; //  IMPORTANT: don't return URL
    }
};

const waitForImages = async (element) => {
    const images = element.querySelectorAll("img");

    await Promise.all(
        Array.from(images).map((img) => {
            if (img.complete) return Promise.resolve();

            return new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        })
    );
};

const API_URL = process.env.NEXT_PUBLIC_APP_URL;

const DownloadProposal = async ({ finalData, message }) => {
    try {
        const html2pdf = (await import("html2pdf.js")).default;

        // Convert images properly
        const [logoBase64, coverBase64] = await Promise.all([
            toBase64(`${API_URL}/images/proposal/logo.png`),
            toBase64(`${API_URL}/images/proposal/cover_image.jpg`)
        ]);

        const replacements = {
            proposal_for: finalData?.finalProposalFor || "",
            address: finalData?.finalAddress || "",
            totalload: finalData?.finalTotalLoad || "",
            solarCapacity: finalData?.finalSolarCapacity || "",
            totalload_kw: finalData?.finalTotalLoad || "",
            annual_consumption: finalData?.finalAnnualConsumption || "",
            monthly_consumption: finalData?.finalMonthlyConsumption || "",
            solarCapacityMw: finalData?.finalSolarCapacity || "",
            monthly_solar_generation: finalData?.finalMonthlySolarGeneration || "",
            gridRate: finalData?.finalGridRate || "",
            sparkGridSolarCost: finalData?.finalSparkGridSolarCost || "",
            immediate_savings: finalData?.finalImmediateSaving || "",
            total_investment_crore: finalData?.finalTotalInvestmentCrore || "",
            captive_investment_crore: finalData?.finalCaptiveInvestmentCrore || "",
            table_rows: finalData?.table_rows || "",
            cumulative_savings: finalData?.finalCumulativeSavings || "",
            formatted_savings_crores: finalData?.finalFomativeSaving || "",
            sparkGridFixed: finalData?.sparkGridFixed || "",
            omChargeInitial: finalData?.omChargeInitial || "",
            today_date: finalData?.finalTodayDate || "",

            // IMPORTANT: Use Base64 ONLY
            logoUrl: logoBase64,
            coverImageUrl: coverBase64,
        };

        const compiledMessage = Handlebars.compile(message || "");
        const html = compiledMessage(replacements);

        const element = document.createElement("div");
        
        element.innerHTML = html;

        document.body.appendChild(element);

        // WAIT for images to load
        await waitForImages(element);

        const opt = {
            margin: 5,
            filename: `proposal_${Date.now()}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                allowTaint: false,
            },
            jsPDF: {
                unit: "mm",
                format: "a4",
                orientation: "portrait"
            }
        };

        await html2pdf().set(opt).from(element).save();

        document.body.removeChild(element);

    } catch (err) {
        console.error("PDF Error:", err);
    }
};

export default DownloadProposal;
