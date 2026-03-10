import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { useQuery } from 'react-query';
import axios from 'axios';

const Applications = () => {
  const { t } = useTranslation();

  const { data: applications, isLoading } = useQuery('applications', async () => {
    const response = await axios.get('/applications/my-applications');
    return response.data.data.applications;
  });

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      submitted: 'bg-blue-100 text-blue-700',
      under_review: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {t('applications.title')}
        </h1>
        <Link
          to="/applications/new"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white 
                     rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t('applications.newApplication')}
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-green-600 
                          border-t-transparent rounded-full mx-auto" />
        </div>
      ) : applications?.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {t('dashboard.noApplications')}
          </p>
          <Link
            to="/applications/new"
            className="text-green-600 hover:text-green-700 mt-2 inline-block"
          >
            {t('applications.newApplication')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications?.map((app) => (
            <Link
              key={app.id}
              to={`/applications/${app.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm
                        border border-gray-200 dark:border-gray-700
                        hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 
                                  rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      {app.nursery_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {app.nursery_location}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium
                                 ${getStatusColor(app.status)}`}>
                  {t(`applications.statuses.${app.status}`)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Applications;
