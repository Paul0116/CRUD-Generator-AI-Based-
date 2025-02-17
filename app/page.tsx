"use client";

import { useEffect, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CircularProgress } from "@mui/material";
import { Copy, Plus, X, ChevronDown, ChevronRight } from "lucide-react";
import "react-resizable/css/styles.css";

export default function Home() {
  const [entity, setEntity] = useState("");
  const [fields, setFields] = useState<
    { name: string; type: string; isRequired: boolean; instructions: string }[]
  >([]);
  const [language, setLanguage] = useState("java");
  const [database, setType] = useState("Mongo DB");
  const [codeSections, setCodeSections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [newField, setNewField] = useState({
    name: "",
    type: "String",
    isRequired: false,
    instructions: "",
  });
  const [isFieldsVisible, setIsFieldsVisible] = useState(true);
  const codeSectionRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);



  const [errors, setErrors] = useState<{ entity?: string; fields?: string }>(
    {}
  );

  useEffect(() => {
    if (typeof window === "undefined") return; // Ensure it's client-side

    const updateWidth = () => {
      console.log("Window width:", window.innerWidth);
      setWidth(
        window.innerWidth < 768
          ? window.innerWidth - 50
          : window.innerWidth > 768 && window.innerWidth < 1250
          ? window.innerWidth - 50
          : window.innerWidth > 1250
          ? 1530
          : 0
      );
    };

    updateWidth(); // Run once on mount

    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [codeSections[activeTab]]);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSections[activeTab] || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addField = () => {
    if (newField.name.trim() === "") {
      setErrors((prev) => ({ ...prev, fields: "Field name is required." }));
      return;
    }
    setErrors((prev) => ({ ...prev, fields: undefined }));
    setFields([...fields, newField]);
  
    setNewField({
      name: "",
      type: "String",
      isRequired: false,
      instructions: "",
    });
    setShowFieldModal(false);
  };

  const handleGenerateCode = async () => {
    if (!entity.trim() || fields.length === 0) return;

    setLoading(true);
    setCodeSections({});
    setCopied(false);
    setActiveTab("");
    
    const response = await fetch("/api/generatecrud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity, fields, database, language }),
    });

    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let accumulatedData = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      accumulatedData += decoder.decode(value, { stream: true });

      try {
        const parsed = JSON.parse(accumulatedData);
        setCodeSections(parsed);

        if (!activeTab) {
          const firstTab = Object.keys(parsed)[0];
          if (firstTab) setActiveTab(firstTab);
        }
      } catch (error) {
        console.log(
          "Partial data received, waiting for complete chunk...",
          error
        );
      }
    }

    setLoading(false);
    codeSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col p-6 w-full">
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold mb-6 text-center">
          AI CRUD Code Generator
        </h1>

        {/* Form Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="language" className="block text-sm">
              Programming Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full mt-2 p-3 bg-gray-800 border border-gray-700 rounded-md text-white"
            >
              <option value="java">Java</option>
              <option value="react js">React JS</option>
              <option value="next js">Next JS</option>
              <option value="node js">Node JS</option>
            </select>
          </div>
          <div>
            <label htmlFor="entity" className="block text-sm">
              Entity Name
            </label>
            <input
              id="entity"
              type="text"
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              className="w-full mt-2 p-3 bg-gray-800 border border-gray-700 rounded-md text-white"
              placeholder="Enter entity name"
            />
            {errors.entity && (
              <p className="text-red-500 text-sm mt-1">{errors.entity}</p>
            )}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm">
              Database
            </label>
            <select
              id="type"
              value={database}
              onChange={(e) => setType(e.target.value)}
              className="w-full mt-2 p-3 bg-gray-800 border border-gray-700 rounded-md text-white"
            >
              <option value="Mongo DB">Mongo DB</option>
              <option value="Postgre SQL">Postgre SQL</option>
            </select>
          </div>
          <div>
            <label htmlFor="fields" className="block text-sm">
              Fields
            </label>
            <button
              onClick={() => setShowFieldModal(true)}
              className="w-full mt-2 p-3 bg-blue-600 hover:bg-blue-700 rounded-md text-white flex justify-center items-center"
            >
              <Plus size={16} className="mr-2" /> Add Fields
            </button>
            {errors.fields && (
              <p className="text-red-500 text-sm mt-1">Field is required</p>
            )}
          </div>
        </div>

        {/* Field List Table */}
        {fields.length > 0 && (
          <div className="bg-gray-800 p-4 rounded-md mt-4">
            {/* Toggle Button */}
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setIsFieldsVisible(!isFieldsVisible)}
            >
              <h3 className="text-lg font-semibold">Fields</h3>
              {isFieldsVisible ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </div>

            {/* Collapsible Table */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isFieldsVisible
                  ? "max-h-[500px] opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <table className="w-full border-collapse border border-gray-700 mt-2">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="p-2 border border-gray-600">Field Name</th>
                    <th className="p-2 border border-gray-600">Type</th>
                    <th className="p-2 border border-gray-600">Is Required</th>
                    <th className="p-2 border border-gray-600">
                      Validation Instructions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={index} className="text-center">
                      <td className="p-2 border border-gray-600">
                        {field.name}
                      </td>
                      <td className="p-2 border border-gray-600">
                        {field.type}
                      </td>
                      <td className="p-2 border border-gray-600">
                        {field.isRequired ? "Yes" : "no"}
                      </td>
                      <td className="p-2 border border-gray-600">
                        {field.instructions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <button
          onClick={handleGenerateCode}
          className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate CRUD Code"}
        </button>
      </div>
      {/* Tabs for Code Sections */}

      <div className="flex w-full max-w-screen-2xl mx-auto mt-8">
        <div
          style={{ width, height: '100%' }}
          className="flex-1 p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700 relative"
        >
          {/* Tab Buttons for Navigation */}
          <div className="flex space-x-4 w-full overflow-x-auto">
            {Object.keys(codeSections).map((section) => (
              <button
                key={section}
                title={section}
                onClick={() => setActiveTab(section)}
                className={`py-2 px-4 text-left hover:bg-gray-800 transition flex justify-between items-center ${
                  activeTab === section
                    ? "bg-gray-800 border-b-4 border-blue-500"
                    : ""
                }`}
              >
                <span>{section}</span>
              </button>
            ))}
          </div>
          {loading ? (
            <div
              className="flex items-center justify-center w-full h-full"
              ref={codeSectionRef}
            >
              <CircularProgress />
              <br /> <br />
              <p className="text-blue-400">
                AI is generating your code, please wait...
              </p>
            </div>
          ) : (
            activeTab && (
              <div className="relative w-full h-full flex">
                {/* Tabbed Sidebar Navigation */}

                {/* Copy Button */}
                <button
                  onClick={handleCopy}
                  className="absolute top-4 right-4 bg-gray-700 p-2 rounded-md hover:bg-gray-600 flex items-center text-sm"
                >
                  <Copy size={16} className="mr-1" />
                  {copied ? "Copied" : "Copy"}
                </button>

                {/* Code Block */}
                <SyntaxHighlighter
                  language={language === "java" ? "java" : "javascript"}
                  style={oneDark}
                  showLineNumbers
                  className="w-full h-full margin-[0]"
                >
                  {codeSections[activeTab]}
                </SyntaxHighlighter>
              </div>
            )
          )}

          {copied && (
            <p className="text-green-400 mt-2">Code copied to clipboard!</p>
          )}
        </div>
      </div>

      {/* Modal for Adding Fields */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-gray-800 p-6 rounded-md w-96">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Add Field</h2>
              <button
                onClick={() => setShowFieldModal(false)}
                className="text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-sm">Field Name</label>
              <input
                type="text"
                value={newField.name}
                onChange={(e) => {
                  setNewField({ ...newField, name: e.target.value });
                }}
                className="w-full mt-2 p-2 bg-gray-700 rounded-md text-white"
                placeholder="Enter field name"
              />
              {errors.fields && (
                <p className="text-red-500 text-sm mt-1">{errors.fields}</p>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm">Field Type</label>
              <select
                value={newField.type}
                onChange={(e) =>
                  setNewField({ ...newField, type: e.target.value })
                }
                className="w-full mt-2 p-2 bg-gray-700 rounded-md text-white"
              >
                <option>String</option>
                <option>Integer</option>
                <option>Boolean</option>
              </select>
            </div>

            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newField.isRequired}
                  onChange={(e) =>
                    setNewField({ ...newField, isRequired: e.target.checked })
                  }
                />
                <span className="ml-2">Required</span>
              </label>
            </div>

            <div className="mt-4">
              <label className="block text-sm">Validation Instructions</label>
              <textarea
                value={newField.instructions}
                onChange={(e) =>
                  setNewField({ ...newField, instructions: e.target.value })
                }
                className="w-full mt-2 p-2 bg-gray-700 rounded-md text-white"
                placeholder="Enter validation instructions"
              />
            </div>

            <button
              onClick={addField}
              className="mt-4 w-full p-2 bg-blue-600 rounded-md"
            >
              Add Field
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
