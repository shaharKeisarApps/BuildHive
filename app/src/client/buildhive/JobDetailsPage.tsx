import React from 'react';
import { useParams, Link as ReactRouterLink } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import getJobDetails from 'wasp/queries/getJobDetails';
import { Link as WaspLink } from 'wasp/client/router'; // Wasp's Link

const JobDetailsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();

  const { data: job, isLoading, error } = useQuery(getJobDetails, { jobId });

  if (isLoading) return <p className="p-4">Loading job details...</p>;
  if (error) return <p className="p-4 text-red-500">Error loading job details: {error.message}</p>;
  if (!job) return <p className="p-4">Job not found.</p>;

  return (
    <div className="p-4">
      <WaspLink
        to="/buildhive/team/:teamId/jobs"
        params={{ teamId: job.teamId }}
        className="text-blue-500 hover:underline mb-4 block"
      >
        &larr; Back to Jobs for Team {job.team?.name || job.teamId}
      </WaspLink>
      <h1 className="text-2xl font-bold mb-4">Job Details</h1>

      <div className="bg-white shadow-lg rounded-lg p-6 space-y-3">
        <div>
          <h2 className="text-sm font-medium text-gray-500">Job ID</h2>
          <p className="text-lg text-gray-900">{job.id}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-gray-500">Status</h2>
          <p className={`text-lg font-semibold ${
            job.status === 'pending' ? 'text-yellow-600' :
            job.status === 'running' ? 'text-blue-600' :
            job.status === 'completed' ? 'text-green-600' :
            job.status === 'failed' || job.status === 'submission_failed' ? 'text-red-600' : 'text-gray-600'
          }`}>{job.status}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-gray-500">Team</h2>
          <p className="text-lg text-gray-900">{job.team?.name || `ID: ${job.teamId}`}</p>
        </div>
        {job.assignedHost && (
          <div>
            <h2 className="text-sm font-medium text-gray-500">Assigned Build Host</h2>
            {/* TODO: Could make this a link to the host if a host details page existed */}
            <p className="text-lg text-gray-900">{job.assignedHost.hostname} (ID: {job.assignedHostId})</p>
          </div>
        )}
        <div>
          <h2 className="text-sm font-medium text-gray-500">Payload</h2>
          <pre className="bg-gray-100 p-3 rounded-md text-sm text-gray-800 whitespace-pre-wrap break-all">
            {job.payload}
          </pre>
        </div>
        <div>
          <h2 className="text-sm font-medium text-gray-500">Created At</h2>
          <p className="text-lg text-gray-900">{new Date(job.createdAt).toLocaleString()}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-gray-500">Last Updated At</h2>
          <p className="text-lg text-gray-900">{new Date(job.updatedAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsPage;
