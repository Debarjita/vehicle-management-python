import React, { useState, useEffect, useRef } from 'react';

const RealTimeVehicleLogs = () => {
  const [logs, setLogs] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setConnectionStatus('No authentication token');
      return;
    }

    const wsUrl = `ws://localhost:8000/ws/vehicle-logs/?token=${token}`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus('Connected');
      setIsConnected(true);
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'initial_data':
          setLogs(data.logs);
          break;
        case 'vehicle_log_message':
          if (data.message_type === 'new_log') {
            setLogs(prevLogs => [data.log, ...prevLogs.slice(0, 19)]); // Keep last 20
            
            // Show notification for new log
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Vehicle Log Update', {
                body: `${data.log.vehicle_plate} - ${data.log.action}`,
                icon: '/favicon.ico'
              });
            }
          }
          break;
        case 'pong':
          console.log('WebSocket ping response received');
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      setConnectionStatus('Disconnected');
      setIsConnected(false);
      
      // Attempt to reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('Connection Error');
      setIsConnected(false);
    };
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  };

  const getActionIcon = (action) => {
    return action === 'ENTRY' ? '🟢' : '🔴';
  };

  const getActionColor = (action) => {
    return action === 'ENTRY' ? '#28a745' : '#dc3545';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const logTime = new Date(timestamp);
    const diffMs = now - logTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Real-Time Vehicle Logs</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: isConnected ? '#28a745' : '#dc3545'
            }}></div>
            <span style={{ color: isConnected ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
              {connectionStatus}
            </span>
          </div>
          <button
            onClick={requestNotificationPermission}
            style={{
              padding: '6px 12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            Enable Notifications
          </button>
        </div>
      </div>

      {!isConnected && (
        <div style={{
          padding: 15,
          backgroundColor: '#fff3cd',
          color: '#856404',
          borderRadius: 4,
          marginBottom: 20,
          border: '1px solid #ffeaa7'
        }}>
          ⚠️ WebSocket connection lost. Attempting to reconnect...
        </div>
      )}

      <div style={{ 
        maxHeight: 600, 
        overflowY: 'auto', 
        border: '1px solid #ddd', 
        borderRadius: 8,
        backgroundColor: '#f8f9fa'
      }}>
        {logs.length === 0 ? (
          <div style={{ 
            padding: 40, 
            textAlign: 'center', 
            color: '#666' 
          }}>
            <h4>No vehicle logs yet</h4>
            <p>Vehicle entry/exit logs will appear here in real-time</p>
          </div>
        ) : (
          logs.map((log, index) => (
            <div 
              key={log.id}
              style={{
                padding: 15,
                borderBottom: index < logs.length - 1 ? '1px solid #dee2e6' : 'none',
                backgroundColor: index === 0 ? '#e8f5e8' : '#fff',
                transition: 'background-color 0.3s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={{ fontSize: 24 }}>
                  {getActionIcon(log.action)}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                    {log.vehicle_plate} - 
                    <span style={{ 
                      color: getActionColor(log.action),
                      marginLeft: 8,
                      fontWeight: 'bold'
                    }}>
                      {log.action}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: '#666' }}>
                    {log.vehicle_make_model && (
                      <span>{log.vehicle_make_model} • </span>
                    )}
                    By: {log.created_by}
                    {log.organization && (
                      <span> • Org: {log.organization}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {getTimeAgo(log.timestamp)}
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>
                  {formatTimestamp(log.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ 
        marginTop: 15, 
        padding: 10, 
        backgroundColor: '#e3f2fd', 
        borderRadius: 4,
        fontSize: 12,
        color: '#1565c0'
      }}>
        <strong>Legend:</strong> 
        <span style={{ marginLeft: 10 }}>🟢 Vehicle Entry</span>
        <span style={{ marginLeft: 15 }}>🔴 Vehicle Exit</span>
        <span style={{ marginLeft: 15 }}>• Updates automatically</span>
        <span style={{ marginLeft: 15 }}>• Last 20 logs shown</span>
      </div>
    </div>
  );
};

export default RealTimeVehicleLogs;