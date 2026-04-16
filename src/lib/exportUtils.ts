import { AnalysisReport } from "../types";
import ExcelJS from "exceljs";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import pptxgen from "pptxgenjs";
import { saveAs } from "file-saver";

export async function exportToExcel(report: AnalysisReport) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Data Export");

  sheet.columns = [
    { header: "Label / Category", key: "label", width: 30 },
    { header: "Value / Metric", key: "value", width: 20 },
  ];

  if (report.chartData && report.chartData.length > 0) {
    report.chartData.forEach((data) => {
      sheet.addRow({ label: data.label, value: data.value });
    });
  } else {
    sheet.addRow({ label: "No metric data available", value: "" });
  }

  // Styling
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF141414' }
  };
  sheet.getRow(1).font = { color: { argb: 'FFE4E3E0' }, bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `Ozone_Data_Export_${Date.now()}.xlsx`);
}

export async function exportToWord(report: AnalysisReport) {
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      text: "Ozone Co. Intelligence Report",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: "Executive Summary",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [new TextRun(report.executiveSummary)],
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: "Confidence Score: " + report.confidenceScore + "%",
      spacing: { before: 200, after: 400 },
    }),
    ...(report.salesReview ? [
      new Paragraph({
        text: "Sales & Performance Review",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: [new TextRun(report.salesReview)],
        spacing: { after: 400 },
      })
    ] : []),
    new Paragraph({
      text: "Critical Anomalies",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    ...report.criticalAnomalies.map(anomaly => new Paragraph({
      text: "• " + anomaly,
      spacing: { after: 100 },
    })),
    new Paragraph({
      text: "The Why (Root Cause Analysis)",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 100 },
    }),
    new Paragraph({
      children: [new TextRun(report.theWhy)],
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: "Action Plan",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    ...report.actionPlan.map(action => new Paragraph({
      text: "✓ " + action,
      spacing: { after: 100 },
    })),
  ];

  if (report.chartData && report.chartData.length > 0) {
    children.push(
      new Paragraph({
        text: report.chartTitle || "Metric Analysis",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );
    
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "eeeeee" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "eeeeee" },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Metric / Category", bold: true })] })], shading: { fill: "f3f4f6" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Value", bold: true })] })], shading: { fill: "f3f4f6" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Visual Indicator", bold: true })] })], shading: { fill: "f3f4f6" } }),
          ],
        }),
        ...report.chartData.map(data => {
          const barLength = Math.min(Math.floor(data.value / 10), 20);
          const bar = "█".repeat(barLength) || "▏";
          return new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(data.label)] }),
              new TableCell({ children: [new Paragraph(data.value.toString())] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: bar, color: "2563EB" })] })] }),
            ],
          });
        })
      ]
    });
    children.push(table);
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Ozone_Intelligence_Report_${Date.now()}.docx`);
}

export async function exportToPPT(report: AnalysisReport) {
  const pptx = new pptxgen();

  // Title Slide
  let slide = pptx.addSlide();
  slide.background = { color: "020617" };
  slide.addText("OZONE CO.", { x: 0.5, y: 1.5, w: "90%", h: 1, fontSize: 44, color: "00f3ff", align: "center", bold: true });
  slide.addText("INTELLIGENCE REPORT", { x: 0.5, y: 2.5, w: "90%", h: 0.5, fontSize: 24, color: "E4E3E0", align: "center" });

  // Executive Summary
  slide = pptx.addSlide();
  slide.addText("EXECUTIVE SUMMARY", { x: 0.5, y: 0.5, w: "90%", h: 0.5, fontSize: 24, color: "000B26", bold: true });
  slide.addText(report.executiveSummary, { x: 0.5, y: 1.5, w: "90%", h: 1.5, fontSize: 18, color: "333333" });
  
  slide.addText("CONFIDENCE SCORE", { x: 0.5, y: 3.5, w: "45%", h: 0.5, fontSize: 14, color: "000B26", bold: true });
  slide.addText(`${report.confidenceScore}%`, { x: 0.5, y: 4.0, w: "45%", h: 1, fontSize: 36, color: "2563EB", bold: true });

  // Chart Slide
  if (report.chartData && report.chartData.length > 0) {
    slide = pptx.addSlide();
    slide.addText(report.chartTitle || "METRIC ANALYSIS", { x: 0.5, y: 0.5, w: "90%", h: 0.5, fontSize: 24, color: "000B26", bold: true });
    
    const dataChart = [
      {
        name: report.chartTitle || "Metrics",
        labels: report.chartData.map(d => d.label),
        values: report.chartData.map(d => d.value)
      }
    ];
    
    slide.addChart(pptx.ChartType.bar, dataChart, { 
      x: 0.5, y: 1.2, w: 9, h: 4,
      showTitle: false,
      barDir: 'col',
      chartColors: ['2563EB', '00F3FF'],
      valAxisLabelFontSize: 10,
      catAxisLabelFontSize: 10,
      showLegend: true,
      legendPos: 'b'
    });
  }

  // Sales Review
  if (report.salesReview) {
    slide = pptx.addSlide();
    slide.addText("SALES & PERFORMANCE REVIEW", { x: 0.5, y: 0.5, w: "90%", h: 0.5, fontSize: 24, color: "000B26", bold: true });
    slide.addText(report.salesReview, { x: 0.5, y: 1.5, w: "90%", h: 3.5, fontSize: 16, color: "333333", valign: "top" });
  }

  // Anomalies & The Why (Combined for depth)
  slide = pptx.addSlide();
  slide.addText("ROOT CAUSE & ANOMALIES", { x: 0.5, y: 0.5, w: "90%", h: 0.5, fontSize: 24, color: "000B26", bold: true });
  
  slide.addText("THE WHY:", { x: 0.5, y: 1.2, w: "90%", h: 0.3, fontSize: 14, color: "2563EB", bold: true });
  slide.addText(report.theWhy, { x: 0.5, y: 1.5, w: "90%", h: 1.5, fontSize: 14, color: "333333" });

  slide.addText("DETECTED ANOMALIES:", { x: 0.5, y: 3.2, w: "90%", h: 0.3, fontSize: 14, color: "2563EB", bold: true });
  slide.addText(report.criticalAnomalies.map(a => "• " + a).join("\n"), { x: 0.5, y: 3.5, w: "90%", h: 1.5, fontSize: 12, color: "333333" });

  // Action Plan
  slide = pptx.addSlide();
  slide.addText("STRATEGIC ACTION PLAN", { x: 0.5, y: 0.5, w: "90%", h: 0.5, fontSize: 24, color: "000B26", bold: true });
  
  // Add actions as a formatted list with shapes
  report.actionPlan.forEach((action, index) => {
    const yPos = 1.5 + (index * 0.8);
    if (yPos < 5) { // Ensure it fits on slide
      slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: yPos, w: 0.4, h: 0.4, fill: { color: "2563EB" } });
      slide.addText(`${index + 1}`, { x: 0.5, y: yPos, w: 0.4, h: 0.4, color: "FFFFFF", fontSize: 14, bold: true, align: "center" });
      slide.addText(action, { x: 1.1, y: yPos, w: 8.4, h: 0.4, fontSize: 14, color: "333333" });
    }
  });

  pptx.writeFile({ fileName: `Ozone_Intelligence_Report_${Date.now()}.pptx` });
}
