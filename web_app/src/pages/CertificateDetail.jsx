import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

const CertificateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
          {t('certificates.title')} #{id}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm
                      border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-500 dark:text-gray-400">
          Certificate details will be displayed here.
        </p>
      </div>
    </div>
  );
};

export default CertificateDetail;
