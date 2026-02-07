import { BcPdfGenerator } from "../utils/pdfbc.js";

export const downloadpdf =  async (bc, req, res) => {
     if (!bc) {
        throw new Error("BC object is required for PDF generation");
    }
    await BcPdfGenerator.buildBcPdf(bc, { res, returnBuffer: false, req });
    
}
export const getpdfBuffer =  async (bc, req) => {
    if (!bc) {
        throw new Error("BC object is required for PDF generation");
    }
    const pdfBuffer = await BcPdfGenerator.buildBcPdf(bc, { res: null, returnBuffer: true, req });
    return pdfBuffer;
}