declare module "html2pdf.js" {
  interface Html2PdfWorker {
    set(options: Record<string, unknown>): Html2PdfWorker;
    from(element: HTMLElement | string): Html2PdfWorker;
    save(): Promise<void>;
    toPdf(): Html2PdfWorker;
    output(type: string): Promise<unknown>;
  }

  function html2pdf(): Html2PdfWorker;
  export default html2pdf;
}
