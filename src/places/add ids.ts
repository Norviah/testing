import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import * as paths from '@/utils/paths';

const MAIN_FOLDER_ID = '15054091';
const SECONDARY_FOLDER_ID = '15054099';

type Board = {
  name: string;
  id: string;
  groupId?: string;
  type: 'Demo' | 'Building';
  folder: string;
};

let boards: Board[];

if (existsSync(paths.BOARDS)) {
  boards = JSON.parse(readFileSync(paths.BOARDS, 'utf-8'));
} else {
  writeFileSync(paths.BOARDS, '[]');
  boards = [];
}

async function Check() {
  // CONCRETE = 15054091
  // EUROLINE = 15054099

  const folder1 = {
    data: {
      folders: [
        {
          name: 'Sales',
          id: '15054091',
          children: [
            {
              name: 'Lexington Demo Permits/Master Board',
              id: '7355753313',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group70848__1',
                },
                {
                  id: 'new_group18512__1',
                },
                {
                  id: 'new_group50168__1',
                },
                {
                  id: 'new_group30396__1',
                },
                {
                  id: 'new_group15778__1',
                },
                {
                  id: 'new_group13452__1',
                },
                {
                  id: 'new_group11425__1',
                },
                {
                  id: 'new_group_mkmndv4n',
                },
              ],
            },
            {
              name: 'Lexington Building Permits',
              id: '7355759603',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group9903__1',
                },
                {
                  id: 'new_group83032__1',
                },
                {
                  id: 'new_group87234__1',
                },
                {
                  id: 'new_group58336__1',
                },
                {
                  id: 'new_group88212__1',
                },
                {
                  id: 'new_group898__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group_mkmnh7d5',
                },
              ],
            },
            {
              name: 'Brookline Demo Permits',
              id: '7355841691',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group74438__1',
                },
                {
                  id: 'new_group62217__1',
                },
                {
                  id: 'new_group22862__1',
                },
                {
                  id: 'new_group66418__1',
                },
                {
                  id: 'new_group77325__1',
                },
                {
                  id: 'new_group27423__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group_mkmn1ece',
                },
              ],
            },
            {
              name: 'Brookline Building Permits',
              id: '7355845891',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group62680__1',
                },
                {
                  id: 'new_group6613__1',
                },
                {
                  id: 'new_group7083__1',
                },
                {
                  id: 'new_group95834__1',
                },
                {
                  id: 'new_group7032__1',
                },
                {
                  id: 'new_group87321__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group_mkmnr0ee',
                },
              ],
            },
            {
              name: 'Easton Building Permits',
              id: '7355850679',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group40067__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group87138__1',
                },
                {
                  id: 'new_group27267__1',
                },
                {
                  id: 'new_group59289__1',
                },
                {
                  id: 'new_group37138__1',
                },
                {
                  id: 'new_group27767__1',
                },
                {
                  id: 'new_group48255__1',
                },
                {
                  id: 'new_group_mkmn2x3e',
                },
              ],
            },
            {
              name: 'Foxborough Building Permits',
              id: '7355854694',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group73062__1',
                },
                {
                  id: 'new_group74346__1',
                },
                {
                  id: 'new_group75757__1',
                },
                {
                  id: 'new_group78110__1',
                },
                {
                  id: 'new_group83639__1',
                },
                {
                  id: 'new_group79393__1',
                },
                {
                  id: 'new_group69978__1',
                },
                {
                  id: 'new_group_mkmn5k2f',
                },
              ],
            },
            {
              name: 'Hingham Building Permits',
              id: '7355860575',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group65160__1',
                },
                {
                  id: 'new_group23056__1',
                },
                {
                  id: 'new_group70386__1',
                },
                {
                  id: 'new_group24129__1',
                },
                {
                  id: 'new_group21705__1',
                },
                {
                  id: 'new_group88955__1',
                },
                {
                  id: 'new_group75706__1',
                },
                {
                  id: 'new_group_mkmnh6xw',
                },
              ],
            },
            {
              name: 'Milton Building Permits',
              id: '7355865692',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group54532__1',
                },
                {
                  id: 'new_group22579__1',
                },
                {
                  id: 'new_group43971__1',
                },
                {
                  id: 'new_group71799__1',
                },
                {
                  id: 'new_group27718__1',
                },
                {
                  id: 'new_group57621__1',
                },
                {
                  id: 'new_group86367__1',
                },
                {
                  id: 'new_group_mkmnabdq',
                },
              ],
            },
            {
              name: 'Norwood Building Permits',
              id: '7355872897',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group50842__1',
                },
                {
                  id: 'new_group42359__1',
                },
                {
                  id: 'new_group38748__1',
                },
                {
                  id: 'new_group1439__1',
                },
                {
                  id: 'new_group7353__1',
                },
                {
                  id: 'new_group67753__1',
                },
                {
                  id: 'new_group9585__1',
                },
                {
                  id: 'new_group_mkmnk23z',
                },
              ],
            },
            {
              name: 'West Roxbury Demo Permits',
              id: '7355876258',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group40168__1',
                },
                {
                  id: 'new_group56416__1',
                },
                {
                  id: 'new_group35379__1',
                },
                {
                  id: 'new_group70645__1',
                },
                {
                  id: 'new_group99264__1',
                },
                {
                  id: 'new_group17427__1',
                },
                {
                  id: 'new_group47744__1',
                },
                {
                  id: 'new_group_mkmnwakw',
                },
              ],
            },
            {
              name: 'West Roxbury Building Permits',
              id: '7355881822',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group48684__1',
                },
                {
                  id: 'new_group12777__1',
                },
                {
                  id: 'new_group22787__1',
                },
                {
                  id: 'new_group83930__1',
                },
                {
                  id: 'new_group57669__1',
                },
                {
                  id: 'new_group57338__1',
                },
                {
                  id: 'new_group43448__1',
                },
                {
                  id: 'new_group_mkmnnc24',
                },
              ],
            },
            {
              name: 'Jamaica Plain Demo Permits',
              id: '7355886230',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group8246__1',
                },
                {
                  id: 'new_group11524__1',
                },
                {
                  id: 'new_group68766__1',
                },
                {
                  id: 'new_group45666__1',
                },
                {
                  id: 'new_group19929__1',
                },
                {
                  id: 'new_group28268__1',
                },
                {
                  id: 'new_group98743__1',
                },
                {
                  id: 'new_group_mkmnyph7',
                },
              ],
            },
            {
              name: 'Jamaica Plain Building Permits',
              id: '7355891824',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group3810__1',
                },
                {
                  id: 'new_group95101__1',
                },
                {
                  id: 'new_group1526__1',
                },
                {
                  id: 'new_group26057__1',
                },
                {
                  id: 'new_group67935__1',
                },
                {
                  id: 'new_group46521__1',
                },
                {
                  id: 'new_group43909__1',
                },
                {
                  id: 'new_group_mkmnnvbb',
                },
              ],
            },
            {
              name: 'Easton Demo Permits',
              id: '7355906705',
              groups: [
                {
                  id: 'new_group7938__1',
                },
                {
                  id: 'new_group43931__1',
                },
                {
                  id: 'new_group39563__1',
                },
                {
                  id: 'new_group74435__1',
                },
                {
                  id: 'new_group6302__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group37474__1',
                },
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group_mkmnr4em',
                },
              ],
            },
            {
              name: 'Foxborough Demo Permits',
              id: '7355917763',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group48059__1',
                },
                {
                  id: 'new_group25682__1',
                },
                {
                  id: 'new_group69915__1',
                },
                {
                  id: 'new_group66958__1',
                },
                {
                  id: 'new_group81396__1',
                },
                {
                  id: 'new_group59548__1',
                },
                {
                  id: 'new_group26448__1',
                },
                {
                  id: 'new_group_mkmnefa7',
                },
              ],
            },
            {
              name: 'Hingham Demo Permits',
              id: '7355926068',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group92032__1',
                },
                {
                  id: 'new_group37097__1',
                },
                {
                  id: 'new_group95425__1',
                },
                {
                  id: 'new_group36990__1',
                },
                {
                  id: 'new_group43179__1',
                },
                {
                  id: 'new_group93131__1',
                },
                {
                  id: 'new_group51005__1',
                },
              ],
            },
            {
              name: 'Milton Demo Permits',
              id: '7355933179',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group80812__1',
                },
                {
                  id: 'new_group51041__1',
                },
                {
                  id: 'new_group34039__1',
                },
                {
                  id: 'new_group57958__1',
                },
                {
                  id: 'new_group94415__1',
                },
                {
                  id: 'new_group28221__1',
                },
                {
                  id: 'new_group26434__1',
                },
                {
                  id: 'new_group_mkmnw06y',
                },
              ],
            },
            {
              name: 'Norwood Demo Permits',
              id: '7355938209',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group88035__1',
                },
                {
                  id: 'new_group99454__1',
                },
                {
                  id: 'new_group72515__1',
                },
                {
                  id: 'new_group84567__1',
                },
                {
                  id: 'new_group29554__1',
                },
                {
                  id: 'new_group78406__1',
                },
                {
                  id: 'new_group96833__1',
                },
                {
                  id: 'new_group_mkmnkpgb',
                },
              ],
            },
            {
              name: 'Newton Demo Permits',
              id: '7356023315',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group52182__1',
                },
                {
                  id: 'new_group9254__1',
                },
                {
                  id: 'new_group95068__1',
                },
                {
                  id: 'new_group5539__1',
                },
                {
                  id: 'new_group98261__1',
                },
                {
                  id: 'new_group62902__1',
                },
                {
                  id: 'new_group63734__1',
                },
                {
                  id: 'new_group_mkmndcp5',
                },
              ],
            },
            {
              name: 'Newton Building Permits',
              id: '7356028123',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group94821__1',
                },
                {
                  id: 'new_group70432__1',
                },
                {
                  id: 'new_group87117__1',
                },
                {
                  id: 'new_group38282__1',
                },
                {
                  id: 'new_group41281__1',
                },
                {
                  id: 'new_group55415__1',
                },
                {
                  id: 'new_group21491__1',
                },
                {
                  id: 'new_group_mkmn5y9f',
                },
              ],
            },
            {
              name: 'Weston Demo Permits',
              id: '7356033210',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group23182__1',
                },
                {
                  id: 'new_group25753__1',
                },
                {
                  id: 'new_group60838__1',
                },
                {
                  id: 'new_group39592__1',
                },
                {
                  id: 'new_group73286__1',
                },
                {
                  id: 'new_group92300__1',
                },
                {
                  id: 'new_group42209__1',
                },
                {
                  id: 'new_group_mkmndt6f',
                },
              ],
            },
            {
              name: 'Weston Building Permits',
              id: '7356039052',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group50976__1',
                },
                {
                  id: 'new_group91853__1',
                },
                {
                  id: 'new_group35725__1',
                },
                {
                  id: 'new_group84186__1',
                },
                {
                  id: 'new_group26382__1',
                },
                {
                  id: 'new_group8211__1',
                },
                {
                  id: 'new_group88276__1',
                },
                {
                  id: 'new_group_mkmnr7jg',
                },
              ],
            },
            {
              name: 'Woburn Demo Permits',
              id: '7372393812',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group7076__1',
                },
                {
                  id: 'new_group92826__1',
                },
                {
                  id: 'new_group14453__1',
                },
                {
                  id: 'new_group78109__1',
                },
                {
                  id: 'new_group52830__1',
                },
                {
                  id: 'new_group67807__1',
                },
                {
                  id: 'new_group31732__1',
                },
                {
                  id: 'new_group_mkmnyj0p',
                },
              ],
            },
            {
              name: 'Woburn Building Permits',
              id: '7372397943',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group33091__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group22585__1',
                },
                {
                  id: 'new_group85486__1',
                },
                {
                  id: 'new_group66257__1',
                },
                {
                  id: 'new_group60743__1',
                },
                {
                  id: 'new_group37291__1',
                },
                {
                  id: 'new_group_mkmnccpt',
                },
              ],
            },
            {
              name: 'Conversation Board',
              id: '7385026314',
              groups: [
                {
                  id: 'topics',
                },
              ],
            },
            {
              name: 'Needham Demo Permits',
              id: '7613609778',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group83225__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group78243__1',
                },
                {
                  id: 'new_group81482__1',
                },
                {
                  id: 'new_group28051__1',
                },
                {
                  id: 'new_group54441__1',
                },
                {
                  id: 'new_group14276__1',
                },
                {
                  id: 'new_group_mkmnw5ax',
                },
              ],
            },
            {
              name: 'Needham Building Permits',
              id: '7613612799',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group15469__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group78662__1',
                },
                {
                  id: 'new_group72842__1',
                },
                {
                  id: 'new_group37886__1',
                },
                {
                  id: 'new_group29456__1',
                },
                {
                  id: 'new_group51172__1',
                },
                {
                  id: 'new_group_mkmn3n88',
                },
              ],
            },
            {
              name: 'Stoughton Demo Permits',
              id: '8110876557',
              groups: [
                {
                  id: 'demo_permits_mkkhqytt',
                },
                {
                  id: 'new_group_mkm2tzwx',
                },
                {
                  id: 'new_group_mkm2s258',
                },
                {
                  id: 'new_group_mkm2q8xw',
                },
                {
                  id: 'new_group_mkm2qz5h',
                },
                {
                  id: 'new_group_mkm28jb5',
                },
                {
                  id: 'new_group_mkm2yh6x',
                },
                {
                  id: 'new_group_mkm2b77d',
                },
                {
                  id: 'new_group_mkmnhtdm',
                },
              ],
            },
            {
              name: 'Stoughton Building Permits',
              id: '8110876949',
              groups: [
                {
                  id: 'building_permits_mkkh3sjb',
                },
                {
                  id: 'new_group_mkm2at1y',
                },
                {
                  id: 'new_group_mkm2mjfk',
                },
                {
                  id: 'new_group_mkm25pxf',
                },
                {
                  id: 'new_group_mkm22g6e',
                },
                {
                  id: 'new_group_mkm2845r',
                },
                {
                  id: 'new_group_mkm2rrs8',
                },
                {
                  id: 'new_group_mkm294tz',
                },
                {
                  id: 'new_group_mkmnay17',
                },
              ],
            },
            {
              name: 'Medway Demo Permits',
              id: '8186297714',
              groups: [
                {
                  id: 'demo_permits_mkkzr8n5',
                },
                {
                  id: 'new_group_mkm254ar',
                },
                {
                  id: 'new_group_mkm2xt77',
                },
                {
                  id: 'new_group_mkm2sqzj',
                },
                {
                  id: 'new_group_mkm27jbx',
                },
                {
                  id: 'new_group_mkm2ahpb',
                },
                {
                  id: 'new_group_mkm2vxj6',
                },
                {
                  id: 'new_group_mkm2433b',
                },
                {
                  id: 'new_group_mkmntbc7',
                },
              ],
            },
            {
              name: 'Medway Building Permits',
              id: '8186303172',
              groups: [
                {
                  id: 'building_permits_mkkzwect',
                },
                {
                  id: 'new_group_mkm24b79',
                },
                {
                  id: 'new_group_mkm2d5kd',
                },
                {
                  id: 'new_group_mkm29pd0',
                },
                {
                  id: 'new_group_mkm2pzfw',
                },
                {
                  id: 'new_group_mkm2594t',
                },
                {
                  id: 'new_group_mkm2zvwr',
                },
                {
                  id: 'new_group_mkm2hkhy',
                },
                {
                  id: 'new_group_mkmnd9my',
                },
              ],
            },
            {
              name: 'Medford Demo Permits',
              id: '8392042724',
              groups: [
                {
                  id: 'demo_permits_mkmtthh7',
                },
                {
                  id: 'new_group_mkmwwf3h',
                },
                {
                  id: 'new_group_mkmwyqdp',
                },
                {
                  id: 'new_group_mkmw4bfq',
                },
                {
                  id: 'new_group_mkmwge3m',
                },
                {
                  id: 'new_group_mkmwkekq',
                },
                {
                  id: 'new_group_mkmwb34h',
                },
                {
                  id: 'new_group_mkmw71wp',
                },
                {
                  id: 'new_group_mkmwb322',
                },
              ],
            },
            {
              name: 'Medford Building Permits',
              id: '8392049634',
              groups: [
                {
                  id: 'building_permits_mkmtyycr',
                },
                {
                  id: 'group_mkp0sd7k',
                },
                {
                  id: 'group_mkp05jzb',
                },
                {
                  id: 'group_mkp07xsm',
                },
                {
                  id: 'group_mkp0zvwt',
                },
                {
                  id: 'group_mkp07nr3',
                },
                {
                  id: 'group_mkp0nwjx',
                },
                {
                  id: 'group_mkp07n7c',
                },
                {
                  id: 'group_mkp0b0ag',
                },
              ],
            },
            {
              name: 'Boston Demo Permits',
              id: '8405750061',
              groups: [
                {
                  id: 'demo_permits_mkmwb616',
                },
                {
                  id: 'new_group_mkmwg3qa',
                },
                {
                  id: 'new_group_mkmw3t7e',
                },
                {
                  id: 'new_group_mkmwm36f',
                },
                {
                  id: 'new_group_mkmwmbb7',
                },
                {
                  id: 'new_group_mkmwdkr3',
                },
                {
                  id: 'new_group_mkmwd8c6',
                },
                {
                  id: 'new_group_mkmwfj22',
                },
                {
                  id: 'new_group_mkmwbzgh',
                },
              ],
            },
            {
              name: 'Boston Building Permits',
              id: '8405758033',
              groups: [
                {
                  id: 'building_permits_mkmw30dv',
                },
                {
                  id: 'new_group_mkmwywb1',
                },
                {
                  id: 'new_group_mkmwym9y',
                },
                {
                  id: 'new_group_mkmw9jwp',
                },
                {
                  id: 'new_group_mkmw17pb',
                },
                {
                  id: 'new_group_mkmwsaew',
                },
                {
                  id: 'new_group_mkmw602r',
                },
                {
                  id: 'new_group_mkmwc1w3',
                },
                {
                  id: 'new_group_mkmw8p1x',
                },
              ],
            },
            {
              name: 'Hyde Park Demo Permits',
              id: '8405776205',
              groups: [
                {
                  id: 'demo_permits_mkmweycw',
                },
                {
                  id: 'new_group_mkmwtkes',
                },
                {
                  id: 'new_group_mkmw6v22',
                },
                {
                  id: 'new_group_mkmwp34j',
                },
                {
                  id: 'new_group_mkmwdgnt',
                },
                {
                  id: 'new_group_mkmwqwv1',
                },
                {
                  id: 'new_group_mkmwfypv',
                },
                {
                  id: 'new_group_mkmwe3ej',
                },
                {
                  id: 'new_group_mkmw6dv6',
                },
              ],
            },
            {
              name: 'Hyde Park Building Permits',
              id: '8405780840',
              groups: [
                {
                  id: 'building_permits_mkmw458e',
                },
                {
                  id: 'new_group_mkmwq38w',
                },
                {
                  id: 'new_group_mkmwk7t7',
                },
                {
                  id: 'new_group_mkmwamy4',
                },
                {
                  id: 'new_group_mkmwnjym',
                },
                {
                  id: 'new_group_mkmw72vs',
                },
                {
                  id: 'new_group_mkmw7vs4',
                },
                {
                  id: 'new_group_mkmwyz68',
                },
                {
                  id: 'new_group_mkmw54gs',
                },
              ],
            },
            {
              name: 'Roxbury Demo Permits',
              id: '8405789384',
              groups: [
                {
                  id: 'demo_permits_mkmwt63s',
                },
                {
                  id: 'new_group_mkmweh1n',
                },
                {
                  id: 'new_group_mkmwhgh8',
                },
                {
                  id: 'new_group_mkmw6hr',
                },
                {
                  id: 'new_group_mkmwz0yz',
                },
                {
                  id: 'new_group_mkmwnpw9',
                },
                {
                  id: 'new_group_mkmwz5p5',
                },
                {
                  id: 'new_group_mkmw9eqa',
                },
                {
                  id: 'new_group_mkmwb25r',
                },
              ],
            },
            {
              name: 'Roxbury Building Permits',
              id: '8405792515',
              groups: [
                {
                  id: 'building_permits_mkmw8drv',
                },
                {
                  id: 'new_group_mkmwkr19',
                },
                {
                  id: 'new_group_mkmw2f5r',
                },
                {
                  id: 'new_group_mkmwxr7z',
                },
                {
                  id: 'new_group_mkmw4ax6',
                },
                {
                  id: 'new_group_mkmwvb3a',
                },
                {
                  id: 'new_group_mkmwcerp',
                },
                {
                  id: 'new_group_mkmwpwed',
                },
                {
                  id: 'new_group_mkmwj8ah',
                },
              ],
            },
            {
              name: 'Dorchester Demo Permits',
              id: '8405806722',
              groups: [
                {
                  id: 'demo_permits_mkmw7q55',
                },
                {
                  id: 'new_group_mkmww481',
                },
                {
                  id: 'new_group_mkmwqbac',
                },
                {
                  id: 'new_group_mkmwtmpk',
                },
                {
                  id: 'new_group_mkmwgr4t',
                },
                {
                  id: 'new_group_mkmwfv7j',
                },
                {
                  id: 'new_group_mkmwqapd',
                },
                {
                  id: 'new_group_mkmwafw7',
                },
                {
                  id: 'new_group_mkmwy3kd',
                },
              ],
            },
            {
              name: 'Dorchester Building Permits',
              id: '8405810023',
              groups: [
                {
                  id: 'building_permits_mkmwvgea',
                },
                {
                  id: 'new_group_mkmw77nm',
                },
                {
                  id: 'new_group_mkmw98wc',
                },
                {
                  id: 'new_group_mkmwjsx4',
                },
                {
                  id: 'new_group_mkmwhcpm',
                },
                {
                  id: 'new_group_mkmwccf9',
                },
                {
                  id: 'new_group_mkmwxpw',
                },
                {
                  id: 'new_group_mkmwjwxk',
                },
                {
                  id: 'new_group_mkmw4165',
                },
              ],
            },
            {
              name: 'East Boston Demo Permits',
              id: '8405826527',
              groups: [
                {
                  id: 'demo_permits_mkmwmfs0',
                },
                {
                  id: 'new_group_mkmw3dd2',
                },
                {
                  id: 'new_group_mkmwc66n',
                },
                {
                  id: 'new_group_mkmwevm4',
                },
                {
                  id: 'new_group_mkmwmsrc',
                },
                {
                  id: 'new_group_mkmwv47z',
                },
                {
                  id: 'new_group_mkmwwwy6',
                },
                {
                  id: 'new_group_mkmwytgv',
                },
                {
                  id: 'new_group_mkmwf1wr',
                },
              ],
            },
            {
              name: 'East Boston Building Permits',
              id: '8405830754',
              groups: [
                {
                  id: 'building_permits_mkmwmnvm',
                },
                {
                  id: 'new_group_mkmwz95z',
                },
                {
                  id: 'new_group_mkmwx8h6',
                },
                {
                  id: 'new_group_mkmw30ta',
                },
                {
                  id: 'new_group_mkmwhkb7',
                },
                {
                  id: 'new_group_mkmwxd9k',
                },
                {
                  id: 'new_group_mkmwxpzg',
                },
                {
                  id: 'new_group_mkmwm08h',
                },
                {
                  id: 'new_group_mkmw6zee',
                },
              ],
            },
            {
              name: 'Mattapan Demo Permits',
              id: '8405840264',
              groups: [
                {
                  id: 'demo_permits_mkmweqhp',
                },
                {
                  id: 'new_group_mkmw6d8a',
                },
                {
                  id: 'new_group_mkmwqy5j',
                },
                {
                  id: 'new_group_mkmw5a83',
                },
                {
                  id: 'new_group_mkmwf5p3',
                },
                {
                  id: 'new_group_mkmwfegf',
                },
                {
                  id: 'new_group_mkmwrc6f',
                },
                {
                  id: 'new_group_mkmw85t1',
                },
                {
                  id: 'new_group_mkmw1dh3',
                },
              ],
            },
            {
              name: 'Mattapan Building Permits',
              id: '8405843842',
              groups: [
                {
                  id: 'building_permits_mkmwxyvz',
                },
                {
                  id: 'new_group_mkmwdyw2',
                },
                {
                  id: 'new_group_mkmwx5mn',
                },
                {
                  id: 'new_group_mkmwt6b6',
                },
                {
                  id: 'new_group_mkmwpe12',
                },
                {
                  id: 'new_group_mkmwzntn',
                },
                {
                  id: 'new_group_mkmwdgka',
                },
                {
                  id: 'new_group_mkmw3gq2',
                },
                {
                  id: 'new_group_mkmw8sev',
                },
              ],
            },
            {
              name: 'Brighton Demo Permits',
              id: '8405851839',
              groups: [
                {
                  id: 'demo_permits_mkmwdef1',
                },
                {
                  id: 'new_group_mkmwyb41',
                },
                {
                  id: 'new_group_mkmw56zf',
                },
                {
                  id: 'new_group_mkmwbest',
                },
                {
                  id: 'new_group_mkmwmbd8',
                },
                {
                  id: 'new_group_mkmwqaj2',
                },
                {
                  id: 'new_group_mkmwxz65',
                },
                {
                  id: 'new_group_mkmw402s',
                },
                {
                  id: 'new_group_mkmwze87',
                },
              ],
            },
            {
              name: 'Brighton Building Permits',
              id: '8405854196',
              groups: [
                {
                  id: 'building_permits_mkmwarfc',
                },
                {
                  id: 'new_group_mkmw578n',
                },
                {
                  id: 'new_group_mkmwmwpy',
                },
                {
                  id: 'new_group_mkmwq5fp',
                },
                {
                  id: 'new_group_mkmw3731',
                },
                {
                  id: 'new_group_mkmwg2c2',
                },
                {
                  id: 'new_group_mkmwz910',
                },
                {
                  id: 'new_group_mkmwg0jc',
                },
                {
                  id: 'new_group_mkmwkdmn',
                },
              ],
            },
            {
              name: 'Allston Demo Permits',
              id: '8405865343',
              groups: [
                {
                  id: 'demo_permits_mkmw4z7x',
                },
                {
                  id: 'new_group_mkmwk3yt',
                },
                {
                  id: 'new_group_mkmwpa0g',
                },
                {
                  id: 'new_group_mkmwd084',
                },
                {
                  id: 'new_group_mkmw3ae7',
                },
                {
                  id: 'new_group_mkmw36ry',
                },
                {
                  id: 'new_group_mkmwj4n8',
                },
                {
                  id: 'new_group_mkmwckay',
                },
                {
                  id: 'new_group_mkmw4jpb',
                },
              ],
            },
            {
              name: 'Allston Building Permits',
              id: '8405868111',
              groups: [
                {
                  id: 'topics',
                },
              ],
            },
            {
              name: 'Allston Building Permits',
              id: '8408021169',
              groups: [
                {
                  id: 'building_permits_mkmw4bf3',
                },
                {
                  id: 'new_group_mkmwh6ga',
                },
                {
                  id: 'new_group_mkmwt8m9',
                },
                {
                  id: 'new_group_mkmw42z8',
                },
                {
                  id: 'new_group_mkmw6ssq',
                },
                {
                  id: 'new_group_mkmw4bwd',
                },
                {
                  id: 'new_group_mkmwwr34',
                },
                {
                  id: 'new_group_mkmwxybe',
                },
                {
                  id: 'new_group_mkmw9e4d',
                },
              ],
            },
            {
              name: 'South Boston Demo Permits',
              id: '8408065818',
              groups: [
                {
                  id: 'demo_permits_mkmwcg5r',
                },
                {
                  id: 'new_group_mkmwhy59',
                },
                {
                  id: 'new_group_mkmw9f3',
                },
                {
                  id: 'new_group_mkmwqj6q',
                },
                {
                  id: 'new_group_mkmwas3f',
                },
                {
                  id: 'new_group_mkmwvhed',
                },
                {
                  id: 'new_group_mkmwadnq',
                },
                {
                  id: 'new_group_mkmw2npa',
                },
                {
                  id: 'new_group_mkmw73zg',
                },
              ],
            },
            {
              name: 'South Boston Building Permits',
              id: '8408091896',
              groups: [
                {
                  id: 'building_permits_mkmw4jst',
                },
                {
                  id: 'new_group_mkmwnd47',
                },
                {
                  id: 'new_group_mkmw5w75',
                },
                {
                  id: 'new_group_mkmw8pjx',
                },
                {
                  id: 'new_group_mkmwkjj8',
                },
                {
                  id: 'new_group_mkmwkfyj',
                },
                {
                  id: 'new_group_mkmwbxyc',
                },
                {
                  id: 'new_group_mkmwrm3b',
                },
                {
                  id: 'new_group_mkmw20p3',
                },
              ],
            },
            {
              name: 'West End Demo Permits',
              id: '8408150483',
              groups: [
                {
                  id: 'demo_permits_mkmwcqjf',
                },
                {
                  id: 'new_group_mkmwdq3j',
                },
                {
                  id: 'new_group_mkmwnvgh',
                },
                {
                  id: 'new_group_mkmw3950',
                },
                {
                  id: 'new_group_mkmwtzym',
                },
                {
                  id: 'new_group_mkmwjgh4',
                },
                {
                  id: 'new_group_mkmwrbbn',
                },
                {
                  id: 'new_group_mkmwqjtg',
                },
                {
                  id: 'new_group_mkmwfm34',
                },
              ],
            },
            {
              name: 'West End Building Permits',
              id: '8408169565',
              groups: [
                {
                  id: 'building_permits_mkmwky6z',
                },
                {
                  id: 'new_group_mkmw91xx',
                },
                {
                  id: 'new_group_mkmw34wq',
                },
                {
                  id: 'new_group_mkmwybdy',
                },
                {
                  id: 'new_group_mkmwr0qm',
                },
                {
                  id: 'new_group_mkmwby0m',
                },
                {
                  id: 'new_group_mkmw34bt',
                },
                {
                  id: 'new_group_mkmwheqb',
                },
                {
                  id: 'new_group_mkmwtw5v',
                },
              ],
            },
            {
              name: 'Downtown/Financial District Demo Permits',
              id: '8408222645',
              groups: [
                {
                  id: 'demo_permits_mkmwvfeh',
                },
                {
                  id: 'new_group_mkmw6yn5',
                },
                {
                  id: 'new_group_mkmw4etw',
                },
                {
                  id: 'new_group_mkmwtqv9',
                },
                {
                  id: 'new_group_mkmwdf6x',
                },
                {
                  id: 'new_group_mkmwzxzz',
                },
                {
                  id: 'new_group_mkmw7nbt',
                },
                {
                  id: 'new_group_mkmw5ce8',
                },
                {
                  id: 'new_group_mkmw1fq6',
                },
              ],
            },
            {
              name: 'Downtown/Financial District Building Permits',
              id: '8408249417',
              groups: [
                {
                  id: 'building_permits_mkmw6erd',
                },
                {
                  id: 'new_group_mkmwhk9w',
                },
                {
                  id: 'new_group_mkmweez6',
                },
                {
                  id: 'new_group_mkmw2h1b',
                },
                {
                  id: 'new_group_mkmw4b88',
                },
                {
                  id: 'new_group_mkmwg0kg',
                },
                {
                  id: 'new_group_mkmws8r6',
                },
                {
                  id: 'new_group_mkmw1a0t',
                },
                {
                  id: 'new_group_mkmw8b3y',
                },
              ],
            },
            {
              name: 'Charlestown Demo Permits',
              id: '8408287538',
              groups: [
                {
                  id: 'demo_permits_mkmwd3wn',
                },
                {
                  id: 'new_group_mkmw9g0g',
                },
                {
                  id: 'new_group_mkmwtsq8',
                },
                {
                  id: 'new_group_mkmw73db',
                },
                {
                  id: 'new_group_mkmw7mhg',
                },
                {
                  id: 'new_group_mkmwmr27',
                },
                {
                  id: 'new_group_mkmw1jkz',
                },
                {
                  id: 'new_group_mkmw4rnb',
                },
                {
                  id: 'new_group_mkmw8955',
                },
              ],
            },
            {
              name: 'Charlestown Building Permits',
              id: '8408301039',
              groups: [
                {
                  id: 'building_permits_mkmw4wy8',
                },
                {
                  id: 'new_group_mkmwh2zn',
                },
                {
                  id: 'new_group_mkmw1g9s',
                },
                {
                  id: 'new_group_mkmwsp0n',
                },
                {
                  id: 'new_group_mkmwjjgy',
                },
                {
                  id: 'new_group_mkmwvxca',
                },
                {
                  id: 'new_group_mkmwvnhe',
                },
                {
                  id: 'new_group_mkmw5s9h',
                },
                {
                  id: 'new_group_mkmwy0q4',
                },
              ],
            },
            {
              name: 'Roslindale Demo Permits',
              id: '8408355607',
              groups: [
                {
                  id: 'demo_permits_mkmw41nm',
                },
                {
                  id: 'new_group_mkmw62vw',
                },
                {
                  id: 'new_group_mkmw18f9',
                },
                {
                  id: 'new_group_mkmwgdbg',
                },
                {
                  id: 'new_group_mkmwv7c7',
                },
                {
                  id: 'new_group_mkmw33e8',
                },
                {
                  id: 'new_group_mkmwch2p',
                },
                {
                  id: 'new_group_mkmwhf0c',
                },
                {
                  id: 'new_group_mkmw83nh',
                },
              ],
            },
            {
              name: 'Roslindale Building Permits',
              id: '8408374233',
              groups: [
                {
                  id: 'building_permits_mkmwry6q',
                },
                {
                  id: 'new_group_mkmwnbz0',
                },
                {
                  id: 'new_group_mkmwstap',
                },
                {
                  id: 'new_group_mkmw5861',
                },
                {
                  id: 'new_group_mkmwb331',
                },
                {
                  id: 'new_group_mkmwap9w',
                },
                {
                  id: 'new_group_mkmwmsaa',
                },
                {
                  id: 'new_group_mkmwpp4t',
                },
                {
                  id: 'new_group_mkmw7whf',
                },
              ],
            },
            {
              name: 'Mission Hill Demo Permits',
              id: '8408421040',
              groups: [
                {
                  id: 'demo_permits_mkmwnmrn',
                },
                {
                  id: 'new_group_mkmwext2',
                },
                {
                  id: 'new_group_mkmwpjpn',
                },
                {
                  id: 'new_group_mkmwevwd',
                },
                {
                  id: 'new_group_mkmwdq41',
                },
                {
                  id: 'new_group_mkmwaakj',
                },
                {
                  id: 'new_group_mkmwkx9x',
                },
                {
                  id: 'new_group_mkmww9vm',
                },
                {
                  id: 'new_group_mkmwzvp4',
                },
              ],
            },
            {
              name: 'Mission Hill Building Permits',
              id: '8408434924',
              groups: [
                {
                  id: 'building_permits_mkmwbxye',
                },
                {
                  id: 'new_group_mkmwf7e2',
                },
                {
                  id: 'new_group_mkmwx0sx',
                },
                {
                  id: 'new_group_mkmw5jhj',
                },
                {
                  id: 'new_group_mkmwhy9y',
                },
                {
                  id: 'new_group_mkmwbht1',
                },
                {
                  id: 'new_group_mkmwctc0',
                },
                {
                  id: 'new_group_mkmwse1g',
                },
                {
                  id: 'new_group_mkmwmr',
                },
              ],
            },
            {
              name: 'Somerville Demo Permits',
              id: '8533640824',
              groups: [
                {
                  id: 'demo_permits_mknbm131',
                },
                {
                  id: 'group_mknfvt7e',
                },
                {
                  id: 'group_mknfgfhy',
                },
                {
                  id: 'group_mknfqh7e',
                },
                {
                  id: 'group_mknf5a3q',
                },
                {
                  id: 'group_mknfz9k6',
                },
                {
                  id: 'group_mknfhnhr',
                },
                {
                  id: 'group_mknfjdmb',
                },
                {
                  id: 'group_mknf5k7r',
                },
              ],
            },
            {
              name: 'Somerville Building Permits',
              id: '8533649219',
              groups: [
                {
                  id: 'building_permits_mknbg9ye',
                },
                {
                  id: 'group_mknfr0f0',
                },
                {
                  id: 'group_mknfk0g5',
                },
                {
                  id: 'group_mknf6p5c',
                },
                {
                  id: 'group_mknfjwd7',
                },
                {
                  id: 'group_mknfy55n',
                },
                {
                  id: 'group_mknfb1qt',
                },
                {
                  id: 'group_mknfyt98',
                },
                {
                  id: 'group_mknfcrdr',
                },
              ],
            },
            {
              name: 'Downtown Demo Permits',
              id: '8533996117',
              groups: [
                {
                  id: 'demo_permits_mknbvt1z',
                },
                {
                  id: 'group_mknfsdmw',
                },
                {
                  id: 'group_mknfhjw',
                },
                {
                  id: 'group_mknfwp34',
                },
                {
                  id: 'group_mknffsxk',
                },
                {
                  id: 'group_mknf2x12',
                },
                {
                  id: 'group_mknf9spn',
                },
                {
                  id: 'group_mknfwdn9',
                },
                {
                  id: 'group_mknfkm8b',
                },
              ],
            },
            {
              name: 'Downtown Building Permits',
              id: '8534003289',
              groups: [
                {
                  id: 'building_permits_mknbgesw',
                },
                {
                  id: 'group_mknfngcr',
                },
                {
                  id: 'group_mknfk1tx',
                },
                {
                  id: 'group_mknf3ed3',
                },
                {
                  id: 'group_mknf1mvs',
                },
                {
                  id: 'group_mknfy20x',
                },
                {
                  id: 'group_mknfvfmx',
                },
                {
                  id: 'group_mknfb9zy',
                },
                {
                  id: 'group_mknfesk9',
                },
              ],
            },
            {
              name: 'Theater District Demo Permits',
              id: '8534012524',
              groups: [
                {
                  id: 'demo_permits_mknb61p2',
                },
                {
                  id: 'group_mknf166g',
                },
                {
                  id: 'group_mknfwt77',
                },
                {
                  id: 'group_mknfd7h8',
                },
                {
                  id: 'group_mknff0jy',
                },
                {
                  id: 'group_mknfssqf',
                },
                {
                  id: 'group_mknfecw6',
                },
                {
                  id: 'group_mknfpvab',
                },
                {
                  id: 'group_mknf6cq7',
                },
              ],
            },
            {
              name: 'Theater District Building Permits',
              id: '8534016439',
              groups: [
                {
                  id: 'building_permits_mknb9q3s',
                },
                {
                  id: 'group_mknfr1k',
                },
                {
                  id: 'group_mknf59am',
                },
                {
                  id: 'group_mknfm6bx',
                },
                {
                  id: 'group_mknf3c3r',
                },
                {
                  id: 'group_mknf5bms',
                },
                {
                  id: 'group_mknfbr40',
                },
                {
                  id: 'group_mknfhb4p',
                },
                {
                  id: 'group_mknf718d',
                },
              ],
            },
            {
              name: 'Framingham Demo Permits',
              id: '8558099912',
              groups: [
                {
                  id: 'group_mkngk3t4',
                },
                {
                  id: 'group_mknhnqkh',
                },
                {
                  id: 'group_mknh71yy',
                },
                {
                  id: 'group_mknhdbw',
                },
                {
                  id: 'group_mknhgpxp',
                },
                {
                  id: 'group_mknhqkdd',
                },
                {
                  id: 'group_mknhbrg6',
                },
                {
                  id: 'group_mknhwk6k',
                },
                {
                  id: 'group_mknhap9f',
                },
              ],
            },
            {
              name: 'Framingham Building Permits',
              id: '8558103496',
              groups: [
                {
                  id: 'group_mkngnf77',
                },
                {
                  id: 'group_mknhjqds',
                },
                {
                  id: 'group_mknh82p1',
                },
                {
                  id: 'group_mknhmb3n',
                },
                {
                  id: 'group_mknhmgss',
                },
                {
                  id: 'group_mknhxnpj',
                },
                {
                  id: 'group_mknhk3jt',
                },
                {
                  id: 'group_mknhhq89',
                },
                {
                  id: 'group_mknh8n9c',
                },
              ],
            },
            {
              name: 'Brighton/Allston Demo Permits',
              id: '8586995753',
              groups: [
                {
                  id: 'group_mknjj1vp',
                },
                {
                  id: 'group_mkp06jnb',
                },
                {
                  id: 'group_mkp0e3x4',
                },
                {
                  id: 'group_mkp0cb38',
                },
                {
                  id: 'group_mkp0w34y',
                },
                {
                  id: 'group_mkp0q08m',
                },
                {
                  id: 'group_mkp04yjc',
                },
                {
                  id: 'group_mkp0w1f8',
                },
                {
                  id: 'group_mkp0fer3',
                },
              ],
            },
            {
              name: 'Brighton/Allston Building Permits',
              id: '8587007280',
              groups: [
                {
                  id: 'group_mknjma4d',
                },
              ],
            },
            {
              name: 'Chestnut Hill Demo Permits',
              id: '8630189819',
              groups: [
                {
                  id: 'group_mknrr8aq',
                },
              ],
            },
            {
              name: 'Chestnut Hill Building Permits',
              id: '8630202527',
              groups: [
                {
                  id: 'group_mknr3tq7',
                },
                {
                  id: 'group_mkp41r67',
                },
                {
                  id: 'group_mkp49cfn',
                },
                {
                  id: 'group_mkp4ckjs',
                },
                {
                  id: 'group_mkp4bckb',
                },
                {
                  id: 'group_mkp4311w',
                },
                {
                  id: 'group_mkp4yxk9',
                },
                {
                  id: 'group_mkp42kba',
                },
                {
                  id: 'group_mkp4t5b1',
                },
              ],
            },
            {
              name: 'Waterfront Demo Permits',
              id: '8754872260',
              groups: [
                {
                  id: 'group_mkp82jq6',
                },
              ],
            },
            {
              name: 'Waterfront Building Permits',
              id: '8754880253',
              groups: [
                {
                  id: 'group_mkp86yck',
                },
              ],
            },
            {
              name: 'Sales Reports',
              id: '8969371210',
              groups: [
                {
                  id: 'topics',
                },
                {
                  id: 'group_mkq7hp37',
                },
              ],
            },
          ],
        },
      ],
    },
    account_id: 9477264,
  } as const;

  const folder2 = {
    data: {
      folders: [
        {
          name: 'Sales',
          id: '15054099',
          children: [
            {
              name: 'Permitting',
              id: '7344879001',
              groups: [
                {
                  id: 'topics',
                },
              ],
            },
            {
              name: 'Woburn Demo Permits',
              id: '7373487885',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group35555__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group59558__1',
                },
                {
                  id: 'new_group17592__1',
                },
                {
                  id: 'new_group30229__1',
                },
                {
                  id: 'new_group300__1',
                },
                {
                  id: 'new_group41398__1',
                },
              ],
            },
            {
              name: 'Woburn Building Permits',
              id: '7373491296',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group92965__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group88915__1',
                },
                {
                  id: 'new_group93351__1',
                },
                {
                  id: 'new_group75279__1',
                },
                {
                  id: 'new_group71904__1',
                },
                {
                  id: 'new_group12980__1',
                },
              ],
            },
            {
              name: 'Foxborough Demo Permits',
              id: '7373672845',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group47394__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group98324__1',
                },
                {
                  id: 'new_group317__1',
                },
                {
                  id: 'new_group43404__1',
                },
                {
                  id: 'new_group78854__1',
                },
                {
                  id: 'new_group24594__1',
                },
              ],
            },
            {
              name: 'Foxborough Building Permits',
              id: '7373680037',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group24569__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group76919__1',
                },
                {
                  id: 'new_group8132__1',
                },
                {
                  id: 'new_group31296__1',
                },
                {
                  id: 'new_group91994__1',
                },
                {
                  id: 'new_group76490__1',
                },
              ],
            },
            {
              name: 'Newton Demo Permits',
              id: '7373691615',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group69576__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group29969__1',
                },
                {
                  id: 'new_group76354__1',
                },
                {
                  id: 'new_group43008__1',
                },
                {
                  id: 'new_group99570__1',
                },
                {
                  id: 'new_group55428__1',
                },
              ],
            },
            {
              name: 'Newton Building Permits',
              id: '7373701141',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group94260__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group82849__1',
                },
                {
                  id: 'new_group21417__1',
                },
                {
                  id: 'new_group94855__1',
                },
                {
                  id: 'new_group11060__1',
                },
                {
                  id: 'new_group89798__1',
                },
              ],
            },
            {
              name: 'Norwood Demo Permits',
              id: '7373712377',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group3261__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group91155__1',
                },
                {
                  id: 'new_group40728__1',
                },
                {
                  id: 'new_group52945__1',
                },
                {
                  id: 'new_group92090__1',
                },
                {
                  id: 'new_group49385__1',
                },
              ],
            },
            {
              name: 'Norwood Building Permits',
              id: '7373718206',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group56077__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group38980__1',
                },
                {
                  id: 'new_group62632__1',
                },
                {
                  id: 'new_group80310__1',
                },
                {
                  id: 'new_group32189__1',
                },
                {
                  id: 'new_group22364__1',
                },
              ],
            },
            {
              name: 'West Roxbury Demo Permits',
              id: '7373734807',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group93797__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group59007__1',
                },
                {
                  id: 'new_group53054__1',
                },
                {
                  id: 'new_group6411__1',
                },
                {
                  id: 'new_group71351__1',
                },
                {
                  id: 'new_group71707__1',
                },
              ],
            },
            {
              name: 'West Roxbury Building Permits',
              id: '7373743678',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group91613__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group52477__1',
                },
                {
                  id: 'new_group241__1',
                },
                {
                  id: 'new_group58386__1',
                },
                {
                  id: 'new_group42731__1',
                },
                {
                  id: 'new_group94178__1',
                },
                {
                  id: 'group_mknfgw1',
                },
              ],
            },
            {
              name: 'Brookline Demo Permits',
              id: '7373754306',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group53098__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group82928__1',
                },
                {
                  id: 'new_group53424__1',
                },
                {
                  id: 'new_group43304__1',
                },
                {
                  id: 'new_group20202__1',
                },
                {
                  id: 'new_group99192__1',
                },
              ],
            },
            {
              name: 'Brookline Building Permits',
              id: '7373760356',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group93946__1',
                },
                {
                  id: 'new_group75727__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group81576__1',
                },
                {
                  id: 'new_group59754__1',
                },
                {
                  id: 'new_group41093__1',
                },
                {
                  id: 'new_group80993__1',
                },
              ],
            },
            {
              name: 'Weston Demo Permits',
              id: '7373782208',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group88530__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group64772__1',
                },
                {
                  id: 'new_group76659__1',
                },
                {
                  id: 'new_group59899__1',
                },
                {
                  id: 'new_group90759__1',
                },
                {
                  id: 'new_group33818__1',
                },
              ],
            },
            {
              name: 'Weston Building Permits',
              id: '7373788536',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group45225__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group44077__1',
                },
                {
                  id: 'new_group49242__1',
                },
                {
                  id: 'new_group74611__1',
                },
                {
                  id: 'new_group89755__1',
                },
                {
                  id: 'new_group32424__1',
                },
              ],
            },
            {
              name: 'Lexington Demo Permits',
              id: '7373799276',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group41438__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group29567__1',
                },
                {
                  id: 'new_group12230__1',
                },
                {
                  id: 'new_group97954__1',
                },
                {
                  id: 'new_group41053__1',
                },
                {
                  id: 'new_group71168__1',
                },
              ],
            },
            {
              name: 'Lexington Building Permits',
              id: '7373804917',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group12180__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group11803__1',
                },
                {
                  id: 'new_group6148__1',
                },
                {
                  id: 'new_group40983__1',
                },
                {
                  id: 'new_group32675__1',
                },
                {
                  id: 'new_group78887__1',
                },
              ],
            },
            {
              name: 'Milton Demo Permits',
              id: '7373885273',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group64095__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group94716__1',
                },
                {
                  id: 'new_group94348__1',
                },
                {
                  id: 'new_group69573__1',
                },
                {
                  id: 'new_group20850__1',
                },
                {
                  id: 'new_group20796__1',
                },
              ],
            },
            {
              name: 'Milton Building Permits',
              id: '7373891778',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group69411__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group58724__1',
                },
                {
                  id: 'new_group37270__1',
                },
                {
                  id: 'new_group21412__1',
                },
                {
                  id: 'new_group39423__1',
                },
                {
                  id: 'new_group34876__1',
                },
              ],
            },
            {
              name: 'Jamaica Plain Demo Permits',
              id: '7373933857',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group9155__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group76391__1',
                },
                {
                  id: 'new_group34396__1',
                },
                {
                  id: 'new_group78627__1',
                },
                {
                  id: 'new_group84339__1',
                },
                {
                  id: 'new_group86374__1',
                },
              ],
            },
            {
              name: 'Jamaica Plain Building Permits',
              id: '7373937648',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group92915__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group21809__1',
                },
                {
                  id: 'new_group65686__1',
                },
                {
                  id: 'new_group97621__1',
                },
                {
                  id: 'new_group32209__1',
                },
                {
                  id: 'new_group8150__1',
                },
              ],
            },
            {
              name: 'Easton Demo Permits',
              id: '7373945623',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group56749__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group24686__1',
                },
                {
                  id: 'new_group79384__1',
                },
                {
                  id: 'new_group21144__1',
                },
                {
                  id: 'new_group24059__1',
                },
                {
                  id: 'new_group39019__1',
                },
              ],
            },
            {
              name: 'Easton Building Permits',
              id: '7373951177',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group38176__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group68238__1',
                },
                {
                  id: 'new_group13322__1',
                },
                {
                  id: 'new_group52426__1',
                },
                {
                  id: 'new_group32464__1',
                },
                {
                  id: 'new_group19856__1',
                },
              ],
            },
            {
              name: 'Hingham Demo Permits',
              id: '7373968045',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group93021__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group17769__1',
                },
                {
                  id: 'new_group28409__1',
                },
                {
                  id: 'new_group62317__1',
                },
                {
                  id: 'new_group12907__1',
                },
                {
                  id: 'new_group12506__1',
                },
              ],
            },
            {
              name: 'Hingham Building Permits',
              id: '7373976575',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group53294__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group41567__1',
                },
                {
                  id: 'new_group29855__1',
                },
                {
                  id: 'new_group17988__1',
                },
                {
                  id: 'new_group74269__1',
                },
                {
                  id: 'new_group60454__1',
                },
              ],
            },
            {
              name: 'Needham Demo Permits',
              id: '7613622176',
              groups: [
                {
                  id: 'demo_permits__1',
                },
                {
                  id: 'new_group70964__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group79973__1',
                },
                {
                  id: 'new_group62294__1',
                },
                {
                  id: 'new_group14492__1',
                },
                {
                  id: 'new_group41419__1',
                },
                {
                  id: 'new_group50184__1',
                },
              ],
            },
            {
              name: 'Needham Building Permits',
              id: '7613624581',
              groups: [
                {
                  id: 'building_permits__1',
                },
                {
                  id: 'new_group10692__1',
                },
                {
                  id: 'new_group__1',
                },
                {
                  id: 'new_group48903__1',
                },
                {
                  id: 'new_group10746__1',
                },
                {
                  id: 'new_group85874__1',
                },
                {
                  id: 'new_group26040__1',
                },
                {
                  id: 'new_group33127__1',
                },
              ],
            },
            {
              name: 'Ready For Text Message',
              id: '7925400328',
              groups: [
                {
                  id: 'topics',
                },
                {
                  id: 'group_title',
                },
              ],
            },
            {
              name: 'Stoughton Demo Permits',
              id: '8110879408',
              groups: [
                {
                  id: 'demo_permits_mkkhj9s6',
                },
              ],
            },
            {
              name: 'Stoughton Building Permits',
              id: '8110880375',
              groups: [
                {
                  id: 'building_permits_mkkhxws',
                },
              ],
            },
            {
              name: 'Medway Demo Permits',
              id: '8186308372',
              groups: [
                {
                  id: 'demo_permits_mkkzreez',
                },
              ],
            },
            {
              name: 'Medway Building Permits',
              id: '8186311994',
              groups: [
                {
                  id: 'building_permits_mkkzfy03',
                },
              ],
            },
            {
              name: 'Medford Demo Permits',
              id: '8392055835',
              groups: [
                {
                  id: 'demo_permits_mkmtfwrc',
                },
              ],
            },
            {
              name: 'Medford Building Permits',
              id: '8392063359',
              groups: [
                {
                  id: 'building_permits_mkmtn214',
                },
              ],
            },
            {
              name: 'Boston Demo Permits',
              id: '8405763998',
              groups: [
                {
                  id: 'demo_permits_mkmw8m1d',
                },
              ],
            },
            {
              name: 'Boston Building Permits',
              id: '8405769164',
              groups: [
                {
                  id: 'building_permits_mkmwgz6t',
                },
              ],
            },
            {
              name: 'Hyde Park Demo Permits',
              id: '8405783735',
              groups: [
                {
                  id: 'demo_permits_mkmwajm',
                },
              ],
            },
            {
              name: 'Hyde Park Building Permits',
              id: '8405786257',
              groups: [
                {
                  id: 'building_permits_mkmwp31t',
                },
              ],
            },
            {
              name: 'Roxbury Demo Permits',
              id: '8405795762',
              groups: [
                {
                  id: 'demo_permits_mkmwztrz',
                },
              ],
            },
            {
              name: 'Roxbury Building Permits',
              id: '8405801153',
              groups: [
                {
                  id: 'building_permits_mkmw9egh',
                },
              ],
            },
            {
              name: 'Dorchester Demo Permits',
              id: '8405816586',
              groups: [
                {
                  id: 'demo_permits_mkmw4pvk',
                },
              ],
            },
            {
              name: 'Dorchester Building Permits',
              id: '8405819770',
              groups: [
                {
                  id: 'building_permits_mkmwm7kd',
                },
              ],
            },
            {
              name: 'East Boston Demo Permits',
              id: '8405834868',
              groups: [
                {
                  id: 'demo_permits_mkmw92yz',
                },
              ],
            },
            {
              name: 'East Boston Building Permits',
              id: '8405837368',
              groups: [
                {
                  id: 'building_permits_mkmwkrba',
                },
              ],
            },
            {
              name: 'Mattapan Demo Permits',
              id: '8405846453',
              groups: [
                {
                  id: 'demo_permits_mkmwsf0r',
                },
              ],
            },
            {
              name: 'Mattapan Building Permits',
              id: '8405848887',
              groups: [
                {
                  id: 'building_permits_mkmw5dkb',
                },
              ],
            },
            {
              name: 'Brighton Demo Permits',
              id: '8405856630',
              groups: [
                {
                  id: 'demo_permits_mkmw6trk',
                },
              ],
            },
            {
              name: 'Brighton Building Permits',
              id: '8405860293',
              groups: [
                {
                  id: 'building_permits_mkmwgrwg',
                },
              ],
            },
            {
              name: 'Allston Demo Permits',
              id: '8408035603',
              groups: [
                {
                  id: 'demo_permits_mkmw54f9',
                },
              ],
            },
            {
              name: 'Allston Building Permits',
              id: '8408046772',
              groups: [
                {
                  id: 'building_permits_mkmwv0w4',
                },
              ],
            },
            {
              name: 'South Boston Demo Permits',
              id: '8408107589',
              groups: [
                {
                  id: 'demo_permits_mkmwqh4v',
                },
              ],
            },
            {
              name: 'South Boston Building Permits',
              id: '8408131196',
              groups: [
                {
                  id: 'building_permits_mkmwpb6c',
                },
              ],
            },
            {
              name: 'West End Demo Permits',
              id: '8408186832',
              groups: [
                {
                  id: 'demo_permits_mkmwagz2',
                },
              ],
            },
            {
              name: 'West End Building Permits',
              id: '8408203334',
              groups: [
                {
                  id: 'building_permits_mkmwmqsd',
                },
              ],
            },
            {
              name: 'Downtown/Financial District Demo Permits',
              id: '8408264657',
              groups: [
                {
                  id: 'demo_permits_mkmw4rrm',
                },
              ],
            },
            {
              name: 'Downtown/Financial District Building Permits',
              id: '8408277135',
              groups: [
                {
                  id: 'building_permits_mkmwaxxt',
                },
              ],
            },
            {
              name: 'Charlestown Demo Permits',
              id: '8408314193',
              groups: [
                {
                  id: 'demo_permits_mkmw83j1',
                },
              ],
            },
            {
              name: 'Charlestown Building Permits',
              id: '8408327701',
              groups: [
                {
                  id: 'building_permits_mkmw3g4k',
                },
              ],
            },
            {
              name: 'Roslindale Demo Permits',
              id: '8408393568',
              groups: [
                {
                  id: 'demo_permits_mkmw82az',
                },
              ],
            },
            {
              name: 'Roslindale Building Permits',
              id: '8408404288',
              groups: [
                {
                  id: 'building_permits_mkmw5zh4',
                },
              ],
            },
            {
              name: 'Mission Hill Demo Permits',
              id: '8408449344',
              groups: [
                {
                  id: 'demo_permits_mkmwa9sw',
                },
              ],
            },
            {
              name: 'Mission Hill Building Permits',
              id: '8408463889',
              groups: [
                {
                  id: 'building_permits_mkmwayk7',
                },
              ],
            },
            {
              name: 'Somerville Demo Permits',
              id: '8533665736',
              groups: [
                {
                  id: 'demo_permits_mknbve52',
                },
              ],
            },
            {
              name: 'Somerville Building Permits',
              id: '8533670280',
              groups: [
                {
                  id: 'building_permits_mknbkad2',
                },
              ],
            },
            {
              name: 'Downtown Demo Permits',
              id: '8534006972',
              groups: [
                {
                  id: 'demo_permits_mknbh5es',
                },
              ],
            },
            {
              name: 'Downtown Building Permits',
              id: '8534009869',
              groups: [
                {
                  id: 'building_permits_mknbxde8',
                },
              ],
            },
            {
              name: 'Theater District Demo Permits',
              id: '8534020160',
              groups: [
                {
                  id: 'demo_permits_mknbkjp3',
                },
              ],
            },
            {
              name: 'Theater District Building Permits',
              id: '8534023424',
              groups: [
                {
                  id: 'building_permits_mknbr3vf',
                },
              ],
            },
            {
              name: 'Framingham Demo Permits',
              id: '8558116900',
              groups: [
                {
                  id: 'group_mkngg49z',
                },
              ],
            },
            {
              name: 'Framingham Building Permits',
              id: '8558120767',
              groups: [
                {
                  id: 'group_mkngm34v',
                },
              ],
            },
            {
              name: 'Brighton/Allston Demo Permits',
              id: '8587017221',
              groups: [
                {
                  id: 'group_mknjd6nj',
                },
              ],
            },
            {
              name: 'Brighton/Allston Building Permits',
              id: '8587030091',
              groups: [
                {
                  id: 'group_mknjazq7',
                },
              ],
            },
            {
              name: 'Chestnut Hill Demo Permits',
              id: '8630215157',
              groups: [
                {
                  id: 'group_mknr38pr',
                },
              ],
            },
            {
              name: 'Chestnut Hill Building Permits',
              id: '8630226232',
              groups: [
                {
                  id: 'group_mknr1915',
                },
              ],
            },
            {
              name: 'Waterfront Demo Permits',
              id: '8754886289',
              groups: [
                {
                  id: 'group_mkp8v4dg',
                },
              ],
            },
            {
              name: 'Waterfront Building Permits',
              id: '8754895369',
              groups: [
                {
                  id: 'group_mkp8xde3',
                },
              ],
            },
          ],
        },
      ],
    },
    account_id: 9477264,
  } as const;

  const doesnt: Board[] = [];

  for (const folder of folder1.data.folders) {
    for (const board of folder.children) {
      const match = /^(?<name>.+ ?)+(?<type>(demo|building)).*/i.exec(board.name);

      if (match) {
        const name = match.groups!.name.trim();
        const type = match.groups!.type.trim();

        const exists = boards.find((b) => {
          return (
            b.name.toLowerCase() === name.toLowerCase() &&
            b.type.toLowerCase() === (type.includes('demo') ? 'demo' : 'building') &&
            b.folder === folder.id
          );
        });

        if (!exists) {
          doesnt.push({
            name,
            type: type.toLowerCase().includes('demo') ? 'Demo' : 'Building',
            groupId: board.groups[0].id,
            folder: folder.id,
            id: board.id,
          });
        }
      }
    }
  }

  for (const folder of folder2.data.folders) {
    for (const board of folder.children) {
      const match = /^(?<name>.+ ?)+(?<type>(demo|building)).*/i.exec(board.name);

      if (match) {
        const name = match.groups!.name.trim();
        const type = match.groups!.type.trim();

        const exists = boards.find((b) => {
          return (
            b.name.toLowerCase() === name.toLowerCase() &&
            b.type.toLowerCase() === (type.includes('demo') ? 'demo' : 'building') &&
            b.folder === folder.id
          );
        });

        if (!exists) {
          doesnt.push({
            name,
            type: type.toLowerCase().includes('demo') ? 'Demo' : 'Building',
            groupId: board.groups[0].id,
            folder: folder.id,
            id: board.id,
            // @ts-ignore
            demo: type,
          });
        }
      }
    }
  }

  const sortedByName = doesnt.sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync(paths.BOARDS, JSON.stringify([...boards, ...sortedByName], null, 2));
  console.log(doesnt);
}

Check();
