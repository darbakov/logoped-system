"use client";

export async function downloadPdfFromHtml(url: string, filename: string) {
  const html2pdf = (await import("html2pdf.js")).default;

  const res = await fetch(url);
  const htmlText = await res.text();

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "0";
  iframe.style.top = "0";
  iframe.style.width = "800px";
  iframe.style.height = "600px";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.zIndex = "-1";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error("Failed to access iframe document");
  }

  iframeDoc.open();
  iframeDoc.write(htmlText);
  iframeDoc.close();

  await new Promise((r) => setTimeout(r, 100));

  const printBtns = iframeDoc.querySelectorAll(".print-btn");
  printBtns.forEach((btn) => btn.remove());

  const content = iframeDoc.body;

  try {
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      })
      .from(content)
      .save();
  } finally {
    document.body.removeChild(iframe);
  }
}
