import { useNavigate } from "react-router-dom";
import { Trash2, FileText } from "lucide-react";

const DocumentCard = ({ document, onDelete }) => {

  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/documents/${document._id}`)}
      className="
        bg-white 
        rounded-xl 
        shadow 
        p-5 
        border 
        hover:shadow-lg 
        transition
        cursor-pointer
      "
    >

      {/* Title */}
      <div className="flex items-center gap-2 mb-4">

        <FileText className="text-indigo-600" />

        <h2 className="text-lg font-semibold truncate">
          {document.title}
        </h2>

      </div>


      {/* Content Preview */}
      <p className="
        text-sm 
        text-gray-600 
        mb-5
        h-50
        overflow-hidden
      ">
        {document.content
          ? document.content.slice(0, 500)
          : "No content yet..."}
      </p>


      {/* Footer */}
      <div className="flex justify-between items-center">

        <p className="text-xs text-gray-400">
          Updated{" "}
          {new Date(document.updatedAt).toLocaleString()}
        </p>


        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(document._id);
          }}
          className="
            text-red-500 
            hover:text-red-700
          "
        >
          <Trash2 size={18} />
        </button>


      </div>


    </div>
  );
};

export default DocumentCard;