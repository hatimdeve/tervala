import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

type FileDropzoneProps = {
  onFileAccepted: (file: File) => void;
};

export default function FileDropzone({ onFileAccepted }: FileDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileAccepted(acceptedFiles[0]);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-gray-600 p-12 text-center rounded-xl bg-zinc-800/50 text-white cursor-pointer transition-all hover:bg-zinc-700/50 hover:border-gray-500"
    >
      <input {...getInputProps()} />
      <div className="space-y-4">
        {isDragActive ? (
          <p className="text-xl text-blue-400">Drop your file here...</p>
        ) : (
          <>
            <p className="text-xl text-zinc-300">Drag and drop a file or click to browse</p>
            <p className="text-sm text-zinc-500">Supported formats: CSV, XLSX</p>
          </>
        )}
      </div>
    </div>
  );
}