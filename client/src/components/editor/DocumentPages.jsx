import DocumentPage from "./DocumentPage";

/**
 * Container for one or more A4 pages.
 * Currently renders a single page; extend by mapping content slices
 * to additional DocumentPage instances when multi-page support is added.
 */
const DocumentPages = ({ pageCount = 1, children }) => (
  <div className="document-pages">
    <DocumentPage pageNumber={1}>{children}</DocumentPage>

    {/* Future multi-page support:
        {Array.from({ length: pageCount - 1 }, (_, index) => (
          <DocumentPage key={index + 2} pageNumber={index + 2}>
            {pageContents[index + 1]}
          </DocumentPage>
        ))}
    */}
  </div>
);

export default DocumentPages;