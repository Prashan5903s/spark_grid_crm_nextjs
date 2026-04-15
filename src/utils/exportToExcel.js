import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportToExcel = ({
    headers,
    rows,
    fileName = "report.xlsx",
    sheetName = "Report",
}) => {

    if (!rows || rows.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Add header row
    worksheet.addRow(headers.map(h => h.label));

    // Add data rows
    rows.forEach(row => {

        const rowData = headers.map(h => {
            if (typeof h.key === "function") {
                return h.key(row); // ✅ handle computed values
            }

            return row[h.key] ?? ""; // fallback for simple keys
        });

        worksheet.addRow(rowData);
    });

    // Export
    workbook.xlsx.writeBuffer().then(buffer => {

        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        saveAs(blob, fileName);
    }).catch(err => {
        console.error("Error exporting Excel file:", err);
    });
};
