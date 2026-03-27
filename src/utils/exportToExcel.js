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

    worksheet.addRow(headers.map(h => h.label));

    rows.forEach(row => {

        const rowData = headers.map(h => row[h.key] ?? "");

        worksheet.addRow(rowData);
    });

    workbook.xlsx.writeBuffer().then(buffer => {

        const blob = new Blob([buffer], { type: "application/octet-stream" });

        saveAs(blob, fileName);
    }).catch(err => {

        console.error("Error exporting Excel file:", err);
    });
};
