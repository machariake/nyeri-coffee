import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  FileText,
  Award,
  Clock,
  CheckCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { useQuery } from 'react-query';
import axios from 'axios';
import Greeting from '../components/Greeting';
import AlertsBanner from '../components/AlertsBanner';
import { useAuthStore } from '../store/authStore';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery('dashboard-stats', async () => {
    const response = await axios.get('/reports/dashboard');
    return response.data.data;
  });

  // Fetch recent applications
  const { data: applications } = useQuery('recent-applications', async () => {
    const response = await axios.get('/applications/my-applications');
    return response.data.data.applications.slice(0, 5);
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

  const statCards = [
    {
      title: t('dashboard.pendingApplications'),
      value: stats?.applications?.find(a => a.status === 'submitted')?.count || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      link: '/applications',
    },
    {
      title: t('dashboard.approvedApplications'),
      value: stats?.applications?.find(a => a.status === 'approved')?.count || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      link: '/applications',
    },
    {
      title: t('dashboard.totalCertificates'),
      value: stats?.certificates?.total || 0,
      icon: Award,
      color: 'bg-blue-500',
      link: '/certificates',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <Greeting />

      {/* Alerts and Promotions Banner */}
      <AlertsBanner userRole={user?.role || 'farmer'} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/applications/new"
          className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 
                     rounded-xl shadow-sm hover:shadow-md transition-shadow
                     border border-gray-200 dark:border-gray-700"
        >
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 
                          rounded-xl flex items-center justify-center">
            <Plus className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">
              {t('dashboard.applyNow')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('applications.newApplication')}
            </p>
          </div>
        </Link>

        <Link
          to="/applications"
          className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 
                     rounded-xl shadow-sm hover:shadow-md transition-shadow
                     border border-gray-200 dark:border-gray-700"
        >
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 
                          rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">
              {t('navigation.applications')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('dashboard.viewAll')}
            </p>
          </div>
        </Link>

        <Link
          to="/certificates"
          className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 
                     rounded-xl shadow-sm hover:shadow-md transition-shadow
                     border border-gray-200 dark:border-gray-700"
        >
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 
                          rounded-xl flex items-center justify-center">
            <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">
              {t('navigation.certificates')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('dashboard.viewAll')}
            </p>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm
                       border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
                  {isLoading ? '-' : card.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-xl 
                              flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Applications */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm
                      border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700
                        flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {t('dashboard.recentApplications')}
          </h3>
          <Link
            to="/applications"
            className="text-green-600 hover:text-green-700 flex items-center gap-1
                       text-sm font-medium"
          >
            {t('dashboard.viewAll')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {applications?.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {t('dashboard.noApplications')}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {t('dashboard.startApplication')}
              </p>
            </div>
          ) : (
            applications?.map((app) => (
              <Link
                key={app.id}
                to={`/applications/${app.id}`}
                className="p-4 flex items-center justify-between hover:bg-gray-50 
                           dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 
                                  rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {app.nursery_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {app.nursery_location}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium
                                 ${getStatusColor(app.status)}`}>
                  {t(`applications.statuses.${app.status}`)}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
