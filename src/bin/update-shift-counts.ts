import load from '../load';

async function run() {
  const app = await load()

  const {project} = await app.act('role:Firebase,cmd:get', {project: '-KXRusJ0mcyPLzSSN-1F'})
  const {teams} = await app.act('role:Firebase,cmd:get', {teams: {projectKey: '-KXRusJ0mcyPLzSSN-1F'}});
  let allShifts:{$key:string, assigned:number}[] = [];
  let toChange = 0;

  for(let team of teams) {
    const {shifts} = await app.act('role:Firebase,cmd:get', {shifts: {teamKey: team.$key}});
    allShifts = allShifts.concat(shifts);
  }

  console.log('Shifts:', allShifts.length);

  for(let aShift of allShifts) {
    const {assignments} = await app.act({role:'Firebase',cmd:'get',
      assignments: {shiftKey: aShift.$key},
    });

    if (assignments.length !== aShift.assigned) {
      console.log(aShift.$key, aShift.assigned, '=>', assignments.length);
      toChange += 1;
      await app.act('role:Firebase,model:Shifts,cmd:update', {key: aShift.$key, values: {
        assigned: assignments.length
      }})
    }
  }

  console.log('Will change', toChange, 'of', allShifts.length);

 //
 //
 //
 // await app.act('role:Shifts,cmd:updateCounts', {key: '-KancZTdNAbvJ3HC2yYb'})
 // const {shift} = await app.act('role:Firebase,cmd:get', {shift: '-KancZTdNAbvJ3HC2yYb'});
 // console.log(shift);
}

run()
.then(() => {
  console.log('done')
  process.exit();
})
.catch(err => {
  console.error('Error:', err);
  process.exit()
});
