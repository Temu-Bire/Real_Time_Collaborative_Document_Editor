/**
 * Single A4 page shell. Additional pages can be rendered by mapping
 * multiple DocumentPage instances inside DocumentPages.
 */
const DocumentPage = ({ pageNumber = 1, children }) => (
  <article className="document-page" data-page={pageNumber}>
    <div className="document-page-body">{children}</div>
    <footer className="document-page-footer" aria-label={`Page ${pageNumber}`}>
      <span className="document-page-number">{pageNumber}</span>
    </footer>
  </article>
);

export default DocumentPage;