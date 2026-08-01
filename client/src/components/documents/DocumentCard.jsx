import { Link } from "react-router-dom";
import { Trash2, FileText } from "lucide-react";

const DocumentCard = ({ document, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow p-5 border hover:shadow-lg transition">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="text-indigo-600" />
        <h2 className="text-lg font-semibold">
          {document.title}
        </h2>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Updated{" "}
        {new Date(document.updatedAt).toLocaleString()}
      </p>

      <div className="flex justify-between">
        <Link
          to={`/documents/${document._id}`}
          className="text-indigo-600 font-medium"
        >
          Open
        </Link>

        <button
          onClick={() => onDelete(document._id)}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default DocumentCard;