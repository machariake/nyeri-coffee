import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, FileText, CheckCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const NewApplication = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nurseryName: '',
    nurseryLocation: '',
    nurserySize: '',
    coffeeVarieties: '',
    expectedSeedlings: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleFileSelect = async (e, documentType) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name}: ${t('documents.maxSize')}`);
        return false;
      }
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: ${t('documents.supportedFormats')}`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Upload each file
    for (const file of validFiles) {
      const uploadId = Date.now() + Math.random();
      setUploadingFiles(prev => [...prev, { id: uploadId, name: file.name }]);

      try {
        const uploadFormData = new FormData();
        uploadFormData.append('document', file);
        uploadFormData.append('documentType', documentType);

        // First create application if not exists, then upload documents
        // For now, we'll store files temporarily
        const reader = new FileReader();
        reader.onload = (event) => {
          setUploadedFiles(prev => [...prev, {
            id: uploadId,
            name: file.name,
            type: documentType,
            file: file,
            data: event.target.result,
          }]);
        };
        reader.readAsDataURL(file);

        toast.success(`${file.name} ${t('applicationForm.uploaded')}`);
      } catch (error) {
        toast.error(`${file.name}: Upload failed`);
      } finally {
        setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));
      }
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      toast.error('You must accept the Terms and Conditions to continue');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Step 1: Create the application
      const applicationResponse = await axios.post('/applications', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!applicationResponse.data.success) {
        throw new Error(applicationResponse.data.message);
      }

      const applicationId = applicationResponse.data.data.applicationId;

      // Step 2: Upload documents if any
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const uploadFormData = new FormData();
          uploadFormData.append('document', file.file);
          uploadFormData.append('documentType', file.type);

          await axios.post(`/documents/${applicationId}/upload`, uploadFormData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          });
        }
      }

      // Step 3: Submit the application (change status from draft to submitted)
      const submitResponse = await axios.post(
        `/applications/${applicationId}/submit`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!submitResponse.data.success) {
        throw new Error(submitResponse.data.message);
      }

      toast.success(t('applications.submitSuccess'));
      navigate('/applications');
    } catch (error) {
      console.error('Application error:', error);
      toast.error(error.response?.data?.message || 'Failed to create application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFileUpload = (documentType, label, isRequired = false) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {isRequired && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="file"
          id={`file-${documentType}`}
          onChange={(e) => handleFileSelect(e, documentType)}
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          multiple
        />
        <label
          htmlFor={`file-${documentType}`}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed
                     border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer
                     hover:border-green-500 dark:hover:border-green-400 transition-colors
                     bg-gray-50 dark:bg-gray-700/50"
        >
          <Upload className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('applicationForm.dragDrop')}
          </span>
        </label>
      </div>
      {uploadingFiles.some(f => f.name.includes(documentType)) && (
        <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
          <span className="animate-spin">⏳</span> {t('applicationForm.uploading')}
        </p>
      )}
    </div>
  );

  const renderUploadedFiles = () => {
    if (uploadedFiles.length === 0) return null;

    return (
      <div className="space-y-2 mt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('applicationForm.uploaded')} ({uploadedFiles.length})
        </h4>
        <div className="space-y-2">
          {uploadedFiles.map(file => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50
                         rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t(`applicationForm.documentTypes.${file.type}`) || file.type}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {t('applications.newApplication')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nursery Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm
                        border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 text-sm font-bold">1</span>
            {t('applicationForm.nurseryInfo')}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700
                               dark:text-gray-300 mb-1">
                {t('applicationForm.nurseryName')} *
              </label>
              <input
                type="text"
                required
                value={formData.nurseryName}
                onChange={(e) => setFormData({ ...formData, nurseryName: e.target.value })}
                className="input"
                placeholder={t('applicationForm.nurseryNamePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700
                               dark:text-gray-300 mb-1">
                {t('applicationForm.nurseryLocation')} *
              </label>
              <input
                type="text"
                required
                value={formData.nurseryLocation}
                onChange={(e) => setFormData({ ...formData, nurseryLocation: e.target.value })}
                className="input"
                placeholder={t('applicationForm.nurseryLocationPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700
                               dark:text-gray-300 mb-1">
                {t('applicationForm.nurserySize')}
              </label>
              <input
                type="text"
                value={formData.nurserySize}
                onChange={(e) => setFormData({ ...formData, nurserySize: e.target.value })}
                className="input"
                placeholder={t('applicationForm.nurserySizePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700
                               dark:text-gray-300 mb-1">
                {t('applicationForm.coffeeVarieties')}
              </label>
              <input
                type="text"
                value={formData.coffeeVarieties}
                onChange={(e) => setFormData({ ...formData, coffeeVarieties: e.target.value })}
                className="input"
                placeholder={t('applicationForm.coffeeVarietiesPlaceholder')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700
                               dark:text-gray-300 mb-1">
                {t('applicationForm.expectedSeedlings')}
              </label>
              <input
                type="number"
                value={formData.expectedSeedlings}
                onChange={(e) => setFormData({ ...formData, expectedSeedlings: e.target.value })}
                className="input"
                placeholder={t('applicationForm.expectedSeedlingsPlaceholder')}
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Required Documents */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm
                        border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 text-sm font-bold">2</span>
            {t('applicationForm.requiredDocs')}
          </h2>

          <div className="space-y-4">
            {renderFileUpload('landRegistration', t('applicationForm.documentTypes.landRegistration'), true)}
            {renderFileUpload('idDocument', t('applicationForm.documentTypes.idDocument'), true)}
          </div>

          {renderUploadedFiles()}
        </div>

        {/* Optional Documents */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm
                        border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">3</span>
            {t('applicationForm.optionalDocs')}
          </h2>

          <div className="space-y-4">
            {renderFileUpload('leaseAgreement', t('applicationForm.documentTypes.leaseAgreement'))}
            {renderFileUpload('businessRegistration', t('applicationForm.documentTypes.businessRegistration'))}
            {renderFileUpload('other', t('applicationForm.documentTypes.other'))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800
                        rounded-xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">{t('applicationForm.requiredDocs')}</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>{t('applicationForm.documentTypes.landRegistration')}</li>
                <li>{t('applicationForm.documentTypes.idDocument')}</li>
              </ul>
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                {t('applicationForm.maxFileSize')} • {t('applicationForm.supportedFormats')}
              </p>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm
                        border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 text-sm font-bold">4</span>
            Terms and Conditions
          </h2>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300">
              I have read and accept the{' '}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-green-600 hover:text-green-700 underline"
              >
                Terms and Conditions
              </button>{' '}
              and confirm that all information provided is accurate and truthful.
            </label>
          </div>
        </div>

        {/* Terms Modal */}
        {showTerms && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    Terms and Conditions
                  </h2>
                  <button
                    onClick={() => setShowTerms(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm">
                  <h3 className="font-semibold text-gray-800 dark:text-white">1. Eligibility</h3>
                  <p>This service is available to registered coffee nursery operators in Nyeri County. You must be at least 18 years old and have legal rights to operate the nursery.</p>
                  
                  <h3 className="font-semibold text-gray-800 dark:text-white mt-4">2. Information Accuracy</h3>
                  <p>You are responsible for providing accurate and complete information. False information may result in application rejection or certificate revocation.</p>
                  
                  <h3 className="font-semibold text-gray-800 dark:text-white mt-4">3. Document Requirements</h3>
                  <p>All uploaded documents must be valid, current, and legally binding. You must have the right to share these documents.</p>
                  
                  <h3 className="font-semibold text-gray-800 dark:text-white mt-4">4. Application Process</h3>
                  <p>Applications are reviewed by agricultural officers. Processing time is typically 7-14 business days. You will be notified of any updates via email and SMS.</p>
                  
                  <h3 className="font-semibold text-gray-800 dark:text-white mt-4">5. Certificate Validity</h3>
                  <p>Certificates are valid for 12 months from the date of issue. Renewal applications must be submitted before expiry.</p>
                  
                  <h3 className="font-semibold text-gray-800 dark:text-white mt-4">6. Privacy</h3>
                  <p>Your personal information is protected under the Data Protection Act and will only be used for official purposes.</p>
                  
                  <h3 className="font-semibold text-gray-800 dark:text-white mt-4">7. Contact</h3>
                  <p>For questions or support, contact us at support@cncms.go.ke or call +254 700 000 000.</p>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowTerms(false)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    I Understand
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 bg-green-600 text-white font-semibold
                       rounded-xl hover:bg-green-700 disabled:opacity-50
                       transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting && <span className="animate-spin">⏳</span>}
            {isSubmitting ? t('applicationForm.uploading') : t('applications.submit')}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600
                       rounded-xl text-gray-700 dark:text-gray-300
                       hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('actions.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewApplication;
