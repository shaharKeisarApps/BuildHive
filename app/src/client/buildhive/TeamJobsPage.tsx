import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom'; // Link from react-router-dom for internal nav
import { useQuery, useAction } from 'wasp/client/operations';
import getTeamJobs from 'wasp/queries/getTeamJobs';
import submitJob from 'wasp/actions/submitJob';
// Wasp Link for navigation that understands Wasp routes
import { Link as WaspLink } from 'wasp/client/router';


const TeamJobsPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [newJobPayload, setNewJobPayload] = useState('');

  const { data: jobs, isLoading: isLoadingJobs, error: jobsError } = useQuery(getTeamJobs, { teamId });
  const submitNewJob = useAction(submitJob);

  const handleSubmitJob = async () => {
    if (!newJobPayload.trim() || !teamId) return;
    try {
      await submitNewJob({ payload: newJobPayload, teamId });
      setNewJobPayload(''); // Clear textarea
    } catch (err: any) {
      alert('Error submitting job: ' + (err.message || 'Unknown error'));
    }
  };

  // TODO: Fetch team name for display
  const teamName = `Team (ID: ${teamId})`; // Placeholder

  return (
    <div className="p-4">
      <WaspLink to="/buildhive" className="text-blue-500 hover:underline mb-4 block">&larr; Back to BuildHive Landing</WaspLink>
      <h1 className="text-2xl font-bold mb-4">Jobs for {teamName}</h1>

      <div className="mb-6 p-4 border rounded shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Submit New Job</h2>
        <textarea
          placeholder="Enter job payload (e.g., build script commands)"
          value={newJobPayload}
          onChange={(e) => setNewJobPayload(e.target.value)}
          className="border p-2 rounded-md w-full h-32 mb-2"
        />
        <button
          onClick={handleSubmitJob}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md"
        >
          Submit Job
        </button>
      </div>

      {isLoadingJobs && <p>Loading jobs...</p>}
      {jobsError && <p className="text-red-500">Error loading jobs: {jobsError.message}</p>}

      {jobs && jobs.length > 0 ? (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="p-4 border rounded-lg shadow">
              <h3 className="text-lg font-semibold">Job ID: {job.id}</h3>
              <p>Status: <span className={`font-medium ${
                job.status === 'pending' ? 'text-yellow-500' :
                job.status === 'running' ? 'text-blue-500' :
                job.status === 'completed' ? 'text-green-500' :
                job.status === 'failed' || job.status === 'submission_failed' ? 'text-red-500' : 'text-gray-500'
              }`}>{job.status}</span></p>
              <p className="text-sm text-gray-600 truncate" title={job.payload}>Payload: {job.payload.substring(0,100)}{job.payload.length > 100 && "..."}</p>
              <p className="text-xs text-gray-400">Created: {new Date(job.createdAt).toLocaleString()}</p>
              <WaspLink
                to="/buildhive/job/:jobId"
                params={{ jobId: job.id }}
                className="mt-2 inline-block text-blue-500 hover:underline text-sm"
              >
                View Details
              </WaspLink>
            </div>
          ))}
        </div>
      ) : (
        !isLoadingJobs && <p>No jobs found for this team.</p>
      )}
    </div>
  );
};

export default TeamJobsPage;
