import type { Job as PrismaJob, BuildHost as PrismaBuildHost } from '@prisma/client';
// Wasp entity type for Job can be imported if you need to ensure type consistency with what Wasp expects for entities.
// However, Prisma types are often more directly useful in server-side logic.
// import type { Job } from 'wasp/entities';

// Context for handleBuildJob
interface HandleBuildContext {
  entities: {
    Job: any; // Prisma.JobDelegate<never>
    BuildHost: any; // Prisma.BuildHostDelegate<never>
  };
}

// Payload for BuildJobHandler (what it expects to receive)
interface BuildJobPayload {
  jobId: string;
}

// Context for assignJobsToHosts
interface AssignJobsContext {
  entities: {
    Job: any; // Prisma.JobDelegate<never>
    BuildHost: any; // Prisma.BuildHostDelegate<never>
  };
  jobs: {
    // The key here must match the Wasp Job name defined in main.wasp
    BuildJobHandler: { submit: (payload: BuildJobPayload) => Promise<any> };
  };
}

export const handleBuildJob = async (
  waspJob: { id: string; payload: BuildJobPayload; /* other pg-boss properties */ },
  context: HandleBuildContext
): Promise<void> => {
  const { Job: JobEntity, BuildHost: BuildHostEntity } = context.entities;
  const { jobId } = waspJob.payload;

  console.log(`[BuildJobHandler] Started handling job with DB ID: ${jobId}. Full Wasp job ID: ${waspJob.id}`);

  let dbJob: PrismaJob | null = null;
  try {
    dbJob = await JobEntity.findUnique({ where: { id: jobId } });
  } catch (e: any) {
    console.error(`[BuildJobHandler] Error fetching job ${jobId}: ${e.message}`);
    return; // Exit if DB query fails
  }

  if (!dbJob) {
    console.error(`[BuildJobHandler] Job with DB ID ${jobId} not found.`);
    return;
  }

  // 1. Update job status to "running"
  try {
    // Check if job was already processed or in a terminal state
    if (['completed', 'failed'].includes(dbJob.status)) {
        console.warn(`[BuildJobHandler] Job ${jobId} is already in a terminal state: ${dbJob.status}. Skipping.`);
        return;
    }
    dbJob = await JobEntity.update({
      where: { id: jobId },
      data: { status: 'running' },
    });
    console.log(`[BuildJobHandler] Job ${jobId} status updated to "running".`);
  } catch (e: any) {
    console.error(`[BuildJobHandler] Failed to update job ${jobId} to running: ${e.message}`);
    return;
  }

  // 2. Simulate work
  const workDuration = parseInt(process.env.MOCK_JOB_DURATION_MS || '15000');
  console.log(`[BuildJobHandler] Simulating work for job ${jobId} (${workDuration / 1000} seconds)...`);
  await new Promise(resolve => setTimeout(resolve, workDuration));

  // 3. Randomly decide success or failure
  const succeeded = Math.random() > 0.3; // 70% chance of success

  // 4. Update job status accordingly
  const finalStatus = succeeded ? 'completed' : 'failed';
  try {
    await JobEntity.update({
      where: { id: jobId },
      data: { status: finalStatus },
    });
    console.log(`[BuildJobHandler] Job ${jobId} status updated to "${finalStatus}".`);
  } catch (e: any) {
    console.error(`[BuildJobHandler] Failed to update job ${jobId} to ${finalStatus}: ${e.message}`);
    // If this fails, the job might be stuck in "running". Consider further error handling.
  }

  // 5. If the job used a BuildHost, update its status back to "idle"
  if (dbJob.assignedHostId) {
    try {
      await BuildHostEntity.update({
        where: { id: dbJob.assignedHostId },
        data: { status: 'idle' }, // Set host back to idle
      });
      console.log(`[BuildJobHandler] Build host ${dbJob.assignedHostId} status updated to "idle".`);
    } catch (e: any) {
      console.error(`[BuildJobHandler] Failed to update host ${dbJob.assignedHostId} to idle: ${e.message}`);
      // This is problematic, host might be stuck as "busy". Needs monitoring/manual intervention.
    }
  } else {
    console.log(`[BuildJobHandler] Job ${jobId} had no assigned host.`);
  }

  console.log(`[BuildJobHandler] Finished handling job ${jobId}. Final status: ${finalStatus}.`);
};


export const assignJobsToHosts = async (
  _waspJob: any, // Cron jobs receive a standard Wasp job object, payload is {} if not specified in main.wasp
  context: AssignJobsContext
): Promise<void> => {
  const { Job: JobEntity, BuildHost: BuildHostEntity } = context.entities;
  const { BuildJobHandler: buildJobScheduler } = context.jobs;

  console.log('[AssignerJob] Running to assign pending jobs to idle hosts...');

  let pendingJobs: PrismaJob[];
  let idleHosts: PrismaBuildHost[];

  try {
    pendingJobs = await JobEntity.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });

    idleHosts = await BuildHostEntity.findMany({
      where: { status: 'idle' },
    });
  } catch (e: any) {
    console.error(`[AssignerJob] Error fetching pending jobs or idle hosts: ${e.message}`);
    return;
  }

  if (!pendingJobs.length) {
    console.log('[AssignerJob] No pending jobs to assign.');
    return;
  }

  if (!idleHosts.length) {
    console.log('[AssignerJob] No idle hosts available for pending jobs.');
    return;
  }

  let assignmentsCount = 0;
  const availableHosts = [...idleHosts];

  for (const jobToAssign of pendingJobs) {
    if (!availableHosts.length) {
      console.log('[AssignerJob] No more idle hosts for remaining pending jobs.');
      break;
    }

    const hostToAssign = availableHosts.shift();
    if (!hostToAssign) continue;

    try {
      // Transaction might be good here if DB supported it easily with Prisma relation updates
      await JobEntity.update({
        where: { id: jobToAssign.id },
        data: {
          assignedHostId: hostToAssign.id,
          status: 'queued', // Job is now queued for BuildJobHandler
        },
      });

      await BuildHostEntity.update({
        where: { id: hostToAssign.id },
        data: { status: 'busy' }, // Host is now busy with this job
      });

      // IMPORTANT: This is where the actual Wasp job is submitted for the BuildJobHandler
      await buildJobScheduler.submit({ jobId: jobToAssign.id });

      assignmentsCount++;
      console.log(`[AssignerJob] Assigned Job ${jobToAssign.id} to Host ${hostToAssign.hostname} (ID: ${hostToAssign.id}). Submitted to BuildJobHandler.`);

    } catch (error: any) {
      console.error(`[AssignerJob] Failed to assign Job ${jobToAssign.id} to Host ${hostToAssign.id}: ${error.message}`);
      // Attempt to revert state if possible, or log for manual intervention.
      // E.g., if job submission failed, set host back to 'idle' and job to 'pending'.
      // This part can be complex to make fully robust.
      // For now, we'll just log. The host might remain 'busy' and job 'queued' if submission fails.
    }
  }

  if (assignmentsCount > 0) {
    console.log(`[AssignerJob] Successfully processed ${assignmentsCount} job assignments.`);
  } else {
    console.log('[AssignerJob] No new assignments made in this run (either no pending jobs or no idle hosts matched).');
  }
};
