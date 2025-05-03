
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, File, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ExcelUploaderProps {
  onUploadSuccess: (data: any[]) => void;
}

const ExcelUploader = ({ onUploadSuccess }: ExcelUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'initial' | 'uploading' | 'success' | 'error'>('initial');
  const [progress, setProgress] = useState(0);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Check if file is Excel (.xls or .xlsx)
    const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload an Excel file (.xls or .xlsx)');
      return;
    }
    
    setFile(file);
    toast.success(`File "${file.name}" ready to upload`);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }
    
    setUploadStatus('uploading');
    
    // Simulate file upload with progress
    let progressValue = 0;
    const interval = setInterval(() => {
      progressValue += 5;
      setProgress(progressValue);
      
      if (progressValue >= 100) {
        clearInterval(interval);
        // Simulate processing delay
        setTimeout(() => {
          setUploadStatus('success');
          
          // Mock data that would come from backend processing the Excel
          const mockData = [
            { id: 100, product: 'Laptop', quantity: 5, warehouse: 'Central Warehouse' },
            { id: 101, product: 'Monitor', quantity: 10, warehouse: 'West Depot' },
            { id: 102, product: 'Keyboard', quantity: 20, warehouse: 'North Storage' }
          ];
          
          onUploadSuccess(mockData);
          toast.success('Excel data processed successfully!');
        }, 500);
      }
    }, 100);
  };

  const resetUpload = () => {
    setFile(null);
    setUploadStatus('initial');
    setProgress(0);
  };

  return (
    <Card>
      <CardContent className="p-6">
        {uploadStatus === 'initial' && (
          <>
            <div 
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center",
                isDragging ? "border-warehouse-500 bg-warehouse-50" : "border-gray-300",
                "transition-all duration-200"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-10 w-10 mx-auto mb-4 text-gray-500" />
              <h3 className="text-lg font-medium mb-2">Upload Excel File</h3>
              <p className="text-sm text-gray-500 mb-4">
                Drag and drop your Excel file here, or click to browse
              </p>
              <div className="flex justify-center">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xls,.xlsx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button type="button" variant="outline">
                    Browse Files
                  </Button>
                </label>
              </div>
            </div>
            
            {file && (
              <div className="mt-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <File className="h-6 w-6 mr-2 text-gray-500" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleUpload}
                    className="bg-warehouse-600 hover:bg-warehouse-700"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        
        {uploadStatus === 'uploading' && (
          <div className="text-center space-y-4">
            <h3 className="text-lg font-medium">Uploading...</h3>
            <Progress value={progress} className="w-full h-2" />
            <p className="text-sm text-gray-500">{progress}% Complete</p>
          </div>
        )}
        
        {uploadStatus === 'success' && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium">Upload Complete!</h3>
            <p className="text-sm text-gray-500">Your file has been processed successfully.</p>
            <Button onClick={resetUpload} variant="outline">
              Upload Another File
            </Button>
          </div>
        )}
        
        {uploadStatus === 'error' && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium">Upload Failed</h3>
            <p className="text-sm text-gray-500">There was an error processing your file.</p>
            <Button onClick={resetUpload} variant="outline">
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExcelUploader;
