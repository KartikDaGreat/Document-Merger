import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Trash2, MoveVertical } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Draggable file item component
const FileItem = ({ id, file, index, moveFile, removeFile }) => {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'FILE_ITEM',
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'FILE_ITEM',
    hover: (item, monitor) => {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      moveFile(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border ${
        isDragging ? 'opacity-50 border-blue-500' : 'border-gray-200'
      } transition-all duration-200 hover:shadow-md`}
    >
      <div className="flex items-center flex-1">
        <div className="flex items-center justify-center w-10 h-10">
          <MoveVertical className="text-gray-400 cursor-move" />
        </div>
        <div className="flex items-center ml-3">
          <div className="w-10 h-10 flex items-center justify-center rounded bg-blue-500 text-white">
            <FileText size={20} />
          </div>
          <span className="ml-3 font-medium truncate max-w-md">{file.name}</span>
          <span className="ml-2 text-sm text-gray-500">
            ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </span>
        </div>
      </div>
      <button
        onClick={() => removeFile(id)}
        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
};

const DocumentMerger = () => {
  const [files, setFiles] = useState([]);
  const [mergedPdf, setMergedPdf] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const newFiles = Array.from(event.target.files);
    addFiles(newFiles);
  };

  const addFiles = (newFiles) => {
    setFiles(prevFiles => [
      ...prevFiles,
      ...newFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
      }))
    ]);
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
    addFiles(droppedFiles);
  }, []);

  const moveFile = useCallback((dragIndex, hoverIndex) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      const draggedFile = newFiles[dragIndex];
      newFiles.splice(dragIndex, 1);
      newFiles.splice(hoverIndex, 0, draggedFile);
      return newFiles;
    });
  }, []);

  const removeFile = (id) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== id));
  };

  const mergePdfs = async () => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      files.forEach((fileObj, index) => {
        formData.append('files', fileObj.file);
      });

      // Replace with your actual API endpoint
      const response = await fetch('/api/merge-pdfs', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to merge PDFs');

      const blob = await response.blob();
      setMergedPdf(blob);

      // Generate preview if possible
      const pdfUrl = URL.createObjectURL(blob);
      // You could embed a PDF viewer here if needed
      console.log('Preview URL:', pdfUrl);
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert('Failed to merge PDFs. Please try again.');
    } finally {
      setIsProcessing(false);
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
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Document Merger</h1>
        
        {/* Drop Zone */}
        <div 
          className={`border-2 border-dashed rounded-lg p-8 mb-6 transition-all duration-200 ${
            isDraggingOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center">
            <Upload 
              className={`w-16 h-16 mb-4 transition-colors duration-200 ${
                isDraggingOver ? 'text-blue-500' : 'text-gray-400'
              }`}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
              accept=".pdf,.docx,.pptx"
            />
            <p className="text-lg mb-2 font-medium">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF, DOCX, and PPTX files
            </p>
          </div>
        </div>

        {/* File List */}
        <div className="space-y-3 mb-6">
          {files.map((fileObj, index) => (
            <FileItem
              key={fileObj.id}
              id={fileObj.id}
              file={fileObj.file}
              index={index}
              moveFile={moveFile}
              removeFile={removeFile}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={mergePdfs}
            disabled={files.length < 2 || isProcessing}
            className={`px-6 py-3 rounded-lg text-white transition-colors ${
              isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Merge Documents'}
          </button>
          
          {mergedPdf && (
            <button
              onClick={downloadMergedPdf}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Download Merged File
            </button>
          )}
        </div>

        {/* PDF Preview (if implemented) */}
        {mergedPdf && (
          <div className="mt-6 border rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4">Preview</h2>
            <div className="aspect-[8.5/11] bg-gray-100 rounded-lg">
              {/* Add your PDF preview component here */}
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default DocumentMerger;