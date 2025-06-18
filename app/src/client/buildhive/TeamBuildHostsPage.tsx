import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useAction } from 'wasp/client/operations';
import getTeamBuildHosts from 'wasp/queries/getTeamBuildHosts';
import registerBuildHost from 'wasp/actions/registerBuildHost';
import updateBuildHostStatus from 'wasp/actions/updateBuildHostStatus';
import { Link } from 'wasp/client/router';

const TeamBuildHostsPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [newHostname, setNewHostname] = useState('');

  const { data: hosts, isLoading: isLoadingHosts, error: hostsError } = useQuery(getTeamBuildHosts, { teamId });
  const registerHost = useAction(registerBuildHost);
  const updateStatus = useAction(updateBuildHostStatus);

  const handleRegisterHost = async () => {
    if (!newHostname.trim() || !teamId) return;
    try {
      await registerHost({ hostname: newHostname, teamId });
      setNewHostname(''); // Clear input
      // The query will refetch automatically after action completes
    } catch (err: any) {
      alert('Error registering host: ' + (err.message || 'Unknown error'));
    }
  };

  const handleUpdateStatus = async (hostId: string, currentStatus: string) => {
    // Simple toggle for MVP: idle -> busy -> offline -> idle
    let nextStatus = 'idle';
    if (currentStatus === 'idle') nextStatus = 'busy';
    else if (currentStatus === 'busy') nextStatus = 'offline';
    // else if (currentStatus === 'offline') nextStatus = 'idle'; // already covered

    try {
      await updateStatus({ hostId, status: nextStatus });
    } catch (err: any) {
      alert('Error updating host status: ' + (err.message || 'Unknown error'));
    }
  };

  // TODO: Fetch team name for display
  const teamName = `Team (ID: ${teamId})`; // Placeholder

  return (
    <div className="p-4">
      <Link to="/buildhive" className="text-blue-500 hover:underline mb-4 block">&larr; Back to BuildHive Landing</Link>
      <h1 className="text-2xl font-bold mb-4">Build Hosts for {teamName}</h1>

      <div className="mb-6 p-4 border rounded shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Register New Host</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter hostname"
            value={newHostname}
            onChange={(e) => setNewHostname(e.target.value)}
            className="border p-2 rounded-md flex-grow"
          />
          <button
            onClick={handleRegisterHost}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md"
          >
            Register Host
          </button>
        </div>
      </div>

      {isLoadingHosts && <p>Loading hosts...</p>}
      {hostsError && <p className="text-red-500">Error loading hosts: {hostsError.message}</p>}

      {hosts && hosts.length > 0 ? (
        <div className="space-y-4">
          {hosts.map((host) => (
            <div key={host.id} className="p-4 border rounded-lg shadow">
              <h3 className="text-lg font-semibold">{host.hostname}</h3>
              <p>Status: <span className={`font-medium ${
                host.status === 'idle' ? 'text-green-500' :
                host.status === 'busy' ? 'text-yellow-500' :
                host.status === 'offline' ? 'text-red-500' : 'text-gray-500'
              }`}>{host.status}</span></p>
              <p className="text-sm text-gray-500">ID: {host.id}</p>
              <button
                onClick={() => handleUpdateStatus(host.id, host.status)}
                className="mt-2 bg-gray-200 hover:bg-gray-300 text-black py-1 px-3 rounded-md text-sm"
              >
                Toggle Status (MVP)
              </button>
            </div>
          ))}
        </div>
      ) : (
        !isLoadingHosts && <p>No build hosts found for this team.</p>
      )}
    </div>
  );
};

export default TeamBuildHostsPage;
