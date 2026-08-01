import { useState } from "react";
import { useDocuments } from "../../context/DocumentContext";

const CreateDocumentModal = ({ isOpen, onClose }) => {
  const { createDocument } = useDocuments();

  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) return;

    try {
      setLoading(true);

      await createDocument({
        title,
        content: "",
      });

      setTitle("");
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to create document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">

        <h2 className="text-2xl font-bold mb-6">
          Create Document
        </h2>

        <form onSubmit={handleSubmit}>

          <div className="mb-5">
            <label className="block mb-2 font-medium">
              Title
            </label>

            <input
              type="text"
              placeholder="Enter document title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateDocumentModal;