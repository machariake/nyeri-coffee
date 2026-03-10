import React from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Download } from 'lucide-react';
import { useQuery } from 'react-query';
import axios from 'axios';

const Certificates = () => {
  const { t } = useTranslation();

  const { data: certificates, isLoading } = useQuery('certificates', async () => {
    const response = await axios.get('/certificates/my-certificates');
    return response.data.data.certificates;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        {t('certificates.title')}
      </h1>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-green-600 
                          border-t-transparent rounded-full mx-auto" />
        </div>
      ) : certificates?.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {t('certificates.noCertificates')}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {t('certificates.certificatesAppear')}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certificates?.map((cert) => (
            <div
              key={cert.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm
                        border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 
                                  rounded-xl flex items-center justify-center">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      {cert.nursery_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {cert.certificate_number}
                    </p>
                  </div>
                </div>
                <button
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                           text-gray-500 hover:text-green-600 transition-colors"
                  title={t('certificates.download')}
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700
                            grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('certificates.issueDate')}
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {new Date(cert.issue_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('certificates.expiryDate')}
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {new Date(cert.expiry_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Certificates;
