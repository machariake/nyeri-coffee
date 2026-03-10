import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, MessageSquare, CheckCircle, XCircle, 
  Clock, FileText, MapPin, User, Phone, Mail, Calendar,
  Send, X, ChevronDown, ChevronUp, Settings, Wifi, AlertCircle, Edit2
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const AdminApplications = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [wards, setWards] = useState([]);

  useEffect(() => {
    loadApplications();
    loadWards();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [searchTerm, statusFilter, wardFilter, applications]);

  const loadApplications = async () => {
    try {
      const response = await axios.get('/applications', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { page: 1, limit: 100 } // Get all applications
      });
      
      console.log('Applications response:', response.data); // Debug log
      
      if (response.data.success) {
        const apps = response.data.data.applications;
        console.log('Loaded applications:', apps.length); // Debug log
        setApplications(apps);
      } else {
        toast.error('Failed to load applications: ' + response.data.message);
      }
    } catch (error) {
      console.error('Load applications error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to load applications. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWards = async () => {
    try {
      const response = await axios.get('/users/metadata/wards', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.data.success) {
        setWards(response.data.data.wards);
      }
    } catch (error) {
      console.error('Failed to load wards');
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app =>
        app.nursery_name?.toLowerCase().includes(term) ||
        app.applicant_name?.toLowerCase().includes(term) ||
        app.app_id?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (wardFilter !== 'all') {
      filtered = filtered.filter(app => app.ward === wardFilter);
    }

    setFilteredApps(filtered);
  };

  const handleReview = async (appId, action, comments = '') => {
    try {
      const response = await axios.post(
        `/applications/${appId}/review`,
        { action, comments },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success(`Application ${action}d successfully`);
        loadApplications();
        setSelectedApp(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to review application');
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      // Send notification to the applicant
      const response = await axios.post(
        '/notifications',
        {
          userId: selectedApp.user_id,
          title: 'Message from Administrator',
          message: messageText,
          type: 'system'
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Message sent successfully');
        setShowMessageModal(false);
        setMessageText('');
        setSelectedApp(null);
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.draft;
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: <FileText className="w-4 h-4" />,
      submitted: <Clock className="w-4 h-4" />,
      under_review: <Search className="w-4 h-4" />,
      approved: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />,
      expired: <Clock className="w-4 h-4" />
    };
    return icons[status] || icons.draft;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Application Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and review all farmer applications
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/admin/contacts"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg
                       hover:bg-green-700 transition-colors"
          >
            <Edit2 className="w-4 h-4" /> Edit Contacts
          </a>
          <a
            href="/admin/settings"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg
                       hover:bg-purple-700 transition-colors"
          >
            <Settings className="w-4 h-4" /> Support Settings
          </a>
          <a
            href="/admin/debug"
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg
                       hover:bg-gray-700 transition-colors"
          >
            <Wifi className="w-4 h-4" /> Check Connection
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, nursery, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600
                           rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600
                         rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600
                         rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Wards</option>
              {wards.map(ward => (
                <option key={ward} value={ward}>{ward}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {applications.length}
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl shadow-sm p-4">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">Submitted</p>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
            {applications.filter(a => a.status === 'submitted').length}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-sm p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">Under Review</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {applications.filter(a => a.status === 'under_review').length}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl shadow-sm p-4">
          <p className="text-sm text-green-600 dark:text-green-400">Approved</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {applications.filter(a => a.status === 'approved').length}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl shadow-sm p-4">
          <p className="text-sm text-red-600 dark:text-red-400">Rejected</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">
            {applications.filter(a => a.status === 'rejected').length}
          </p>
        </div>
      </div>

      {applications.length === 0 && !isLoading && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                No Applications Found
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                There are no applications in the system yet. Applications will appear here once farmers submit them.
              </p>
              <div className="mt-3 text-xs text-yellow-600 dark:text-yellow-400">
                <p className="font-semibold mt-2">Debug Info:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>User Role: {user?.role}</li>
                  <li>Token exists: {token ? 'Yes' : 'No'}</li>
                  <li>Check console (F12) for API response</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applications List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Applicant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nursery</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {app.app_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    <div>
                      <p className="font-medium">{app.applicant_name}</p>
                      <p className="text-xs text-gray-500">{app.ward}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {app.nursery_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {app.nursery_location}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                      {getStatusIcon(app.status)}
                      {t(`applications.statuses.${app.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        title="View Details"
                      >
                        View
                      </button>
                      {app.status === 'submitted' && (
                        <button
                          onClick={() => handleReview(app.id, 'approve')}
                          className="text-green-600 hover:text-green-800 dark:text-green-400"
                          title="Approve"
                        >
                          Approve
                        </button>
                      )}
                      {app.status === 'submitted' && (
                        <button
                          onClick={() => handleReview(app.id, 'reject')}
                          className="text-red-600 hover:text-red-800 dark:text-red-400"
                          title="Reject"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setShowMessageModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-800 dark:text-purple-400"
                        title="Send Message"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredApps.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No applications found</p>
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {selectedApp && !showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Application Details
                </h2>
                <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(selectedApp.status)}`}>
                    {getStatusIcon(selectedApp.status)}
                    {t(`applications.statuses.${selectedApp.status}`)}
                  </span>
                  <span className="text-sm text-gray-500">ID: {selectedApp.app_id}</span>
                </div>

                {/* Applicant Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      <User className="w-4 h-4" /> Applicant Information
                    </h3>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <p><span className="font-medium">Name:</span> {selectedApp.applicant_name}</p>
                      <p><span className="font-medium">Ward:</span> {selectedApp.ward}</p>
                      <p><span className="font-medium">Sub-County:</span> {selectedApp.sub_county}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Nursery Information
                    </h3>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <p><span className="font-medium">Name:</span> {selectedApp.nursery_name}</p>
                      <p><span className="font-medium">Location:</span> {selectedApp.nursery_location}</p>
                      {selectedApp.nursery_size && (
                        <p><span className="font-medium">Size:</span> {selectedApp.nursery_size}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="border-t dark:border-gray-700 pt-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4" /> Timeline
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <p>Created: {new Date(selectedApp.created_at).toLocaleString()}</p>
                    {selectedApp.submitted_at && (
                      <p>Submitted: {new Date(selectedApp.submitted_at).toLocaleString()}</p>
                    )}
                    {selectedApp.reviewed_at && (
                      <p>Reviewed: {new Date(selectedApp.reviewed_at).toLocaleString()}</p>
                    )}
                  </div>
                </div>

                {/* Officer Comments */}
                {selectedApp.officer_comments && (
                  <div className="border-t dark:border-gray-700 pt-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Officer Comments</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{selectedApp.officer_comments}</p>
                  </div>
                )}

                {/* Actions */}
                {selectedApp.status === 'submitted' && (
                  <div className="border-t dark:border-gray-700 pt-4 flex gap-3">
                    <button
                      onClick={() => handleReview(selectedApp.id, 'approve')}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve Application
                    </button>
                    <button
                      onClick={() => handleReview(selectedApp.id, 'reject')}
                      className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject Application
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Send Message
                </h2>
                <button onClick={() => setShowMessageModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">To:</p>
                <p className="font-medium text-gray-800 dark:text-white">{selectedApp.applicant_name}</p>
                <p className="text-sm text-gray-500">Application: {selectedApp.app_id}</p>
              </div>

              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message here..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={sendMessage}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700
                             flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Send Message
                </button>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApplications;
