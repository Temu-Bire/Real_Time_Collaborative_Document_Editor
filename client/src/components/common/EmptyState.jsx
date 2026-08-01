import { FileText } from "lucide-react";

const EmptyState = ({ onCreate }) => {
  return (
    <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-gray-300 rounded-xl">
      <FileText size={60} className="text-gray-400" />

      <h2 className="mt-4 text-xl font-semibold">
        No Documents Yet
      </h2>

      <p className="text-gray-500 mt-2">
        Create your first document.
      </p>

      <button
        onClick={onCreate}
        className="mt-6 bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700"
      >
        + New Document
      </button>
    </div>
  );
};

export default EmptyState;