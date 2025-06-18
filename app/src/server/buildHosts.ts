import { HttpError } from 'wasp/server'
import type { User, Team, BuildHost } from 'wasp/entities'
import type { Prisma } from '@prisma/client'

// Wasp action types
interface RegisterBuildHostArgs {
  hostname: string
  teamId: string
}

interface GetTeamBuildHostsArgs {
  teamId: string
}

interface UpdateBuildHostStatusArgs {
  hostId: string
  status: string
}

// Context type (simplified, focusing on what's used)
// Wasp automatically infers this from the `entities` in main.wasp
// but defining it here can help with type safety during development.
interface Context {
  user: User
  entities: {
    BuildHost: Prisma.BuildHostDelegate<never>
    Team: Prisma.TeamDelegate<never>
    // User is also available if needed: User: Prisma.UserDelegate<never>
  }
}

export const registerBuildHost = async (
  args: RegisterBuildHostArgs,
  context: Context
): Promise<BuildHost> => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized')
  }

  const { hostname, teamId } = args

  // Basic validation
  if (!hostname) {
    throw new HttpError(400, 'Hostname is required.')
  }
  if (!teamId) {
    throw new HttpError(400, 'Team ID is required.')
  }

  // Check if team exists and if user is part of that team
  const team = await context.entities.Team.findUnique({
    where: { id: teamId },
    include: { users: true }, // Ensure 'users' relation is included for the check
  });

  if (!team) {
    throw new HttpError(404, 'Team not found.')
  }

  const isUserInTeam = team.users.some(user => user.id === context.user.id);
  // Allow admin to bypass team membership check if needed
  if (!isUserInTeam && !context.user.isAdmin) {
    throw new HttpError(403, 'User is not authorized to register hosts for this team.')
  }

  // Check for existing hostname within the same team
  const existingHost = await context.entities.BuildHost.findFirst({
    where: { hostname, teamId },
  });
  if (existingHost) {
    throw new HttpError(400, `Hostname "${hostname}" already exists in this team.`);
  }

  try {
    const newBuildHost = await context.entities.BuildHost.create({
      data: {
        hostname,
        teamId,
        status: 'idle', // Default status
      },
    })
    return newBuildHost
  } catch (error) {
    console.error("Error registering build host:", error); // Log detailed error server-side
    throw new HttpError(500, 'Failed to register build host.')
  }
}

export const getTeamBuildHosts = async (
  args: GetTeamBuildHostsArgs,
  context: Context
): Promise<BuildHost[]> => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized')
  }

  const { teamId } = args
  if (!teamId) {
    throw new HttpError(400, 'Team ID is required.')
  }

  // Validate team existence and user access
  const team = await context.entities.Team.findUnique({
    where: { id: teamId },
    include: { users: true },
  });

  if (!team) {
    // Depending on desired behavior, could also return empty array if team not found
    // and user doesn't have rights to know about the team's existence.
    throw new HttpError(404, 'Team not found.')
  }

  const isUserInTeam = team.users.some(user => user.id === context.user.id);
  if (!isUserInTeam && !context.user.isAdmin) {
    throw new HttpError(403, 'User is not authorized to view hosts for this team.')
  }

  try {
    const buildHosts = await context.entities.BuildHost.findMany({
      where: {
        teamId: teamId,
      },
      orderBy: { hostname: 'asc' } // Optional: order results
    })
    return buildHosts
  } catch (error) {
    console.error("Error getting team build hosts:", error);
    throw new HttpError(500, 'Failed to retrieve build hosts.')
  }
}

export const updateBuildHostStatus = async (
  args: UpdateBuildHostStatusArgs,
  context: Context
): Promise<BuildHost> => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized')
  }

  const { hostId, status } = args
  if (!hostId || !status) {
    throw new HttpError(400, 'Host ID and status are required.')
  }

  // Validate status value
  const validStatuses = ['idle', 'busy', 'offline', 'maintenance', 'error', 'terminating', 'terminated'];
  if (!validStatuses.includes(status)) {
    throw new HttpError(400, `Invalid status value. Must be one of: ${validStatuses.join(', ')}`);
  }

  // Find the host first to check permissions
  const buildHost = await context.entities.BuildHost.findUnique({
    where: { id: hostId },
    // Include team and its users for auth check.
    // This requires 'team' to have a relation to 'users' in Prisma schema,
    // which it does via the implicit join table for many-to-many.
    include: { team: { include: { users: true } } },
  });

  if (!buildHost) {
    throw new HttpError(404, 'Build host not found.')
  }

  // Authorization: Check if user is part of the team that owns the host
  const isUserInTeam = buildHost.team.users.some(user => user.id === context.user.id);
  if (!isUserInTeam && !context.user.isAdmin) {
     throw new HttpError(403, 'User is not authorized to update this build host.')
  }

  try {
    const updatedBuildHost = await context.entities.BuildHost.update({
      where: {
        id: hostId, // Ensure this user is allowed to update this host (e.g. it belongs to their team)
      },
      data: {
        status,
      },
    })
    return updatedBuildHost
  } catch (error) {
    console.error("Error updating build host status:", error);
    // Check for specific Prisma errors e.g. P2025 (Record to update not found)
    if ((error as any).code === 'P2025') {
        throw new HttpError(404, 'Build host not found for update.');
    }
    throw new HttpError(500, 'Failed to update build host status.')
  }
}
