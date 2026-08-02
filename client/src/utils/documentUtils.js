export const normalizeDocument = (doc) => {
  if (!doc) return null;
  const id = doc._id ?? doc.id;
  return { ...doc, id: String(id), _id: id };
};

export const normalizeDocuments = (docs = []) =>
  docs.map((doc) => normalizeDocument(doc));
