export const getPageNumbers = (currentPage, totalPages, delta = 1) => {
  if (totalPages <= 1) return [1];

  const range = [];
  const rangeWithDots = [];
  let previous;

  for (let i = 1; i <= totalPages; i += 1) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      range.push(i);
    }
  }

  for (const page of range) {
    if (previous) {
      if (page - previous === 2) {
        rangeWithDots.push(previous + 1);
      } else if (page - previous !== 1) {
        rangeWithDots.push("ellipsis");
      }
    }
    rangeWithDots.push(page);
    previous = page;
  }

  return rangeWithDots;
};
