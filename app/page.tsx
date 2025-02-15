'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CircularProgress } from '@mui/material';
import { Copy, Plus, X,  ChevronDown, ChevronRight } from 'lucide-react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

export default function Home() {
  const [entity, setEntity] = useState('');
  const [fields, setFields] = useState<{ name: string; type: string }[]>([]);
  const [type, setType] = useState('Mongo DB');
  const [codeSections, setCodeSections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [newField, setNewField] = useState({ name: '', type: 'String' });
  const [isFieldsVisible, setIsFieldsVisible] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSections[activeTab] || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addField = () => {
    if (newField.name.trim() === '') return;
    setFields([...fields, newField]);
    setNewField({ name: '', type: 'String' });
    setShowFieldModal(false);
  };

  const handleGenerateCode = async () => {
    setLoading(true);
    setCodeSections({});
    setCopied(false);
  
    try {
      const response = await fetch('/api/generatecrud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, fields, type }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
  
      // ✅ Correctly set the parsed JSON as code sections
      setCodeSections(data);
  
      // ✅ Set the first tab as active
      const firstTab = Object.keys(data)[0] || '';
      setActiveTab(firstTab);
  
    } catch (error) {
      console.error('Error fetching or parsing JSON:', error);
      setCodeSections({ Error: 'Failed to fetch or parse code' });
    }
  
    setLoading(false);
  };
  

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col p-6 w-full">
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold mb-6 text-center">AI CRUD Code Generator</h1>

        {/* Form Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="entity" className="block text-sm">Entity Name</label>
            <input
              id="entity"
              type="text"
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              className="w-full mt-2 p-3 bg-gray-800 border border-gray-700 rounded-md text-white"
              placeholder="Enter entity name"
            />
          </div>
          <div>
            <label htmlFor="fields" className="block text-sm">Fields</label>
            <button
              onClick={() => setShowFieldModal(true)}
              className="w-full mt-2 p-3 bg-blue-600 hover:bg-blue-700 rounded-md text-white flex justify-center items-center"
            >
              <Plus size={16} className="mr-2" /> Add Fields
            </button>
          </div>
          <div>
            <label htmlFor="type" className="block text-sm">Database</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full mt-2 p-3 bg-gray-800 border border-gray-700 rounded-md text-white"
            >
              <option value="Mongo DB">Mongo DB</option>
              <option value="Postgre SQL">Postgre SQL</option>
            </select>
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
            {isFieldsVisible ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
      
          {/* Collapsible Table */}
          <div 
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isFieldsVisible ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <table className="w-full border-collapse border border-gray-700 mt-2">
              <thead>
                <tr className="bg-gray-700">
                  <th className="p-2 border border-gray-600">Field Name</th>
                  <th className="p-2 border border-gray-600">Type</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr key={index} className="text-center">
                    <td className="p-2 border border-gray-600">{field.name}</td>
                    <td className="p-2 border border-gray-600">{field.type}</td>
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
          {loading ? 'Generating...' : 'Generate CRUD Code'}
        </button>
      </div>
      {/* Tabs for Code Sections */}
      <div className="w-full max-w-screen-2xl mx-auto mt-8">
        <h2 className="text-xl font-semibold mb-4">Generated Code:</h2>

        {/* Tab Headers */}
        <div className="flex space-x-4 border-b border-gray-600">
          {Object.keys(codeSections).map((section) => (
            <button
              key={section}
              className={`p-2 text-white ${activeTab === section ? 'border-b-2 border-blue-500' : 'opacity-50'}`}
              onClick={() => setActiveTab(section)}
            >
              {section}
            </button>
          ))}
        </div>

        {/* Resizable Code Box */}
        <ResizableBox
          width={1564}
          height={700}
          minConstraints={[300, 200]}
          maxConstraints={[Infinity, 800]}
          resizeHandles={["s"]}
          className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 flex flex-col mt-4 relative"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <CircularProgress color="primary" />
              <p className="mt-4 text-blue-400">AI is generating your code, please wait...</p>
            </div>
          ) : (
            activeTab && (
              <div className="w-full h-full relative">
                {/* Copy Button */}
                <button
                  onClick={handleCopy}
                  className="absolute top-7 right-10 bg-gray-700 p-2 rounded-md text-white hover:bg-gray-600 flex items-center"
                >
                  <Copy size={16} className="mr-1" />
                  {copied ? "Copied" : "Copy"}
                </button>

                <SyntaxHighlighter
                  language="java"
                  style={oneDark}
                  showLineNumbers
                  className="w-full h-full"
                >
                  {codeSections[activeTab]}
                </SyntaxHighlighter>
              </div>
            )
          )}
        </ResizableBox>



        {copied && <p className="text-green-400 mt-2">Code copied to clipboard!</p>}
      </div>


      {/* Modal for Adding Fields */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-gray-800 p-6 rounded-md w-96">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Add Field</h2>
              <button onClick={() => setShowFieldModal(false)} className="text-white">
                <X size={20} />
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-sm">Field Name</label>
              <input
                type="text"
                value={newField.name}
                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                className="w-full mt-2 p-2 bg-gray-700 rounded-md text-white"
                placeholder="Enter field name"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm">Field Type</label>
              <select
                value={newField.type}
                onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                className="w-full mt-2 p-2 bg-gray-700 rounded-md text-white"
              >
                <option>String</option>
                <option>Integer</option>
                <option>Boolean</option>
              </select>
            </div>

            <button onClick={addField} className="mt-4 w-full p-2 bg-blue-600 rounded-md">
              Add Field
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
