import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '@/utils/db';

import type { Agent } from '@prisma/client';

async function main(): Promise<void> {
  const agents = await prisma.agent.findMany();
  // const info = await transporter.sendMail({
  //   from: config.EMAIL_FROM,
  //   to: 'jmasresha@gmail.com',
  //   subject: 'Hello from code',
  //   text: 'Hello from code',
  // });

  // // console.log(info);

  //

  // const agents = await prisma.agent.findMany();
  // const collectedAgents: { [key: string]: Agent[] } = {};

  // for (const agent of agents) {
  //   const container = collectedAgents[agent.name] || [];
  //   collectedAgents[agent.name] = [...container, agent];
  // }

  // writeFileSync(join(__filename, '..', 'agents.json'), JSON.stringify(collectedAgents, null, 2));

  //

  // const agents = await prisma.agent.findMany();
  // const collectedAgents: { [key: string]: Agent[] } = {};

  // for (const agent of agents) {
  //   const name = agent.name.toLowerCase();
  //   const container = collectedAgents[name] || [];
  //   collectedAgents[name] = [...container, agent];
  // }

  // writeFileSync(join(__filename, '..', 'agents2.json'), JSON.stringify(collectedAgents, null, 2));

  //

  // combining agents

  const container: { [key: string]: Agent[] } = {};

  for (const agent of agents) {
    const name = agent.name.toLowerCase();

    if (name in container) {
      container[name].push(agent);
    } else {
      container[name] = [agent];
    }
  }

  const values = Object.values(container);

  writeFileSync(join(__filename, '..', 'agents3.json'), JSON.stringify(values, null, 2));

  // const entries = agents.entries();
  // for (const [i, agent] of entries) {
  //   // console.log(`${i} of ${agents.length}`);
  //   const name = agent.name.toLowerCase();
  //   const index = collectedAgents.findIndex((container) =>
  //     container.some((a) => a.name.toLowerCase() === name),
  //   );

  //   if (index === -1) {
  //     collectedAgents.push([agent]);
  //   } else {
  //     collectedAgents[index].push(agent);
  //   }
  // }

  // writeFileSync(join(__filename, '..', 'agents3.json'), JSON.stringify(collectedAgents, null, 2));

  // // checking links

  // for (const agent of agents) {
  //   if (agent.coldwellLink && agent.realtorLink) {
  //     // console.log(agent);
  //     // console.log('-');
  //   }
  // }

  //

  // const agents = (await prisma.agent.findMany()).filter((agent) => typeof agent.email === 'string');

  // const namesArray = agents.map((agent) => agent.name);
  // // console.log(namesArray.length);
  // const names = Array.from(new Set(namesArray));
  // // console.log(names.length);
}

main();
