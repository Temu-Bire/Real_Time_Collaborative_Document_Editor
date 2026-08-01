import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getDocumentById,
  updateDocument,
} from "../../services/documentService";

const DocumentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");


  // Load document
  useEffect(() => {

    const fetchDocument = async () => {
      try {
        const document = await getDocumentById(id);

        setTitle(document.title);
        setContent(document.content);

      } catch (error) {
        console.error(error);

      } finally {
        setLoading(false);
      }
    };


    fetchDocument();

  }, [id]);



  // Save function
  const saveDocument = async () => {

    try {

      setSaving(true);
      setSaveStatus("Saving...");


      await updateDocument(id, {
        title,
        content,
      });


      setSaveStatus("Saved ✓");


    } catch (error) {

      console.error(error);
      setSaveStatus("Failed to save");


    } finally {

      setSaving(false);

    }

  };



  // Auto save after user stops typing for 2 seconds
  useEffect(() => {

    if (loading) return;


    const timer = setTimeout(() => {

      saveDocument();

    }, 2000);


    return () => clearTimeout(timer);


  }, [title, content]);



  if (loading) {
    return (
      <h2 className="text-center mt-10">
        Loading...
      </h2>
    );
  }



  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <div className="max-w-4xl mx-auto">


        <div className="flex justify-between items-center mb-6">


          <button
            onClick={() => navigate("/dashboard")}
            className="text-indigo-600"
          >
            ← Dashboard
          </button>


          <p className="text-gray-500">
            {saveStatus}
          </p>


        </div>



        <div className="space-y-8">

  <div className="
    bg-white
    w-[800px]
    min-h-[1100px]
    mx-auto
    shadow-lg
    p-12
  ">

    <input
      type="text"
      value={title}
      onChange={(e)=>setTitle(e.target.value)}
      className="
        w-full
        text-3xl
        font-bold
        mb-8
        outline-none
      "
    />


    <textarea
      value={content}
      onChange={(e)=>setContent(e.target.value)}
      placeholder="Start writing..."
      className="
        w-full
        min-h-[900px]
        outline-none
        resize-none
        text-lg
        leading-8
      "
    />

  </div>


  <div
    className="
      bg-white
      w-[800px]
      min-h-[1100px]
      mx-auto
      shadow-lg
      p-12
    "
  >

  </div>


</div>
      </div>

    </div>
  );
};


export default DocumentEditor;