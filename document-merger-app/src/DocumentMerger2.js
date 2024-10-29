import React, { useState, useRef, useCallback } from 'react';
import { Upload } from 'lucide-react';

const DocumentMerger = () => {
  const [files, setFiles] = useState([]);
  const [mergedPdf, setMergedPdf] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const newFiles = Array.from(event.target.files);
    setFiles(prevFiles => [...prevFiles, ...newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type: file.type
    }))]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prevFiles => [...prevFiles, ...droppedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type: file.type
    }))]);
  }, []);

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDragOver2 = (e, index) => {
    e.preventDefault();
    if (draggedItem === null) return;
    
    if (draggedItem !== index) {
      const newFiles = [...files];
      const draggedFile = newFiles[draggedItem];
      newFiles.splice(draggedItem, 1);
      newFiles.splice(index, 0, draggedFile);
      setFiles(newFiles);
      setDraggedItem(index);
    }
  };

  const removeFile = (id) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== id));
  };

  const mergePdfs = async () => {
    try {
      // Here you would integrate with your Python backend
      // For now, we'll create a mock API call
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('files', file.file);
      });

      // Mock API call - replace with your actual backend endpoint
      console.log('Files to be merged:', files.map(f => f.file.name));
      
      // Simulate successful merge
      const dummyMergedPdf = new Blob(['Merged PDF content'], { type: 'application/pdf' });
      setMergedPdf(dummyMergedPdf);
    } catch (error) {
      console.error('Error merging files:', error);
    }
  };

  const downloadMergedPdf = () => {
    if (!mergedPdf) return;
    
    const url = URL.createObjectURL(mergedPdf);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'merged_document.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Document Merger</h1>
      
      {/* Drop Zone */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 mb-6 transition-colors ${
          isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center">
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
            accept=".pdf,.docx,.pptx"
          />
          <p className="text-lg mb-2">Drop files here or click to upload</p>
          <p className="text-sm text-gray-500">Supports PDF, DOCX, and PPTX</p>
        </div>
      </div>

      {/* File List */}
      <div className="space-y-3 mb-6">
        {files.map((file, index) => (
          <div
            key={file.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver2(e, index)}
            className={`flex items-center justify-between p-4 bg-white rounded-lg shadow border ${
              draggedItem === index ? 'border-blue-500 opacity-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center rounded bg-blue-500 text-white">
                {file.type.includes('pdf') ? 'PDF' : 
                 file.type.includes('docx') ? 'DOC' : 'PPT'}
              </div>
              <span className="ml-3 font-medium">{file.file.name}</span>
            </div>
            <button
              onClick={() => removeFile(file.id)}
              className="text-red-500 hover:text-red-700 p-2"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={mergePdfs}
          disabled={files.length < 2}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Merge Documents
        </button>
        
        {mergedPdf && (
          <button
            onClick={downloadMergedPdf}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Download Merged File
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentMerger;