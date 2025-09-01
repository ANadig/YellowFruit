import { IpcMainEvent } from 'electron';
import { Octokit } from 'octokit';
import { IpcBidirectional } from '../IPCChannels';

const octokit = new Octokit();

export async function checkForNewVersions(event: IpcMainEvent) {
  const response = await octokit.request('GET /repos/ANadig/YellowFruit/releases/latest', {
    headers: { 'X-GitHub-Api-Version': '2022-11-28' },
  });

  const tag = response.data.tag_name as string;
  if (!tag) return;

  event.reply(IpcBidirectional.CheckForNewVersion, getVersionNumberFromTag(tag));
}

function getVersionNumberFromTag(tag: string) {
  if (tag.startsWith('v')) return tag.substring(1);
  return tag;
}
