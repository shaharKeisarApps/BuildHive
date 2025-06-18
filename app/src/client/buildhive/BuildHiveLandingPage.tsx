import React from 'react';
import { Link } from 'wasp/client/router';
import useAuth from 'wasp/client/auth'; // To get user data, specifically teams

const BuildHiveLandingPage: React.FC = () => {
  const { data: user } = useAuth();

  // For MVP, we assume user object has a 'teams' array.
  // This needs to be ensured by updating User entity or a dedicated query.
  // For now, let's assume `user.teams` exists.
  // A proper implementation would fetch teams via a query e.g. `useQuery(getUserTeams)`

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">BuildHive Landing</h1>
      <p className="mb-2">Welcome, {user?.email || user?.username}!</p>

      <div className="mb-4">
        <h2 className="text-xl font-semibold">Your Teams</h2>
        {/* TODO: Fetch and list teams. For now, placeholder. */}
        {user && (user as any).teams && (user as any).teams.length > 0 ? (
          <ul>
            {(user as any).teams.map((team: any) => (
              <li key={team.id} className="mb-2 p-2 border rounded">
                <h3 className="font-semibold">{team.name}</h3>
                <Link to="/buildhive/team/:teamId/hosts" params={{ teamId: team.id }} className="text-blue-500 hover:underline mr-2">
                  View Hosts
                </Link>
                <Link to="/buildhive/team/:teamId/jobs" params={{ teamId: team.id }} className="text-blue-500 hover:underline">
                  View Jobs
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>You are not part of any teams yet. {/* TODO: Link to team creation */}</p>
        )}
        <p className="mt-2 text-sm text-gray-600">
          Note: Team data might require a dedicated query to fetch user's teams with their IDs and names.
          The current implementation assumes `user.teams` is available via `useAuth()`.
        </p>
      </div>
      {/* TODO: Add link to create a new team */}
    </div>
  );
};

export default BuildHiveLandingPage;
