import React from 'react';
import { useAuthStore } from '../store/authStore';

const DebugAuth = () => {
  const { user, token, isAuthenticated, _isHydrated } = useAuthStore();
  
  return (
    <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
      <h3>Auth Debug Info</h3>
      <div><strong>Hydrated:</strong> {_isHydrated ? 'Yes ✅' : 'No ❌'}</div>
      <div><strong>Authenticated:</strong> {isAuthenticated ? 'Yes ✅' : 'No ❌'}</div>
      <div><strong>Token:</strong> {token ? token.substring(0, 20) + '...' : 'None'}</div>
      <div><strong>User:</strong> {user ? user.email : 'None'}</div>
      <div><strong>User Role:</strong> {user?.role || 'None'}</div>
      <hr />
      <div><strong>LocalStorage:</strong></div>
      <pre style={{ fontSize: '10px', maxHeight: '200px', overflow: 'auto' }}>
        {localStorage.getItem('cncms-auth')}
      </pre>
    </div>
  );
};

export default DebugAuth;
