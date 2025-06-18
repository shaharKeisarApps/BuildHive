import { HttpError } from 'wasp/server'
import type { User, Team, Job } from 'wasp/entities'
import type { Prisma } from '@prisma/client'
// For Wasp jobs, the type is typically inferred or you can define a payload type.
// If BuildJobHandler has a specific payload schema defined in Wasp, you might import that.
// For `context.jobs.BuildJobHandler.submit`, the payload is { jobId: string } as per requirements.

// Wasp action/query argument types
interface SubmitJobArgs {
  payload: string
  teamId: string
}

interface GetTeamJobsArgs {
  teamId: string
}

interface GetJobDetailsArgs {
  jobId: string
}

// Context type (simplified for relevant parts)
// Wasp infers this, but explicit definition aids development.
// Note: `BuildJobHandler` refers to the Wasp Job name.
interface JobContext {
  user: User
  entities: {
    Job: Prisma.JobDelegate<never>
    Team: Prisma.TeamDelegate<never>
  }
  jobs: {
    BuildJobHandler: { submit: (payload: { jobId: string }) => Promise<any> } // Using `any` for promise result for simplicity
  }
}

export const submitJob = async (
  args: SubmitJobArgs,
  context: JobContext
): Promise<Job> => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized')
  }

  const { payload, teamId } = args

  if (!payload) {
    throw new HttpError(400, 'Job payload is required.')
  }
  if (!teamId) {
    throw new HttpError(400, 'Team ID is required.')
  }

  const team = await context.entities.Team.findUnique({
    where: { id: teamId },
    include: { users: true }, // To check if user is part of the team
  });

  if (!team) {
    throw new HttpError(404, 'Team not found.')
  }

  const isUserInTeam = team.users.some(user => user.id === context.user.id);
  if (!isUserInTeam && !context.user.isAdmin) { // Allow admin to bypass
    throw new HttpError(403, 'User is not authorized to submit jobs for this team.')
  }

  let newJob: Job;
  try {
    newJob = await context.entities.Job.create({
      data: {
        payload,
        teamId,
        status: 'pending', // Initial status
        // assignedHostId will be null by default as per Prisma schema
      },
    })
  } catch (error) {
    console.error("Error creating job in database:", error);
    throw new HttpError(500, 'Failed to create job.')
  }

  // Do NOT submit to BuildJobHandler here.
  // The AssignerJob (via AssignQueuedJobs cron) will pick up 'pending' jobs.
  console.log(`Job ${newJob.id} created with status 'pending'. It will be picked up by the assigner.`);

  return newJob;
}

export const getTeamJobs = async (
  args: GetTeamJobsArgs,
  context: JobContext
): Promise<Job[]> => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized')
  }

  const { teamId } = args
  if (!teamId) {
    throw new HttpError(400, 'Team ID is required.')
  }

  const team = await context.entities.Team.findUnique({
    where: { id: teamId },
    include: { users: true },
  });

  if (!team) {
    throw new HttpError(404, 'Team not found.')
  }

  const isUserInTeam = team.users.some(user => user.id === context.user.id);
  if (!isUserInTeam && !context.user.isAdmin) {
    throw new HttpError(403, 'User is not authorized to view jobs for this team.')
  }

  try {
    const jobs = await context.entities.Job.findMany({
      where: {
        teamId: teamId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      // Optionally include related entities like assignedHost if needed in the list view
      // include: { assignedHost: true }
    })
    return jobs
  } catch (error) {
    console.error("Error fetching team jobs:", error);
    throw new HttpError(500, 'Failed to retrieve team jobs.')
  }
}

// Helper type for Job with its team and team users (for getJobDetails)
type JobWithTeamAndUsers = Job & {
  team: Team & {
    users: User[]
  }
}

export const getJobDetails = async (
  args: GetJobDetailsArgs,
  context: JobContext
): Promise<JobWithTeamAndUsers> => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized')
  }

  const { jobId } = args
  if (!jobId) {
    throw new HttpError(400, 'Job ID is required.')
  }

  let job: JobWithTeamAndUsers | null = null;
  try {
    const foundJob = await context.entities.Job.findUnique({
      where: { id: jobId },
      include: {
        team: {
          include: {
            users: true
          }
        },
        assignedHost: true // Also include assigned host details if available
      }
    });

    if (!foundJob) {
      throw new HttpError(404, 'Job not found.')
    }
    // Cast to the helper type after ensuring it's not null.
    // Prisma's generated types for includes are generally correct,
    // but this explicit type can help ensure structure.
    job = foundJob as JobWithTeamAndUsers;

  } catch (error: any) {
    if (error instanceof HttpError) throw error;
    console.error("Error fetching job details:", error);
    throw new HttpError(500, 'Failed to retrieve job details.')
  }

  // Authorization check: user must be part of the team that owns the job, or an admin
  const isUserInJobTeam = job.team.users.some(user => user.id === context.user.id);
  if (!isUserInJobTeam && !context.user.isAdmin) {
    throw new HttpError(403, 'User is not authorized to view this job.')
  }

  return job;
}
